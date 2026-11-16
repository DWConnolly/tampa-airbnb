import type { IsoDate } from './dates.ts';

export type BlockSource = 'airbnb' | 'vrbo' | 'direct' | 'owner';
export const OTA_SOURCES = ['airbnb', 'vrbo'] as const;
export type OtaSource = (typeof OTA_SOURCES)[number];

/** A run of blocked nights. `end` is exclusive: it is the checkout date. */
export interface DateRange {
  start: IsoDate;
  end: IsoDate;
}

export interface BlockedRange extends DateRange {
  source: BlockSource;
}

/** A stay that occupies the home (as opposed to an availability block). */
export interface Reservation extends DateRange {
  id: string;
  source: BlockSource;
}

export interface Conflict {
  a: Reservation;
  b: Reservation;
}

// ISO dates compare correctly as strings.
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function isValidRange(range: DateRange): boolean {
  return range.start < range.end;
}

/** Sort and merge overlapping or back-to-back ranges. */
export function mergeRanges<T extends DateRange>(ranges: T[]): DateRange[] {
  const sorted = ranges.filter(isValidRange).map(({ start, end }) => ({ start, end })).sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  const merged: DateRange[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) {
      if (range.end > last.end) last.end = range.end;
    } else merged.push({ ...range });
  }
  return merged;
}

/** Merge ranges per source and return them sorted by date then source. */
export function mergeBySource(ranges: BlockedRange[]): BlockedRange[] {
  const bySource = new Map<BlockSource, BlockedRange[]>();
  for (const range of ranges) bySource.set(range.source, [...(bySource.get(range.source) ?? []), range]);
  return [...bySource.entries()]
    .flatMap(([source, list]) => mergeRanges(list).map((range) => ({ ...range, source })))
    .sort((a, b) => a.start.localeCompare(b.start) || a.source.localeCompare(b.source));
}

/** Keep only ranges that touch [from, to), trimmed to that window. */
export function clipRanges<T extends DateRange>(ranges: T[], from: IsoDate, to: IsoDate): T[] {
  return ranges
    .filter((range) => range.end > from && range.start < to)
    .map((range) => ({ ...range, start: range.start < from ? from : range.start, end: range.end > to ? to : range.end }));
}

export function isRangeFree(stay: DateRange, blocked: DateRange[]): boolean {
  return !blocked.some((range) => rangesOverlap(stay, range));
}

export function isNightBlocked(date: IsoDate, blocked: DateRange[]): boolean {
  return blocked.some((range) => range.start <= date && date < range.end);
}

/**
 * Double bookings: overlapping reservations that are different stays. Two events
 * from the same OTA feed are left to that OTA. OTA "not available" blocks (which
 * include echoes of our own direct.ics) are not reservations, so never conflict.
 */
export function findConflicts(reservations: Reservation[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < reservations.length; i++) {
    for (let j = i + 1; j < reservations.length; j++) {
      const a = reservations[i];
      const b = reservations[j];
      if (a.id === b.id && a.source === b.source) continue;
      if (a.source === b.source && a.source !== 'direct') continue;
      if (rangesOverlap(a, b)) conflicts.push({ a, b });
    }
  }
  return conflicts;
}
