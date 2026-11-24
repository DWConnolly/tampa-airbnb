import { enquiryEndpoint } from '../config/enquiry.ts';
import { enquiryPayload, type EnquiryDraft } from './intake.ts';

export type SubmissionResult = { accepted: true } | { accepted: false; message: string };

export async function submitEnquiry(draft: EnquiryDraft, propertyName: string, send: typeof fetch = fetch): Promise<SubmissionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await send(enquiryEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(enquiryPayload(draft, propertyName)),
      signal: controller.signal,
    });
    if (response.status === 429) return { accepted: false, message: 'Too many inquiries right now. Your draft is kept; please wait before sending again.' };
    if (response.status === 400 || response.status === 422) return { accepted: false, message: 'The form service rejected this inquiry. Check your dates and contact details, then try again. Your draft is kept.' };
    if (!response.ok) return { accepted: false, message: 'The form service could not accept your inquiry. Your draft is kept; please try later.' };
    const result: unknown = await response.json();
    if (typeof result !== 'object' || result === null || !('ok' in result) || result.ok !== true) {
      return { accepted: false, message: 'We could not confirm receipt. Your draft is kept. Please check for a reply before sending again to avoid a duplicate.' };
    }
    return { accepted: true };
  } catch {
    return { accepted: false, message: 'We could not confirm receipt because the connection failed or timed out. Your draft is kept. Check your connection and for a reply before sending again to avoid a duplicate.' };
  } finally {
    clearTimeout(timeout);
  }
}
