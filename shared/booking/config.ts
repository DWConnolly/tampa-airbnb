import type { BlockedRange, BlockSource } from './calendar.ts';
import type { PricingConfig } from './pricing.ts';
import type { StayRules } from './rules.ts';

/** Shape of data/booking-config.json (edited by the owner through pull requests). */
export interface BookingConfig {
  propertyId: string;
  timeZone: string;
  termsVersion: string;
  directBooking: {
    enabled: boolean;
    /** Inbox that receives booking requests (shown publicly via mailto:). A dedicated alias is recommended. */
    requestEmail: string;
  };
  rules: StayRules;
  pricing: PricingConfig;
  /** Every value must be true before booking requests open. */
  ownerConfirmations: Record<string, boolean>;
}

export type SourceStatus = 'ok' | 'stale' | 'not-configured';

/** Shape of public/calendar.json. Dates and sources only: never guest details. */
export interface CalendarDocument {
  version: 1;
  /** Time the blocked dates or booking settings last changed. */
  generatedAt: string;
  propertyId: string;
  timeZone: string;
  sources: Record<BlockSource, SourceStatus>;
  blocked: BlockedRange[];
  booking: PublicBookingSettings;
}

export interface PublicBookingSettings {
  /** True only when the owner enabled direct booking AND no readiness problems remain. */
  open: boolean;
  problems: string[];
  requestEmail: string;
  termsVersion: string;
  rules: StayRules;
  pricing: PricingConfig;
}

/** Reasons direct booking requests must stay closed. Empty means ready. */
export function readinessProblems(config: BookingConfig): string[] {
  const problems: string[] = [];
  if (!config.directBooking.enabled) problems.push('Direct booking is not enabled in data/booking-config.json.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(config.directBooking.requestEmail)) problems.push('No booking-request email address (directBooking.requestEmail) is configured.');
  for (const [item, confirmed] of Object.entries(config.ownerConfirmations)) {
    if (!confirmed) problems.push(`Owner has not confirmed: ${item}.`);
  }
  if (!(config.pricing.nightlyRate > 0)) problems.push('Nightly rate must be greater than zero.');
  if (config.rules.minLeadDays < 7) problems.push('Direct bookings must start more than 7 days out (minLeadDays ≥ 7).');
  return problems;
}

export function publicBookingSettings(config: BookingConfig): PublicBookingSettings {
  const problems = readinessProblems(config);
  return {
    open: problems.length === 0,
    problems,
    requestEmail: config.directBooking.requestEmail,
    termsVersion: config.termsVersion,
    rules: config.rules,
    pricing: config.pricing,
  };
}
