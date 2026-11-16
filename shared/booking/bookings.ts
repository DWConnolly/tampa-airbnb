import type { IsoDate } from './dates.ts';

/**
 * Shape of each entry in data/direct-bookings.json, added by the owner after
 * approving a request and receiving payment. Dates only: never guest details.
 */
export interface DirectBooking {
  /** Request reference from the guest's email (e.g. BB-270107-K4P9) or any owner-chosen ID. */
  id: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  status: 'confirmed' | 'cancelled';
}
