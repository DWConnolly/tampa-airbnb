// Bliss Sync: rebuilds public/calendar.json and public/direct.ics.
// Run by .github/workflows/calendar-sync.yml on data/ pushes, manual runs and a
// daily 5 AM Tampa-time fallback (Node 22.18+ runs TypeScript directly).
// Local dry run without secrets: node scripts/sync/calendar-sync.ts
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import type { OtaSource } from '../../shared/booking/calendar.ts';
import type { BookingConfig, CalendarDocument } from '../../shared/booking/config.ts';
import { todayInTimeZone } from '../../shared/booking/dates.ts';
import { parseIcal } from '../../shared/booking/ical.ts';
import type { DirectBooking } from '../../shared/booking/bookings.ts';
import { buildCalendar, type FeedResult, type OwnerBlock } from '../../shared/booking/sync.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const paths = {
  config: `${root}data/booking-config.json`,
  ownerBlocks: `${root}data/owner-blocks.json`,
  directBookings: `${root}data/direct-bookings.json`,
  calendar: `${root}public/calendar.json`,
  ics: `${root}public/direct.ics`,
};
const env = process.env;

const readJson = async <T>(path: string, fallback: T): Promise<T> => {
  try { return JSON.parse(await readFile(path, 'utf8')) as T; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw error;
  }
};
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

async function fetchFeed(source: OtaSource, url: string | undefined, timeZone: string): Promise<FeedResult> {
  if (!url?.trim()) return { state: 'not-configured' };
  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url.trim(), { headers: { 'User-Agent': 'BlissSync/1.0 (+calendar sync)' }, signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { state: 'ok', events: parseIcal(await response.text(), timeZone) };
    } catch (error) {
      // Never log the URL: it is a secret that grants calendar access.
      lastError = (error as Error).message;
      console.warn(`${source}: attempt ${attempt} failed: ${lastError}`);
      if (attempt < 3) await sleep(attempt * 5_000);
    }
  }
  return { state: 'error', error: lastError };
}

async function syncOnce(): Promise<{ changed: boolean; alerts: string[] }> {
  const config = await readJson<BookingConfig>(paths.config, null as unknown as BookingConfig);
  const ownerBlocks = await readJson<OwnerBlock[]>(paths.ownerBlocks, []);
  const previous = await readJson<CalendarDocument | null>(paths.calendar, null);
  const alerts: string[] = [];
  const directBookings = await readJson<DirectBooking[]>(paths.directBookings, []);
  const [airbnb, vrbo] = await Promise.all([
    fetchFeed('airbnb', env.AIRBNB_ICAL_URL, config.timeZone),
    fetchFeed('vrbo', env.VRBO_ICAL_URL, config.timeZone),
  ]);
  const now = new Date();
  const result = buildCalendar({
    config, ownerBlocks, directBookings, previous, now,
    today: todayInTimeZone(config.timeZone, now),
    feeds: { airbnb, vrbo },
    acceptEmptyFeeds: env.ACCEPT_EMPTY_FEEDS === 'true',
  });
  alerts.push(...result.alerts);
  if (result.changed || !previous) {
    await writeFile(paths.calendar, json(result.calendar));
    await writeFile(paths.ics, result.ics);
  }
  console.log(`Calendar: ${result.calendar.blocked.length} blocked range(s); sources ${JSON.stringify(result.calendar.sources)}; ${result.changed ? 'changed' : 'unchanged'}.`);
  return { changed: result.changed || !previous, alerts };
}

const outcome = await syncOnce();
const alerts = outcome.alerts;
for (const alert of alerts) console.warn(`ALERT: ${alert}`);
if (env.ALERTS_FILE) await writeFile(env.ALERTS_FILE, alerts.map((alert) => `- ${alert}`).join('\n'));
if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `changed=${outcome.changed}\nalerts=${alerts.length > 0}\n`);
