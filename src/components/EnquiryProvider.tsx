import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { bookingConfig, enquiryAvailable } from '../config/booking';
import { externalLinks, property } from '../config/siteConfig';
import { earliestDirectCheckIn, latestDirectCheckIn } from '../../shared/booking/rules.ts';
import { todayInTimeZone, addDays, isIsoDate } from '../../shared/booking/dates.ts';
import { NOTES_MAX } from '../../shared/booking/request.ts';
import { EnquiryContext } from '../enquiry/context';
import { emptyEnquiry, dateErrors, contactErrors, enquiryEmail, type EnquiryDraft } from '../enquiry/intake';

export default function EnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EnquiryDraft>(emptyEnquiry);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const requestText = useRef<HTMLTextAreaElement>(null);
  const errorPanel = useRef<HTMLDivElement>(null);
  const today = todayInTimeZone(bookingConfig.timeZone);
  const rules = bookingConfig.rules;
  const recipient = bookingConfig.directBooking.requestEmail;
  const email = enquiryEmail(draft, recipient, property.name);
  const titles = ['When would you like to visit?', 'How can the host reach you?', 'Review your enquiry'];

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
  }, [step, open, errors]);

  const update = <K extends keyof EnquiryDraft>(key: K, value: EnquiryDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
    setCopyStatus('');
  };
  const go = (next: number) => { setErrors([]); setCopyStatus(''); setStep(next); };
  const validate = (all = false) => {
    const problems = all
      ? [...dateErrors(draft, rules, today), ...contactErrors(draft)]
      : step === 0 ? dateErrors(draft, rules, today) : contactErrors(draft);
    setErrors(current => problems.length || current.length ? problems : current);
    return problems.length === 0;
  };
  const reset = () => { setDraft({ ...emptyEnquiry }); go(0); title.current?.focus(); };
  const copy = async () => {
    if (!validate(true)) return;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email.text);
      setCopyStatus('Enquiry copied. Paste it into your email app and send it to the address above.');
    } catch {
      setCopyStatus('Automatic copying was unavailable. The text below is selected; copy it manually and paste it into your email app.');
      requestText.current?.focus();
      requestText.current?.select();
    }
  };

  return (
    <EnquiryContext.Provider value={launch}>
      {children}
      {enquiryAvailable && <>
        <aside className="enquiry-launcher" aria-label="Availability enquiry">
          <button ref={launcher} className="button" onClick={launch} aria-haspopup="dialog" aria-controls="enquiry-dialog"><MessageCircle size={20} aria-hidden="true" />Enquire direct</button>
          <a className="text-link" href={externalLinks.airbnbListing}>Book on Airbnb</a>
        </aside>
        <dialog ref={dialog} id="enquiry-dialog" className="enquiry-dialog" aria-labelledby="enquiry-title" aria-describedby="enquiry-intro" onCancel={event => { event.preventDefault(); close(); }}>
          <div className="enquiry-top">
            <div><span className="eyebrow">Blue Bliss stay assistant</span><p>Guided enquiry · not a live chat</p></div>
            <button className="icon-button" type="button" onClick={close} aria-label="Minimize enquiry"><X aria-hidden="true" /></button>
          </div>
          <div className="enquiry-content">
            <p id="enquiry-intro" className="assistant-bubble">Let’s put your stay enquiry together. The host will confirm availability and price by email. Nothing is reserved or charged.</p>
            <p className="enquiry-progress" role="status">Step {step + 1} of 3 · {['Your dates', 'Your details', 'Review & email'][step]}</p>
            <h2 id="enquiry-title" ref={title} tabIndex={-1}>{titles[step]}</h2>
            {errors.length > 0 && <div id="enquiry-errors" className="error-summary" role="alert" tabIndex={-1} ref={errorPanel}><strong>Please check:</strong><ul>{errors.map(message => <li key={message}>{message}</li>)}</ul></div>}
            <form noValidate aria-describedby={errors.length ? 'enquiry-errors' : undefined} onSubmit={event => { event.preventDefault(); if (step < 2 && validate()) go(step + 1); }}>
              {step === 0 && <div className="enquiry-fields">
                <p className="small-note">These are preferred dates, not verified availability. Stays start more than {rules.minLeadDays} days ahead and last {rules.minNights}–{rules.maxNights} nights. Arriving sooner? <a className="inline-link" href={externalLinks.airbnbListing}>Check Airbnb</a>.</p>
                <label className="field" htmlFor="enquiry-checkIn"><span>Preferred check-in</span><input id="enquiry-checkIn" type="date" required min={earliestDirectCheckIn(today, rules)} max={latestDirectCheckIn(today, rules)} value={draft.checkIn} onChange={e => update('checkIn', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-checkOut"><span>Preferred checkout</span><input id="enquiry-checkOut" type="date" required min={isIsoDate(draft.checkIn) ? addDays(draft.checkIn, rules.minNights) : earliestDirectCheckIn(today, rules)} value={draft.checkOut} onChange={e => update('checkOut', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-guests"><span>Guests, including children</span><select id="enquiry-guests" value={draft.guests} onChange={e => update('guests', Number(e.target.value))}>{Array.from({ length: rules.maxGuests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i ? 'guests' : 'guest'}</option>)}</select></label>
              </div>}
              {step === 1 && <div className="enquiry-fields">
                <p className="assistant-bubble">Thanks! Add your contact details so the host can follow up after you send the email.</p>
                <label className="field" htmlFor="enquiry-name"><span>Your name</span><input id="enquiry-name" required autoComplete="name" maxLength={100} value={draft.name} onChange={e => update('name', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-email"><span>Email for the host’s reply</span><input id="enquiry-email" required type="email" autoComplete="email" maxLength={254} value={draft.email} onChange={e => update('email', e.target.value)} /></label>
                <label className="field" htmlFor="enquiry-notes"><span>Questions or notes (optional, {NOTES_MAX} characters)</span><textarea id="enquiry-notes" rows={3} maxLength={NOTES_MAX} value={draft.notes} onChange={e => update('notes', e.target.value)} /></label>
              </div>}
              {step === 2 && <div className="enquiry-review">
                <div className="guest-bubble"><dl><dt>Preferred dates</dt><dd>{draft.checkIn} to {draft.checkOut}</dd><dt>Guests</dt><dd>{draft.guests}</dd><dt>Your name</dt><dd>{draft.name}</dd><dt>Reply email</dt><dd>{draft.email}</dd><dt>Notes</dt><dd>{draft.notes || 'None'}</dd></dl></div>
                <div className="enquiry-edit"><button type="button" className="text-button" onClick={() => go(0)}>Edit dates & guests</button><button type="button" className="text-button" onClick={() => go(1)}>Edit contact details</button></div>
                <p className="assistant-bubble">Your enquiry is ready for you to send, but has not been delivered. Open your email app, review the draft and press Send there. The host will follow up after receiving your email.</p>
                <p className="enquiry-recipient">Send to: <strong>{recipient}</strong></p>
                <a className="button enquiry-send" href={email.href} onClick={event => { if (!validate(true)) event.preventDefault(); }}>Open email to send enquiry</a>
                <button type="button" className="button button-secondary" onClick={copy}>Copy enquiry</button>
                <p role="status" className="small-note">{copyStatus}</p>
                <label className="field" htmlFor="enquiry-text"><span>No email app? Copy this text into an email to the address above.</span><textarea id="enquiry-text" ref={requestText} readOnly rows={6} value={email.text} /></label>
              </div>}
              <div className="enquiry-actions">
                {step > 0 && <button className="text-button" type="button" onClick={() => go(step - 1)}>Back</button>}
                {step < 2 && <button className="button" type="submit">{step === 0 ? 'Continue' : 'Review enquiry'}</button>}
                <button className="text-button" type="button" onClick={reset}>Clear & start over</button>
              </div>
            </form>
            <p className="small-note">Your draft stays here when minimized. Reloading clears it. Nothing is stored or sent by this website.</p>
          </div>
        </dialog>
      </>}
    </EnquiryContext.Provider>
  );
}
