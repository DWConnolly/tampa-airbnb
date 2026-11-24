import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DayPicker, type DateRange as PickerRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { isNightBlocked, isRangeFree } from '../../shared/booking/calendar.ts';
import type { CalendarDocument } from '../../shared/booking/config.ts';
import { addDays, daysBetween, todayInTimeZone, type IsoDate } from '../../shared/booking/dates.ts';
import { formatMoney, formatRate, quoteStay } from '../../shared/booking/pricing.ts';
import { buildRequestEmail, mailtoUrl, NOTES_MAX, requestReference, STAY_PURPOSES, validateGuestDetails, type Acknowledgement, type GuestDetails, type RequestField } from '../../shared/booking/request.ts';
import { earliestDirectCheckIn, latestDirectCheckIn, stayErrorMessages, validateStay } from '../../shared/booking/rules.ts';
import BookingLink from '../components/BookingLink';
import PolicySections from '../components/PolicySections';
import { policies } from '../config/policies';
import { pageRoutes } from '../config/routes';
import { assetUrl, externalLinks, property } from '../config/siteConfig';
import PageLayout from './PageLayout';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; calendar: CalendarDocument };

const pad = (value: number) => String(value).padStart(2, '0');
const toIso = (date: Date): IsoDate => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromIso = (iso: IsoDate) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const longDate = (iso: IsoDate) => fromIso(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

function useCalendar(): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetch(assetUrl(`calendar.json?ts=${Date.now()}`), { signal: controller.signal, cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json() as Promise<CalendarDocument>; })
      .then((calendar) => setState({ status: 'ready', calendar }))
      .catch((error: Error) => { if (error.name !== 'AbortError') setState({ status: 'error' }); });
    return () => controller.abort();
  }, []);
  return state;
}

function useWideLayout() {
  const query = '(min-width: 1200px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return wide;
}

function OtaLinks({ prefix = '' }: { prefix?: string }) {
  return (
    <>
      {prefix && `${prefix} `}<a className="inline-link" href={externalLinks.airbnbListing}>book on Airbnb</a>
      {externalLinks.vrboListing && <> or <a className="inline-link" href={externalLinks.vrboListing}>Vrbo</a></>}.
    </>
  );
}

export default function BookPage() {
  const state = useCalendar();
  return (
    <PageLayout>
      <section className="shell section book-page" aria-labelledby="book-title">
        <p className="eyebrow">Request to book direct</p>
        <h1 id="book-title">A little closer to Tampa.</h1>
        <p className="book-lede">Your stay at {property.name} starts with a request. Choose your dates, share a few details, and the host will review it. <strong>No payment now.</strong> If accepted, you’ll receive an emailed Stripe invoice.</p>
        <p className="book-arrival-note">Arriving within 7 days? <OtaLinks prefix="Please" /></p>
        {state.status === 'loading' && <p role="status" className="small-note">Loading availability…</p>}
        {state.status === 'error' && (
          <div className="notice" role="alert">
            <p>Availability could not be loaded. Please try again later, or check dates on Airbnb.</p>
            <BookingLink className="button" />
          </div>
        )}
        {state.status === 'ready' && <BookingForm calendar={state.calendar} />}
      </section>
    </PageLayout>
  );
}

const emptyDetails: GuestDetails = { name: '', email: '', phone: '', arrivalTime: '', purpose: '', pets: 'no', petDetails: '', notes: '' };
const noAcks: Record<Acknowledgement, boolean> = { houseRules: false, cancellation: false, rentalTerms: false, requestOnly: false };

type Sent = { reference: string; subject: string; body: string; href: string; to: string };

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span className="field-error" id={id}>{message}</span> : null;
}

function BookingForm({ calendar }: { calendar: CalendarDocument }) {
  const { booking } = calendar;
  const { rules, pricing } = booking;
  const [searchParams] = useSearchParams();
  const wide = useWideLayout();
  const [checkIn, setCheckIn] = useState<IsoDate | null>(null);
  const [checkOut, setCheckOut] = useState<IsoDate | null>(null);
  const [guests, setGuests] = useState(2);
  const [details, setDetails] = useState<GuestDetails>(emptyDetails);
  const [acks, setAcks] = useState(noAcks);
  const [showErrors, setShowErrors] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const errorSummary = useRef<HTMLDivElement>(null);

  const today = todayInTimeZone(calendar.timeZone);
  const earliest = earliestDirectCheckIn(today, rules);
  const latest = latestDirectCheckIn(today, rules);
  const blocked = calendar.blocked;
  const canRequest = booking.open && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(booking.requestEmail);
  const showQuote = booking.open || import.meta.env.DEV || searchParams.has('preview');

  const validCheckIn = (iso: IsoDate) => iso >= earliest && iso <= latest && !isNightBlocked(iso, blocked);
  const validCheckOut = (start: IsoDate, iso: IsoDate) => {
    const nights = daysBetween(start, iso);
    return nights >= rules.minNights && nights <= rules.maxNights && isRangeFree({ start, end: iso }, blocked);
  };

  const selectDay = (iso: IsoDate) => {
    if (checkIn && !checkOut && iso > checkIn && validCheckOut(checkIn, iso)) { setCheckOut(iso); return; }
    if (checkIn === iso && !checkOut) { setCheckIn(null); return; }
    if (validCheckIn(iso)) { setCheckIn(iso); setCheckOut(null); }
  };

  const stay = checkIn && checkOut ? { checkIn, checkOut, guests } : null;
  const stayErrors = stay ? validateStay(stay, rules, today, blocked) : [];
  const quote = stay && !stayErrors.length ? quoteStay(stay.checkIn, stay.checkOut, pricing) : null;
  const fieldErrors = validateGuestDetails(details, acks);
  const visibleErrors: Partial<Record<RequestField, string>> = showErrors ? fieldErrors : {};

  const selected: PickerRange | undefined = checkIn ? { from: fromIso(checkIn), to: checkOut ? fromIso(checkOut) : undefined } : undefined;
  const status = !checkIn
    ? `Select a check-in date on or after ${longDate(earliest)}.`
    : !checkOut
      ? `Check-in ${longDate(checkIn)}. Now select your checkout date (minimum ${rules.minNights} nights).`
      : `${longDate(checkIn)} to ${longDate(checkOut)}: ${daysBetween(checkIn, checkOut)} nights.`;

  const update = <K extends keyof GuestDetails>(key: K, value: GuestDetails[K]) => setDetails((current) => ({ ...current, [key]: value }));
  const describedBy = (key: RequestField) => (visibleErrors[key] ? `${key}-error` : undefined);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canRequest || !stay || stayErrors.length) return;
    if (Object.keys(fieldErrors).length) {
      setShowErrors(true);
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }
    const reference = requestReference(stay.checkIn, crypto.getRandomValues(new Uint8Array(4)));
    const email = buildRequestEmail({ propertyName: property.name, reference, checkIn: stay.checkIn, checkOut: stay.checkOut, guests, details, quote: showQuote ? quote : null, termsVersion: booking.termsVersion });
    const href = mailtoUrl(booking.requestEmail, email.subject, email.body);
    // No server: the request goes out from the guest's own email app. Nothing is stored here.
    setSent({ reference, ...email, href, to: booking.requestEmail });
    window.location.assign(href);
  }

  const staleSources = Object.entries(calendar.sources).filter(([, value]) => value === 'stale').map(([key]) => key);

  if (sent) return <RequestSent sent={sent} onEdit={() => setSent(null)} />;

  const ackLabels: Record<Acknowledgement, ReactNode> = {
    houseRules: <>I have read and agree to the <Link className="inline-link" to={`/${pageRoutes.houseRules.path}`}>house rules</Link> for everyone in my group.</>,
    cancellation: <>I have read the <Link className="inline-link" to={`/${pageRoutes.cancellation.path}`}>cancellation policy</Link>.</>,
    rentalTerms: <>I agree to the <Link className="inline-link" to={`/${pageRoutes.rentalTerms.path}`}>rental terms</Link>.</>,
    requestOnly: <>I understand this is a request: my dates are not held and nothing is charged until the host accepts and I pay the Stripe invoice they email me.</>,
  };
  const errorEntries = Object.entries(visibleErrors) as [RequestField, string][];

  return (
    <>
      <nav className="booking-steps" aria-label="Your booking request">
        <a href="#choose-dates"><span aria-hidden="true">01</span>Choose dates</a>
        <a href="#request-details"><span aria-hidden="true">02</span>Your details &amp; house rules</a>
        <span className="steps-finish">Then, send your request</span>
      </nav>
      {!booking.open && (
        <div className="notice" role="note">
          <p><strong>Direct booking requests are not open yet.</strong> You can view availability here, but requests open only after the host finishes setup. To book now, <a className="inline-link" href={externalLinks.airbnbListing}>use Airbnb</a>.</p>
        </div>
      )}
      {staleSources.length > 0 && <p className="small-note">Some calendar sources could not be refreshed at the last update, so availability may be out of date.</p>}
      {calendar.generatedAt && <p className="small-note">Availability last updated {new Date(calendar.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: calendar.timeZone })} Tampa time. The host confirms availability before accepting any request.</p>}
      <form className="request-form book-grid" onSubmit={submit} noValidate aria-labelledby="book-title">
          <section className="calendar-card" id="choose-dates" aria-labelledby="dates-title" tabIndex={-1}>
            <div className="calendar-heading">
              <p className="eyebrow">Step 01 / Your stay</p>
              <h2 id="dates-title">Choose your dates.</h2>
              <p className="small-note">Select check-in, then checkout. {rules.minNights}-night minimum.</p>
            </div>
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={(_range, day) => selectDay(toIso(day))}
              numberOfMonths={wide ? 2 : 1}
              startMonth={fromIso(today)}
              endMonth={fromIso(addDays(latest, rules.maxNights))}
              defaultMonth={fromIso(earliest)}
              disabled={(date) => {
                const iso = toIso(date);
                if (checkIn && !checkOut && iso > checkIn && validCheckOut(checkIn, iso)) return false;
                if (checkIn === iso) return false;
                return !validCheckIn(iso);
              }}
              modifiers={{ booked: (date) => isNightBlocked(toIso(date), blocked), tooSoon: (date) => { const iso = toIso(date); return iso >= today && iso < earliest; } }}
              modifiersClassNames={{ booked: 'day-booked', tooSoon: 'day-too-soon' }}
              footer={<p className="calendar-status">{status}</p>}
            />
            <ul className="calendar-legend" aria-label="Calendar key">
              <li><span className="legend-swatch legend-booked" aria-hidden="true" />Unavailable / booked</li>
              <li><span className="legend-swatch legend-soon" aria-hidden="true" /><span>Within 7 days: <OtaLinks /></span></li>
            </ul>
            <div className="calendar-guests">
              <label className="field" htmlFor="field-guests">
                <span>Guests</span>
                <select id="field-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                  {Array.from({ length: rules.maxGuests }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
                </select>
              </label>
              <p className="small-note">Up to {rules.maxGuests} guests in total, including children.</p>
            </div>
            <a className="button dates-continue" href={quote ? '#request-details' : '#choose-dates'}>{quote ? 'Continue to your details' : 'Choose dates to get started'}</a>
          </section>

          <section className="quote-card" id="stay-estimate" aria-labelledby="quote-title">
            <p className="eyebrow">Your Tampa Heights stay</p>
            <h2 id="quote-title">Your stay</h2>
            <dl className="stay-summary">
              <div><dt>Check-in</dt><dd>{checkIn ? longDate(checkIn) : 'Choose a date'}</dd></div>
              <div><dt>Checkout</dt><dd>{checkOut ? longDate(checkOut) : 'Choose a date'}</dd></div>
              <div><dt>Nights</dt><dd>{quote ? quote.nightly.length : '—'}</dd></div>
              <div><dt>Guests</dt><dd>{guests}</dd></div>
            </dl>
            {checkIn && <a className="text-link" href="#choose-dates">Change dates or guests</a>}
            {!quote && <p className="quote-empty">A little planning, then a little escaping. Select your dates to see your stay summary{showQuote ? ' and estimated total' : ''}.</p>}

            {stayErrors.length > 0 && <ul className="form-errors" role="alert">{stayErrors.map((code) => <li key={code}>{stayErrorMessages[code]}</li>)}</ul>}

            {quote && showQuote && (
              <div className="quote" aria-live="polite">
                {!booking.open && <p className="draft-banner">Preview only: placeholder rates and tax lines that the owner has not confirmed. Not an offer.</p>}
                <p className="quote-total"><span>Estimated total</span><strong>{formatMoney(quote.total, quote.currency)}</strong></p>
                <details className="quote-breakdown">
                  <summary>Price breakdown</summary>
                  <table>
                  <caption className="visually-hidden">Estimated price breakdown</caption>
                  <tbody>
                    {Object.entries(quote.nightly.reduce<Record<number, number>>((counts, night) => ({ ...counts, [night.amount]: (counts[night.amount] ?? 0) + 1 }), {})).map(([amount, count]) => (
                      <tr key={amount}><th scope="row">{count} {count === 1 ? 'night' : 'nights'} × {formatMoney(Number(amount), quote.currency)}</th><td>{formatMoney(Number(amount) * count, quote.currency)}</td></tr>
                    ))}
                    <tr><th scope="row">Cleaning fee</th><td>{formatMoney(quote.cleaning, quote.currency)}</td></tr>
                    {quote.taxes.map((tax) => <tr key={tax.id}><th scope="row">{tax.label} ({formatRate(tax.rate)})</th><td>{formatMoney(tax.amount, quote.currency)}</td></tr>)}
                  </tbody>
                  </table>
                </details>
                <p className="small-note">This is an estimate. The host confirms the final amount on the Stripe invoice before you pay.</p>
              </div>
            )}
            <p className="summary-reassurance"><strong>No payment now.</strong> This is a request, not a confirmed booking. Dates are not held while the host reviews it.</p>
          </section>

        <section className="request-details" id="request-details" aria-labelledby="details-title" tabIndex={-1}>
          <div><p className="eyebrow">Step 02 / A few details</p><h2 id="details-title">Tell us about your stay.</h2></div>
          <p className="small-note">The host uses these to review your request. They go only into the email your own email app sends; this website does not save or send them.</p>
          <p className="small-note">All fields are required unless marked optional.</p>
          {errorEntries.length > 0 && (
            <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummary}>
              <p><strong>Please fix the following:</strong></p>
              <ul>{errorEntries.map(([key, message]) => <li key={key}><a href={`#field-${key}`}>{message}</a></li>)}</ul>
            </div>
          )}
          <fieldset className="field-grid details-group">
            <legend>Your contact details</legend>
            <label className="field" htmlFor="field-name">
              <span>Full name</span>
              <input id="field-name" autoComplete="name" value={details.name} onChange={(event) => update('name', event.target.value)} aria-invalid={!!visibleErrors.name} aria-describedby={describedBy('name')} />
              <FieldError id="name-error" message={visibleErrors.name} />
            </label>
            <label className="field" htmlFor="field-email">
              <span>Email</span>
              <input id="field-email" type="email" autoComplete="email" value={details.email} onChange={(event) => update('email', event.target.value)} aria-invalid={!!visibleErrors.email} aria-describedby={describedBy('email')} />
              <FieldError id="email-error" message={visibleErrors.email} />
            </label>
            <label className="field" htmlFor="field-phone">
              <span>Phone</span>
              <input id="field-phone" type="tel" autoComplete="tel" value={details.phone} onChange={(event) => update('phone', event.target.value)} aria-invalid={!!visibleErrors.phone} aria-describedby={describedBy('phone')} />
              <FieldError id="phone-error" message={visibleErrors.phone} />
            </label>
          </fieldset>
          <fieldset className="field-grid details-group">
            <legend>A little about your visit</legend>
            <label className="field" htmlFor="field-arrivalTime">
              <span>Estimated arrival time</span>
              <input id="field-arrivalTime" placeholder="e.g. around 4 PM, driving" value={details.arrivalTime} onChange={(event) => update('arrivalTime', event.target.value)} aria-invalid={!!visibleErrors.arrivalTime} aria-describedby={describedBy('arrivalTime')} />
              <FieldError id="arrivalTime-error" message={visibleErrors.arrivalTime} />
            </label>
            <label className="field" htmlFor="field-purpose">
              <span>Purpose of stay</span>
              <select id="field-purpose" value={details.purpose} onChange={(event) => update('purpose', event.target.value)} aria-invalid={!!visibleErrors.purpose} aria-describedby={describedBy('purpose')}>
                <option value="">Choose one</option>
                {STAY_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}
              </select>
              <FieldError id="purpose-error" message={visibleErrors.purpose} />
            </label>
            <fieldset className="field radio-group">
              <legend>Bringing pets?</legend>
              <label><input type="radio" name="pets" value="no" checked={details.pets === 'no'} onChange={() => update('pets', 'no')} /> No</label>
              <label><input type="radio" name="pets" value="yes" checked={details.pets === 'yes'} onChange={() => update('pets', 'yes')} /> Yes</label>
            </fieldset>
            {details.pets === 'yes' && (
              <label className="field field-wide" htmlFor="field-petDetails">
                <span>Pet details (type, size, number). Pets are subject to the house rules and host approval.</span>
                <input id="field-petDetails" value={details.petDetails} onChange={(event) => update('petDetails', event.target.value)} aria-invalid={!!visibleErrors.petDetails} aria-describedby={describedBy('petDetails')} />
                <FieldError id="petDetails-error" message={visibleErrors.petDetails} />
              </label>
            )}
            <label className="field field-wide" htmlFor="field-notes">
              <span>Notes for the host (optional, {NOTES_MAX} characters max)</span>
              <textarea id="field-notes" rows={4} maxLength={NOTES_MAX} value={details.notes} onChange={(event) => update('notes', event.target.value)} aria-invalid={!!visibleErrors.notes} aria-describedby={describedBy('notes')} />
              <FieldError id="notes-error" message={visibleErrors.notes} />
            </label>
          </fieldset>
        </section>

        <section className="request-details" aria-labelledby="agreements-title">
          <h2 id="agreements-title">A shared understanding.</h2>
          <p className="small-note">Read the house rules, then confirm all four acknowledgements before sending your request.</p>
          <details className="rules-preview">
            <summary>Read the house rules</summary>
            <PolicySections sections={policies.houseRules.sections} headingLevel={3} />
          </details>
          <fieldset className="ack-list">
            <legend className="visually-hidden">Required acknowledgements</legend>
            {(Object.keys(ackLabels) as Acknowledgement[]).map((key) => (
              <div key={key}>
                <label className="checkbox-field">
                  <input id={`field-${key}`} type="checkbox" checked={acks[key]} onChange={(event) => setAcks((current) => ({ ...current, [key]: event.target.checked }))} aria-invalid={!!visibleErrors[key]} aria-describedby={describedBy(key)} />
                  <span>{ackLabels[key]}</span>
                </label>
                <FieldError id={`${key}-error`} message={visibleErrors[key]} />
              </div>
            ))}
          </fieldset>
          <div className="request-submit" id="send-request">
            <p><strong>Ready when you are.</strong> The next step opens your email app, not a payment screen.</p>
            <button className="button pay-button" type="submit" disabled={!canRequest || !quote}>
              {canRequest ? 'Send booking request by email' : 'Direct requests not open yet'}
            </button>
            {!quote && canRequest && <p className="small-note">Choose check-in and checkout dates to send a request.</p>}
            <p className="small-note">Review the prefilled email and press send there. If accepted, the host emails a Stripe invoice; your booking is confirmed only when it is paid. See <Link className="inline-link" to={`/${pageRoutes.privacy.path}`}>privacy</Link>.</p>
          </div>
        </section>
        <div className="request-mobile-bar" role="group" aria-label="Stay summary and next step">
          <a href="#stay-estimate" className="mobile-estimate">
            <strong>{quote && showQuote ? formatMoney(quote.total, quote.currency) : 'Your stay'}</strong>
            <span>{quote ? `${quote.nightly.length} nights · ${guests} guests${showQuote ? booking.open ? ' · estimate' : ' · preview only' : ''}` : 'Choose your dates'}</span>
          </a>
          <a className="button" href={quote ? '#request-details' : '#choose-dates'}>{quote ? 'Your details' : 'Choose dates'}</a>
        </div>
      </form>
    </>
  );
}

function RequestSent({ sent, onEdit }: { sent: Sent; onEdit: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const requestText = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { panel.current?.focus(); }, []);
  const copy = async () => {
    setCopied(false);
    setCopyError(false);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(`To: ${sent.to}\nSubject: ${sent.subject}\n\n${sent.body.replace(/\r\n/g, '\n')}`);
      setCopied(true);
    } catch {
      setCopyError(true);
      requestText.current?.focus();
      requestText.current?.select();
    }
  };
  return (
    <div className="request-sent" ref={panel} tabIndex={-1} aria-labelledby="sent-title" role="region">
      <p className="eyebrow">One last step / Send your email</p>
      <h2 id="sent-title">Your request is ready to send.</h2>
      <p className="request-reference">Reference: {sent.reference}</p>
      <p>Your email app should have opened a message to <a className="inline-link" href={`mailto:${sent.to}`}>{sent.to}</a>. <strong>Your request is sent only when you press send there.</strong></p>
      <p>The host reviews requests and replies by email. If accepted, you receive a Stripe invoice; the booking is confirmed when it is paid. Your dates are not held until then.</p>
      <p className="small-note">No email app opened? Copy the request below and email it to {sent.to} yourself.</p>
      <label className="field" htmlFor="sent-body">
        <span>Request text</span>
        <textarea id="sent-body" ref={requestText} readOnly rows={12} value={`To: ${sent.to}\nSubject: ${sent.subject}\n\n${sent.body.replace(/\r\n/g, '\n')}`} />
      </label>
      <div className="sent-actions">
        <button className="button" type="button" onClick={copy}>{copied ? 'Copied' : 'Copy request'}</button>
        <a className="button button-secondary" href={sent.href}>Open email again</a>
        <button className="text-button" type="button" onClick={onEdit}>Edit request</button>
      </div>
      <p role="status" className="visually-hidden">{copied ? 'Request copied to clipboard.' : ''}</p>
      {copyError && <p className="field-error" role="alert">Automatic copying was unavailable. The request text is selected above; copy it manually and paste it into an email to {sent.to}.</p>}
    </div>
  );
}
