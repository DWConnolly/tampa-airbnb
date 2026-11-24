import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingConfig, enquiryAvailable } from '../config/booking';
import { property, siteCopy } from '../config/siteConfig';
import { earliestDirectCheckIn, latestDirectCheckIn } from '../../shared/booking/rules.ts';
import { todayInTimeZone, addDays, isIsoDate } from '../../shared/booking/dates.ts';
import { NOTES_MAX } from '../../shared/booking/request.ts';
import { EnquiryContext } from '../enquiry/context';
import { emptyEnquiry, dateErrors, contactErrors, type EnquiryDraft } from '../enquiry/intake';
import { submitEnquiry } from '../enquiry/submit';
import { enquiryEndpoint } from '../config/enquiry';
import { pageRoutes } from '../config/routes';

export default function EnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EnquiryDraft>(emptyEnquiry);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [submission, setSubmission] = useState<'idle' | 'pending' | 'accepted'>('idle');
  const sending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const errorPanel = useRef<HTMLDivElement>(null);
  const today = todayInTimeZone(bookingConfig.timeZone);
  const rules = bookingConfig.rules;
  const titles = ['When would you like to visit?', 'How can the host reach you?', 'Review your inquiry'];

  const launch = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  };
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    const panel = dialog.current!;
    const fallbackLauncher = launcher.current;
    panel.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    title.current?.focus();
    return () => {
      panel.close();
      document.body.style.overflow = previousOverflow;
      const target = opener.current;
      if (target?.isConnected && target.getClientRects().length) target.focus();
      else fallbackLauncher?.focus();
    };
  }, [open]);
  useEffect(() => {
    if (open) {
      if (errors.length) errorPanel.current?.focus();
      else title.current?.focus();
    }
  }, [step, open, errors, submission]);

  const update = <K extends keyof EnquiryDraft>(key: K, value: EnquiryDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };
  const go = (next: number) => { if (!sending.current) { setErrors([]); setStep(next); } };
  const validate = (all = false) => {
    const problems = all
      ? [...dateErrors(draft, rules, today), ...contactErrors(draft)]
      : step === 0 ? dateErrors(draft, rules, today) : contactErrors(draft);
    setErrors(current => problems.length || current.length ? problems : current);
    return problems.length === 0;
  };
  const reset = () => {
    if (sending.current) return;
    setDraft({ ...emptyEnquiry }); setSubmission('idle'); go(0); title.current?.focus();
  };
  const send = async () => {
    if (sending.current || submission === 'accepted' || !validate(true)) return;
    sending.current = true;
    setSubmission('pending');
    const result = await submitEnquiry(draft, property.name);
    sending.current = false;
    if (result.accepted) {
      setDraft({ ...emptyEnquiry });
      setSubmission('accepted');
    } else {
      setSubmission('idle');
      setErrors([result.message]);
    }
  };

  return (
    <EnquiryContext.Provider value={launch}>
      {children}
      {enquiryAvailable && <>
        <aside className="enquiry-launcher" aria-label="Availability inquiry">
          <button ref={launcher} className="button" onClick={launch} aria-haspopup="dialog" aria-controls="enquiry-dialog"><MessageCircle size={20} aria-hidden="true" /><span>{siteCopy.enquiry.label}</span></button>
        </aside>
        <dialog ref={dialog} id="enquiry-dialog" className="enquiry-dialog" aria-labelledby="enquiry-title" aria-describedby="enquiry-intro" onCancel={event => { event.preventDefault(); close(); }}>
          <div className="enquiry-top">
            <span className="eyebrow">Blue Bliss stay assistant</span>
            <button className="icon-button" type="button" onClick={close} aria-label="Minimize inquiry"><X aria-hidden="true" /></button>
          </div>
          <div className="enquiry-content">
            <p id="enquiry-intro" className="assistant-bubble">Tell us your plans. We’ll confirm availability and price by email.</p>
            <p className="enquiry-progress" role="status">{submission === 'accepted' ? 'Inquiry received' : submission === 'pending' ? 'Sending your inquiry…' : `Step ${step + 1} of 3 · ${['Your dates', 'Your details', 'Review & send'][step]}`}</p>
            <h2 id="enquiry-title" ref={title} tabIndex={-1}>{submission === 'accepted' ? 'Thanks for your inquiry.' : titles[step]}</h2>
            {errors.length > 0 && <div id="enquiry-errors" className="error-summary" role="alert" tabIndex={-1} ref={errorPanel}><strong>Please check:</strong><ul>{errors.map(message => <li key={message}>{message}</li>)}</ul></div>}
            {submission === 'accepted' ? <div className="enquiry-success">
              <p>The host will follow up by email. Your dates are not reserved and nothing has been charged.</p>
              <button type="button" className="button" onClick={reset}>Start a new inquiry</button>
            </div> : <form action={enquiryEndpoint} method="POST" noValidate aria-busy={submission === 'pending'} aria-describedby={errors.length ? 'enquiry-errors' : undefined} onSubmit={event => { event.preventDefault(); if (sending.current) return; if (step < 2) { if (validate()) go(step + 1); } else void send(); }}>
              {step === 0 && <div className="enquiry-fields">
                <p className="small-note">{rules.minNights}-night minimum</p>
                <label className="field" htmlFor="enquiry-checkIn"><span>Preferred check-in</span><input id="enquiry-checkIn" name="checkIn" type="date" required min={earliestDirectCheckIn(today, rules)} max={latestDirectCheckIn(today, rules)} value={draft.checkIn} onChange={e => update('checkIn', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-checkOut"><span>Preferred checkout</span><input id="enquiry-checkOut" name="checkOut" type="date" required min={isIsoDate(draft.checkIn) ? addDays(draft.checkIn, rules.minNights) : earliestDirectCheckIn(today, rules)} value={draft.checkOut} onChange={e => update('checkOut', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-guests"><span>Guests, including children</span><select id="enquiry-guests" name="guests" value={draft.guests} onChange={e => update('guests', Number(e.target.value))}>{Array.from({ length: rules.maxGuests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i ? 'guests' : 'guest'}</option>)}</select></label>
              </div>}
              {step === 1 && <div className="enquiry-fields">
                <label className="field" htmlFor="enquiry-name"><span>Your name</span><input id="enquiry-name" name="name" required autoComplete="name" maxLength={100} value={draft.name} onChange={e => update('name', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-email"><span>Email for the host’s reply</span><input id="enquiry-email" name="email" required type="email" autoComplete="email" maxLength={254} value={draft.email} onChange={e => update('email', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-notes"><span>Questions or notes (optional, {NOTES_MAX} characters)</span><textarea id="enquiry-notes" name="notes" rows={3} maxLength={NOTES_MAX} value={draft.notes} onChange={e => update('notes', e.target.value)} /></label>
              </div>}
              {step === 2 && <div className="enquiry-review">
                <div className="guest-bubble"><dl><dt>Preferred dates</dt><dd>{draft.checkIn} to {draft.checkOut}</dd><dt>Guests</dt><dd>{draft.guests}</dd><dt>Your name</dt><dd>{draft.name}</dd><dt>Reply email</dt><dd>{draft.email}</dd><dt>Notes</dt><dd>{draft.notes || 'None'}</dd></dl></div>
                <div className="enquiry-edit"><button type="button" className="text-button" disabled={submission === 'pending'} onClick={() => go(0)}>Edit dates & guests</button><button type="button" className="text-button" disabled={submission === 'pending'} onClick={() => go(1)}>Edit contact details</button></div>
                <p className="small-note">Nothing is reserved or charged. Your details are sent through Formspree for the host to follow up.</p>
                <Link className="text-link" to={`/${pageRoutes.privacy.path}`} onClick={close}>Privacy</Link>
                <button className="button enquiry-send" type="submit" disabled={submission === 'pending'}>{submission === 'pending' ? 'Sending…' : 'Send'}</button>
              </div>}
              <div className="enquiry-actions">
                {step > 0 && <button className="text-button" type="button" disabled={submission === 'pending'} onClick={() => go(step - 1)}>Back</button>}
                {step < 2 && <button className="button" type="submit">{step === 0 ? 'Continue' : 'Review inquiry'}</button>}
                <button className="text-button" type="button" disabled={submission === 'pending'} onClick={reset}>Clear & start over</button>
              </div>
            </form>}
          </div>
        </dialog>
      </>}
    </EnquiryContext.Provider>
  );
}
