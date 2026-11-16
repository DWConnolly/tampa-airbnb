import { addDays, todayInTimeZone, type IsoDate } from './dates.ts';
import type { OtaSource } from './calendar.ts';

export interface IcalEvent {
  uid: string;
  start: IsoDate;
  /** Exclusive end date (checkout). */
  end: IsoDate;
  summary: string;
}

export class IcalError extends Error {}

/** RFC 5545 §3.1: a CRLF followed by a space or tab continues the previous line. */
function unfold(text: string): string[] {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_match, char: string) => (char.toLowerCase() === 'n' ? '\n' : char));
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/**
 * Converts a DTSTART/DTEND value to a calendar date. All-day (VALUE=DATE),
 * floating, and TZID times use their written date; UTC times ("Z") are
 * converted to the property's time zone.
 */
function parseDateValue(value: string, timeZone: string): IsoDate {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!match) throw new IcalError(`Unsupported date value: ${value}`);
  const [, year, month, day, hour, minute, second, utc] = match;
  if (utc) {
    const instant = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
    return todayInTimeZone(timeZone, instant);
  }
  return `${year}-${month}-${day}`;
}

/**
 * Parses the VEVENTs of an iCalendar feed. Throws IcalError if the text is not a
 * calendar (for example, an HTML error page), so a broken feed is never
 * mistaken for "no bookings".
 */
export function parseIcal(text: string, timeZone: string): IcalEvent[] {
  const lines = unfold(text);
  if (!lines.some((line) => line.trim().toUpperCase() === 'BEGIN:VCALENDAR') || !lines.some((line) => line.trim().toUpperCase() === 'END:VCALENDAR')) {
    throw new IcalError('Response is not a complete iCalendar document');
  }
  const events: IcalEvent[] = [];
  let current: Record<string, { params: string; value: string }> | null = null;
  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    if (upper === 'BEGIN:VEVENT') { current = {}; continue; }
    if (upper === 'END:VEVENT') {
      if (current) {
        const status = current.STATUS?.value.trim().toUpperCase();
        if (status !== 'CANCELLED' && current.DTSTART) {
          const start = parseDateValue(current.DTSTART.value, timeZone);
          let end = current.DTEND ? parseDateValue(current.DTEND.value, timeZone) : addDays(start, 1);
          // A missing or same-day end still occupies the start night.
          if (end <= start) end = addDays(start, 1);
          events.push({ uid: current.UID?.value.trim() ?? `${start}/${end}`, start, end, summary: unescapeText(current.SUMMARY?.value ?? '').trim() });
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const [name, ...params] = line.slice(0, colon).split(';');
    current[name.toUpperCase()] = { params: params.join(';'), value: line.slice(colon + 1) };
  }
  return events;
}

/**
 * Airbnb exports guest stays as "Reserved" and manual/imported/prep-time
 * blocks as "Airbnb (Not available)". Vrbo exports stays as "Reserved - <name>"
 * (guest names are discarded) and blocks as "Blocked". Unknown summaries are
 * treated as reservations so that real double bookings are never hidden.
 */
export function classifyOtaEvent(source: OtaSource, summary: string): 'reservation' | 'blocked' {
  const text = summary.toLowerCase();
  if (source === 'airbnb' && /not available|blocked/.test(text)) return 'blocked';
  if (source === 'vrbo' && /^blocked\b|not available/.test(text)) return 'blocked';
  return 'reservation';
}

function fold(line: string): string {
  const parts: string[] = [];
  for (let index = 0; index < line.length; index += index === 0 ? 75 : 74) parts.push(line.slice(index, index + (index === 0 ? 75 : 74)));
  return parts.join('\r\n ');
}

const compact = (date: IsoDate) => date.replace(/-/g, '');

/** Builds an all-day iCalendar feed for Airbnb/Vrbo to import. */
export function buildIcal(events: IcalEvent[], options: { prodId: string; calendarName: string; stamp: Date }): string {
  const stamp = options.stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${options.prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.calendarName)}`,
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${escapeText(event.uid)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(event.start)}`,
      `DTEND;VALUE=DATE:${compact(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
