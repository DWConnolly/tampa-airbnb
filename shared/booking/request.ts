import { daysBetween, type IsoDate } from './dates.ts';
import { formatMoney, formatRate, type Quote } from './pricing.ts';

/**
 * Request-to-book: the site never stores or transmits guest details itself.
 * It prefills an email (mailto:) that the guest sends to the owner, who reviews
 * it and replies with a Stripe invoice. Nobody is charged on this website.
 */
export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  arrivalTime: string;
  purpose: string;
  pets: 'no' | 'yes';
  petDetails: string;
  notes: string;
}

export const ACKNOWLEDGEMENTS = ['houseRules', 'cancellation', 'rentalTerms', 'requestOnly'] as const;
export type Acknowledgement = (typeof ACKNOWLEDGEMENTS)[number];

export const STAY_PURPOSES = ['Vacation or getaway', 'Visiting family or friends', 'Work trip', 'Event in Tampa', 'Relocation or temporary housing', 'Other'] as const;

export const NOTES_MAX = 500;

export type RequestField = keyof GuestDetails | Acknowledgement;

export function validateGuestDetails(details: GuestDetails, acknowledged: Record<Acknowledgement, boolean>): Partial<Record<RequestField, string>> {
  const errors: Partial<Record<RequestField, string>> = {};
  if (details.name.trim().length < 2) errors.name = 'Enter the full name of the guest making the request.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email.trim())) errors.email = 'Enter a valid email address so the host can reply.';
  if (details.phone.replace(/\D/g, '').length < 7) errors.phone = 'Enter a phone number, including the area code.';
  if (!details.arrivalTime.trim()) errors.arrivalTime = 'Enter an estimated arrival time.';
  if (!details.purpose) errors.purpose = 'Choose the purpose of your stay.';
  if (details.pets === 'yes' && !details.petDetails.trim()) errors.petDetails = 'Tell the host what pets you would bring.';
  if (details.notes.length > NOTES_MAX) errors.notes = `Keep notes under ${NOTES_MAX} characters.`;
  const ackMessages: Record<Acknowledgement, string> = {
    houseRules: 'Please confirm you have read and agree to the house rules.',
    cancellation: 'Please confirm you have read the cancellation policy.',
    rentalTerms: 'Please confirm you agree to the rental terms.',
    requestOnly: 'Please confirm you understand this is a request, not a confirmed booking.',
  };
  for (const key of ACKNOWLEDGEMENTS) if (!acknowledged[key]) errors[key] = ackMessages[key];
  return errors;
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Short, PII-free reference the owner can reuse as the id in data/direct-bookings.json. */
export function requestReference(checkIn: IsoDate, randomValues: Uint8Array): string {
  const suffix = Array.from(randomValues.slice(0, 4), (value) => REFERENCE_ALPHABET[value % REFERENCE_ALPHABET.length]).join('');
  return `BB-${checkIn.slice(2).replace(/-/g, '')}-${suffix}`;
}

export interface RequestEmailInput {
  propertyName: string;
  reference: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
  details: GuestDetails;
  quote: Quote | null;
  termsVersion: string;
}

const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();

export function buildRequestEmail(input: RequestEmailInput): { subject: string; body: string } {
  const { details, quote } = input;
  const nights = daysBetween(input.checkIn, input.checkOut);
  const lines = [
    `Booking request ${input.reference} for ${input.propertyName}`,
    '',
    `Check-in: ${input.checkIn}`,
    `Checkout: ${input.checkOut} (${nights} ${nights === 1 ? 'night' : 'nights'})`,
    `Guests: ${input.guests}`,
    '',
    `Name: ${oneLine(details.name)}`,
    `Email: ${oneLine(details.email)}`,
    `Phone: ${oneLine(details.phone)}`,
    `Estimated arrival: ${oneLine(details.arrivalTime)}`,
    `Purpose of stay: ${oneLine(details.purpose)}`,
    `Pets: ${details.pets === 'yes' ? `Yes - ${oneLine(details.petDetails)}` : 'No'}`,
    `Notes: ${details.notes.trim() || 'None'}`,
  ];
  if (quote) {
    const money = (cents: number) => formatMoney(cents, quote.currency);
    lines.push(
      '',
      'Estimate shown on the website (final amount is on the host\'s invoice):',
      `  Lodging: ${money(quote.lodging)}`,
      `  Cleaning fee: ${money(quote.cleaning)}`,
      ...quote.taxes.map((tax) => `  ${tax.label} (${formatRate(tax.rate)}): ${money(tax.amount)}`),
      `  Estimated total: ${money(quote.total)}`,
    );
  }
  lines.push(
    '',
    `I have read and agree to the house rules, cancellation policy and rental terms (version ${input.termsVersion}).`,
    'I understand this is a request: the dates are not held and nothing is charged until the host approves it and I pay the invoice the host emails me.',
  );
  return { subject: `Booking request ${input.reference}: ${input.checkIn} to ${input.checkOut}`, body: lines.join('\r\n') };
}

export function mailtoUrl(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
