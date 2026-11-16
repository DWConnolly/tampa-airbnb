// Build-time view of data/booking-config.json. Live availability and the
// published booking settings are read at runtime from public/calendar.json.
import rawConfig from '../../data/booking-config.json';
import { readinessProblems, type BookingConfig } from '../../shared/booking/config.ts';

export const bookingConfig = rawConfig as unknown as BookingConfig;

// Direct-booking copy and links appear on the home page only when the owner has
// enabled direct booking and confirmed rates, taxes, policies, licences and insurance.
export const directBookingReady = bookingConfig.directBooking.enabled && readinessProblems(bookingConfig).length === 0;
export const directEnquiryAvailable = !directBookingReady && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(bookingConfig.directBooking.requestEmail);
export const policiesConfirmed = bookingConfig.ownerConfirmations.policies === true;
export const minLeadDays = bookingConfig.rules.minLeadDays;
