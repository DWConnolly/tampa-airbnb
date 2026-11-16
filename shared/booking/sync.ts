import { clipRanges, findConflicts, isValidRange, mergeBySource, OTA_SOURCES, type BlockedRange, type BlockSource, type Conflict, type OtaSource, type Reservation } from './calendar.ts';
import { publicBookingSettings, type BookingConfig, type CalendarDocument, type SourceStatus } from './config.ts';
import { addDays, isIsoDate, type IsoDate } from './dates.ts';
import { buildIcal, classifyOtaEvent, type IcalEvent } from './ical.ts';
import type { DirectBooking } from './bookings.ts';

/** Shape of each entry in data/owner-blocks.json. `end` is the day AFTER the last blocked night. */
export interface OwnerBlock {
  start: IsoDate;
  end: IsoDate;
  /** Private reminder for the owner. Do not put guest names or contact details here. */
  note?: string;
}

export type FeedResult =
  | { state: 'not-configured' }
  | { state: 'error'; error: string }
  | { state: 'ok'; events: IcalEvent[] };

export interface SyncInput {
  config: BookingConfig;
  ownerBlocks: OwnerBlock[];
  directBookings: DirectBooking[];
  feeds: Record<OtaSource, FeedResult>;
  previous: CalendarDocument | null;
  today: IsoDate;
  now: Date;
  /** Owner override: accept a feed that suddenly has no future events. */
  acceptEmptyFeeds?: boolean;
}

export interface SyncOutput {
  calendar: CalendarDocument;
  ics: string;
  changed: boolean;
  conflicts: Conflict[];
  alerts: string[];
}

export class DataValidationError extends Error {}

const HORIZON_DAYS = 730;

function validateData(ownerBlocks: OwnerBlock[], directBookings: DirectBooking[]): void {
  const problems: string[] = [];
  ownerBlocks.forEach((block, index) => {
    if (!isIsoDate(block.start) || !isIsoDate(block.end) || block.end <= block.start) problems.push(`owner-blocks.json entry ${index + 1}: start/end must be YYYY-MM-DD dates with end after start.`);
  });
  const ids = new Set<string>();
  directBookings.forEach((booking, index) => {
    if (!booking.id) problems.push(`direct-bookings.json entry ${index + 1}: missing id.`);
    if (ids.has(booking.id)) problems.push(`direct-bookings.json: duplicate id ${booking.id}.`);
    ids.add(booking.id);
    if (!isIsoDate(booking.checkIn) || !isIsoDate(booking.checkOut) || booking.checkOut <= booking.checkIn) problems.push(`direct-bookings.json entry ${index + 1}: invalid dates.`);
    if (!['confirmed', 'cancelled'].includes(booking.status)) problems.push(`direct-bookings.json entry ${index + 1}: status must be confirmed or cancelled.`);
  });
  if (problems.length) throw new DataValidationError(problems.join('\n'));
}

/** Short stable public identifier so feeds don't expose booking references. */
export function publicUid(id: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index++) hash = Math.imul(hash ^ id.charCodeAt(index), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function withoutTimestamp(document: CalendarDocument | null): string {
  if (!document) return '';
  return JSON.stringify({ ...document, generatedAt: undefined });
}

/** Direct booking requests must close while OTA availability is unknown; Airbnb is live, so its feed is required. */
function withFeedSafety(booking: CalendarDocument['booking'], sources: Record<BlockSource, SourceStatus>): CalendarDocument['booking'] {
  const problems = [...booking.problems];
  for (const source of OTA_SOURCES) {
    if (sources[source] === 'stale') problems.push(`The ${source} calendar feed is stale; direct booking is paused until it syncs again.`);
  }
  if (sources.airbnb === 'not-configured') problems.push('The Airbnb calendar feed (AIRBNB_ICAL_URL) is not configured.');
  return { ...booking, problems, open: problems.length === 0 };
}

/**
 * Builds the master calendar. Safety rules:
 * - A failing, missing, or suddenly empty OTA feed keeps its last good blocks.
 * - Overlapping reservations are reported, and every overlapping range stays
 *   blocked: nothing is ever unblocked because of a conflict.
 * - Invalid owner data throws, so the previous calendar stays published.
 */
export function buildCalendar(input: SyncInput): SyncOutput {
  const { config, today } = input;
  validateData(input.ownerBlocks, input.directBookings);
  const until = addDays(today, HORIZON_DAYS);
  const alerts: string[] = [];
  const blocks: BlockedRange[] = [];
  const reservations: Reservation[] = [];
  const sources = { direct: 'ok', owner: 'ok' } as Record<BlockSource, SourceStatus>;
  const previousBlocks = (source: BlockSource) => clipRanges((input.previous?.blocked ?? []).filter((range) => range.source === source), today, until);

  for (const source of OTA_SOURCES) {
    const feed = input.feeds[source];
    const lastGood = previousBlocks(source);
    if (feed.state === 'ok') {
      const future = clipRanges(feed.events.filter(isValidRange), today, until);
      if (!future.length && lastGood.length && !input.acceptEmptyFeeds) {
        sources[source] = 'stale';
        blocks.push(...lastGood);
        alerts.push(`${source} feed returned no upcoming dates although ${lastGood.length} blocked range(s) were published before. Kept the last good dates. If every booking really was cancelled, run the Calendar sync workflow manually with "accept_empty_feeds".`);
        continue;
      }
      sources[source] = 'ok';
      for (const event of future) {
        blocks.push({ start: event.start, end: event.end, source });
        if (classifyOtaEvent(source, event.summary) === 'reservation') reservations.push({ id: event.uid, start: event.start, end: event.end, source });
      }
    } else if (feed.state === 'error') {
      sources[source] = 'stale';
      blocks.push(...lastGood);
      alerts.push(`${source} feed failed (${feed.error}). Kept the last good dates (${lastGood.length} range(s)).`);
    } else if (lastGood.length) {
      sources[source] = 'stale';
      blocks.push(...lastGood);
      alerts.push(`${source} iCal URL secret is missing, but ${lastGood.length} ${source} range(s) were published before. Kept them; restore the secret.`);
    } else sources[source] = 'not-configured';
  }

  const confirmed = input.directBookings.filter((booking) => booking.status === 'confirmed');
  for (const booking of confirmed) {
    blocks.push({ start: booking.checkIn, end: booking.checkOut, source: 'direct' });
    reservations.push({ id: booking.id, start: booking.checkIn, end: booking.checkOut, source: 'direct' });
  }
  for (const block of input.ownerBlocks) blocks.push({ start: block.start, end: block.end, source: 'owner' });

  const conflicts = findConflicts(clipRanges(reservations, today, until));
  for (const { a, b } of conflicts) {
    alerts.push(`Possible double booking: ${a.source} ${a.start} → ${a.end} overlaps ${b.source} ${b.start} → ${b.end}. Both stays remain blocked; resolve with the guests and refund one booking if needed.`);
  }

  const draft: CalendarDocument = {
    version: 1,
    generatedAt: input.now.toISOString(),
    propertyId: config.propertyId,
    timeZone: config.timeZone,
    sources,
    blocked: mergeBySource(clipRanges(blocks, today, until)),
    booking: withFeedSafety(publicBookingSettings(config), sources),
  };
  const changed = withoutTimestamp(draft) !== withoutTimestamp(input.previous);
  const calendar = changed || !input.previous ? draft : { ...draft, generatedAt: input.previous.generatedAt };

  const feedEvents: IcalEvent[] = [
    ...confirmed.filter((booking) => booking.checkOut > today).map((booking) => ({ uid: `direct-${publicUid(booking.id)}@${config.propertyId}`, start: booking.checkIn, end: booking.checkOut, summary: 'Reserved (direct booking)' })),
    ...input.ownerBlocks.filter((block) => block.end > today).map((block) => ({ uid: `owner-${publicUid(`${block.start}/${block.end}`)}@${config.propertyId}`, start: block.start, end: block.end, summary: 'Not available (owner block)' })),
  ].sort((a, b) => a.start.localeCompare(b.start));
  const ics = buildIcal(feedEvents, { prodId: `-//${config.propertyId}//Bliss Sync//EN`, calendarName: 'Blue Bliss direct bookings', stamp: new Date(calendar.generatedAt) });

  return { calendar, ics, changed, conflicts, alerts };
}
