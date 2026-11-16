// Build-time view of data/booking-config.json. Live availability and the
// published booking settings are read at runtime from public/calendar.json.
import rawConfig from '../../data/booking-config.json';
import { readinessProblems, type BookingConfig } from '../../shared/booking/config.ts';
import { policiesHaveOpenItems } from './policies';

export const bookingConfig = rawConfig as unknown as BookingConfig;

// Direct-booking copy and links appear on the home page only when the owner has
// enabled direct booking and confirmed rates, taxes, policies, licences and insurance.
// Policies count as confirmed only once the flag is set AND no "Owner to confirm" text remains.
export const policiesConfirmed = bookingConfig.ownerConfirmations.policies === true && !policiesHaveOpenItems;
export const directBookingReady = bookingConfig.directBooking.enabled && readinessProblems(bookingConfig).length === 0 && policiesConfirmed;
export const minLeadDays = bookingConfig.rules.minLeadDays;
