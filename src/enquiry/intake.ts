import { validateStay, stayErrorMessages, type StayRules } from '../../shared/booking/rules.ts';
import { NOTES_MAX } from '../../shared/booking/request.ts';

export interface EnquiryDraft {
  checkIn: string;
  checkOut: string;
  guests: number;
  name: string;
  email: string;
  notes: string;
}

export const emptyEnquiry: EnquiryDraft = { checkIn: '', checkOut: '', guests: 2, name: '', email: '', notes: '' };

export function dateErrors(draft: EnquiryDraft, rules: StayRules, today: string): string[] {
  // Enquiries check stay constraints only; no claim of live availability is made.
  return validateStay(draft, rules, today, []).map(code => stayErrorMessages[code]);
}

export function contactErrors(draft: EnquiryDraft): string[] {
  const errors: string[] = [];
  if (draft.name.trim().length < 2 || draft.name.length > 100) errors.push('Enter your name (2–100 characters).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim()) || draft.email.length > 254) errors.push('Enter a valid email address so the host can follow up.');
  if (draft.notes.length > NOTES_MAX) errors.push(`Keep your notes within ${NOTES_MAX} characters.`);
  return errors;
}

export function enquiryPayload(draft: EnquiryDraft, propertyName: string) {
  const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();
  return {
    subject: `Availability enquiry for ${propertyName}`,
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
    guests: draft.guests,
    name: oneLine(draft.name),
    email: draft.email.trim(),
    notes: draft.notes.trim(),
    message: 'Availability enquiry only. The host confirms dates and price. No dates are held and no payment is taken.',
  };
}
