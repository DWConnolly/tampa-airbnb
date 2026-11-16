import { isRangeFree, type DateRange } from './calendar.ts';
import { addDays, daysBetween, isIsoDate, type IsoDate } from './dates.ts';

export interface StayRules {
  /** Direct check-in must be MORE than this many days after today (property time zone). */
  minLeadDays: number;
  minNights: number;
  maxNights: number;
  maxGuests: number;
  /** How far ahead direct bookings may start. */
  bookingHorizonDays: number;
}

export interface StayRequest {
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
}

export type StayErrorCode =
  | 'invalid-dates'
  | 'too-soon'
  | 'too-far'
  | 'too-short'
  | 'too-long'
  | 'invalid-guests'
  | 'too-many-guests'
  | 'unavailable';

export const stayErrorMessages: Record<StayErrorCode, string> = {
  'invalid-dates': 'Choose a valid check-in and checkout date.',
  'too-soon': 'Direct bookings must start more than 7 days from today. For sooner stays, book on Airbnb.',
  'too-far': 'Those dates are further ahead than direct bookings are open.',
  'too-short': 'That stay is shorter than the minimum number of nights.',
  'too-long': 'That stay is longer than the maximum number of nights.',
  'invalid-guests': 'Choose at least one guest.',
  'too-many-guests': 'The home accommodates up to 6 guests.',
  unavailable: 'Some of those nights are already booked.',
};

/** First check-in date allowed for a direct booking. */
export function earliestDirectCheckIn(today: IsoDate, rules: Pick<StayRules, 'minLeadDays'>): IsoDate {
  return addDays(today, rules.minLeadDays + 1);
}

export function latestDirectCheckIn(today: IsoDate, rules: Pick<StayRules, 'bookingHorizonDays'>): IsoDate {
  return addDays(today, rules.bookingHorizonDays);
}

export function isDirectCheckInAllowed(checkIn: IsoDate, today: IsoDate, rules: Pick<StayRules, 'minLeadDays'>): boolean {
  return daysBetween(today, checkIn) > rules.minLeadDays;
}

export function validateStay(request: StayRequest, rules: StayRules, today: IsoDate, blocked: DateRange[]): StayErrorCode[] {
  const { checkIn, checkOut, guests } = request;
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) return ['invalid-dates'];
  const errors: StayErrorCode[] = [];
  const nights = daysBetween(checkIn, checkOut);
  if (!isDirectCheckInAllowed(checkIn, today, rules)) errors.push('too-soon');
  if (checkIn > latestDirectCheckIn(today, rules)) errors.push('too-far');
  if (nights < rules.minNights) errors.push('too-short');
  if (nights > rules.maxNights) errors.push('too-long');
  if (!Number.isInteger(guests) || guests < 1) errors.push('invalid-guests');
  else if (guests > rules.maxGuests) errors.push('too-many-guests');
  if (!isRangeFree({ start: checkIn, end: checkOut }, blocked)) errors.push('unavailable');
  return errors;
}
