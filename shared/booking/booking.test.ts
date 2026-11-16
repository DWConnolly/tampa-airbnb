import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findConflicts, mergeBySource, mergeRanges, rangesOverlap } from './calendar.ts';
import type { BookingConfig, CalendarDocument } from './config.ts';
import { publicBookingSettings, readinessProblems } from './config.ts';
import { addDays, isIsoDate, todayInTimeZone } from './dates.ts';
import { buildIcal, classifyOtaEvent, IcalError, parseIcal } from './ical.ts';
import { quoteStay, type PricingConfig } from './pricing.ts';
import { buildRequestEmail, mailtoUrl, requestReference, validateGuestDetails, type GuestDetails } from './request.ts';
import { earliestDirectCheckIn, isDirectCheckInAllowed, validateStay, type StayRules } from './rules.ts';
import { taxReportCsv } from './taxReport.ts';
import { buildCalendar, DataValidationError, type FeedResult, type SyncInput } from './sync.ts';

const TZ = 'America/New_York';
const rules: StayRules = { minLeadDays: 7, minNights: 2, maxNights: 28, maxGuests: 6, bookingHorizonDays: 365 };
const pricing: PricingConfig = {
  currency: 'usd',
  nightlyRate: 200,
  weekendRate: 250,
  weekendNights: [5, 6],
  seasons: [{ name: 'Peak', start: '2027-03-01', end: '2027-03-31', nightlyRate: 300 }],
  cleaningFee: 150,
  taxes: [
    { id: 'state', label: 'State sales tax', rate: 0.06, appliesTo: ['lodging', 'cleaning'] },
    { id: 'tdt', label: 'Tourist development tax', rate: 0.05, appliesTo: ['lodging'] },
  ],
};
const config: BookingConfig = {
  propertyId: 'blue-bliss',
  timeZone: TZ,
  termsVersion: 'test',
  directBooking: { enabled: true, requestEmail: 'stay@example.com' },
  rules,
  pricing,
  ownerConfirmations: { rates: true, taxes: true },
};

describe('dates', () => {
  it('validates real calendar dates only', () => {
    assert.ok(isIsoDate('2028-02-29'));
    assert.ok(!isIsoDate('2027-02-29'));
    assert.ok(!isIsoDate('2027-1-01'));
  });
  it('adds days across DST and year boundaries', () => {
    assert.equal(addDays('2026-03-07', 2), '2026-03-09');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  });
  it('computes today in the property time zone, not UTC', () => {
    // 02:30 UTC on Dec 2 is still Dec 1 in Tampa.
    assert.equal(todayInTimeZone(TZ, new Date('2026-12-02T02:30:00Z')), '2026-12-01');
  });
});

describe('iCal parsing', () => {
  const airbnb = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Airbnb Inc//Hosting Calendar 1.0//EN',
    'BEGIN:VEVENT', 'DTSTAMP:20261115T000000Z', 'DTSTART;VALUE=DATE:20261201', 'DTEND;VALUE=DATE:20261205',
    'SUMMARY:Reserved', 'UID:abc-1@airbnb.com', 'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/\r\n reservations/details/XYZ', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:20261210', 'DTEND;VALUE=DATE:20261212', 'SUMMARY:Airbnb (Not available)', 'UID:abc-2@airbnb.com', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:20261220', 'DTEND;VALUE=DATE:20261222', 'SUMMARY:Reserved', 'STATUS:CANCELLED', 'UID:abc-3', 'END:VEVENT',
    'END:VCALENDAR', '',
  ].join('\r\n');

  it('parses all-day events with exclusive end dates and skips cancelled events', () => {
    const events = parseIcal(airbnb, TZ);
    assert.deepEqual(events.map(({ start, end, summary }) => ({ start, end, summary })), [
      { start: '2026-12-01', end: '2026-12-05', summary: 'Reserved' },
      { start: '2026-12-10', end: '2026-12-12', summary: 'Airbnb (Not available)' },
    ]);
  });
  it('unfolds lines, unescapes text, and converts UTC times to the property date', () => {
    const text = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20261202T030000Z\nDTEND:20261204T160000Z\nSUMMARY:Reserved - Jane\\, \n Doe\nUID:v1\nEND:VEVENT\nEND:VCALENDAR';
    const [event] = parseIcal(text, TZ);
    assert.equal(event.start, '2026-12-01');
    assert.equal(event.end, '2026-12-04');
    assert.equal(event.summary, 'Reserved - Jane, Doe');
  });
  it('defaults a missing DTEND to one night', () => {
    const [event] = parseIcal('BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261201\nEND:VEVENT\nEND:VCALENDAR', TZ);
    assert.equal(event.end, '2026-12-02');
  });
  it('rejects non-calendar responses instead of reading them as empty', () => {
    assert.throws(() => parseIcal('<html>Service unavailable</html>', TZ), IcalError);
    assert.throws(() => parseIcal('BEGIN:VCALENDAR\nBEGIN:VEVENT', TZ), IcalError);
  });
  it('classifies OTA reservations versus blocks', () => {
    assert.equal(classifyOtaEvent('airbnb', 'Reserved'), 'reservation');
    assert.equal(classifyOtaEvent('airbnb', 'Airbnb (Not available)'), 'blocked');
    assert.equal(classifyOtaEvent('vrbo', 'Reserved - Pat'), 'reservation');
    assert.equal(classifyOtaEvent('vrbo', 'Blocked'), 'blocked');
    assert.equal(classifyOtaEvent('vrbo', 'Something new'), 'reservation');
  });
  it('round-trips generated feeds, including escaping and folding', () => {
    const summary = `Owner block; family, visit ${'x'.repeat(90)}`;
    const ics = buildIcal([{ uid: 'u1', start: '2027-01-01', end: '2027-01-03', summary }], { prodId: '-//t//EN', calendarName: 'Test', stamp: new Date('2026-11-15T00:00:00Z') });
    assert.ok(ics.split('\r\n').every((line) => line.length <= 75));
    assert.deepEqual(parseIcal(ics, TZ), [{ uid: 'u1', start: '2027-01-01', end: '2027-01-03', summary }]);
  });
});

describe('ranges and overlap detection', () => {
  it('treats checkout day as free for the next check-in', () => {
    assert.ok(!rangesOverlap({ start: '2027-01-01', end: '2027-01-05' }, { start: '2027-01-05', end: '2027-01-07' }));
    assert.ok(rangesOverlap({ start: '2027-01-01', end: '2027-01-05' }, { start: '2027-01-04', end: '2027-01-07' }));
  });
  it('merges overlapping and adjacent ranges per source', () => {
    assert.deepEqual(mergeRanges([{ start: '2027-01-05', end: '2027-01-07' }, { start: '2027-01-01', end: '2027-01-05' }, { start: '2027-01-02', end: '2027-01-03' }]), [{ start: '2027-01-01', end: '2027-01-07' }]);
    assert.deepEqual(mergeBySource([
      { start: '2027-01-01', end: '2027-01-03', source: 'airbnb' },
      { start: '2027-01-02', end: '2027-01-04', source: 'direct' },
      { start: '2027-01-03', end: '2027-01-04', source: 'airbnb' },
    ]), [
      { start: '2027-01-01', end: '2027-01-04', source: 'airbnb' },
      { start: '2027-01-02', end: '2027-01-04', source: 'direct' },
    ]);
  });
  it('reports cross-source and direct-vs-direct double bookings only', () => {
    const conflicts = findConflicts([
      { id: 'a1', source: 'airbnb', start: '2027-01-01', end: '2027-01-05' },
      { id: 'a2', source: 'airbnb', start: '2027-01-03', end: '2027-01-06' },
      { id: 'd1', source: 'direct', start: '2027-01-04', end: '2027-01-08' },
      { id: 'd2', source: 'direct', start: '2027-01-07', end: '2027-01-09' },
      { id: 'v1', source: 'vrbo', start: '2027-01-09', end: '2027-01-10' },
    ]);
    assert.deepEqual(conflicts.map(({ a, b }) => `${a.id}/${b.id}`), ['a1/d1', 'a2/d1', 'd1/d2']);
  });
});

describe('7-day rule and stay validation', () => {
  const today = '2026-11-15';
  it('allows check-in only MORE than 7 days out', () => {
    assert.equal(earliestDirectCheckIn(today, rules), '2026-11-23');
    assert.ok(!isDirectCheckInAllowed('2026-11-22', today, rules));
    assert.ok(isDirectCheckInAllowed('2026-11-23', today, rules));
  });
  it('accepts a valid stay', () => {
    assert.deepEqual(validateStay({ checkIn: '2026-12-01', checkOut: '2026-12-04', guests: 6 }, rules, today, []), []);
  });
  it('reports each rule violation', () => {
    assert.deepEqual(validateStay({ checkIn: '2026-11-20', checkOut: '2026-11-21', guests: 7 }, rules, today, []), ['too-soon', 'too-short', 'too-many-guests']);
    assert.deepEqual(validateStay({ checkIn: '2026-12-01', checkOut: '2027-01-15', guests: 0 }, rules, today, []), ['too-long', 'invalid-guests']);
    assert.deepEqual(validateStay({ checkIn: '2027-12-01', checkOut: '2027-12-04', guests: 2 }, rules, today, []), ['too-far']);
    assert.deepEqual(validateStay({ checkIn: '2026-12-04', checkOut: '2026-12-01', guests: 2 }, rules, today, []), ['invalid-dates']);
  });
  it('rejects stays that overlap blocked nights but allows back-to-back stays', () => {
    const blocked = [{ start: '2026-12-05', end: '2026-12-08' }];
    assert.deepEqual(validateStay({ checkIn: '2026-12-03', checkOut: '2026-12-06', guests: 2 }, rules, today, blocked), ['unavailable']);
    assert.deepEqual(validateStay({ checkIn: '2026-12-03', checkOut: '2026-12-05', guests: 2 }, rules, today, blocked), []);
    assert.deepEqual(validateStay({ checkIn: '2026-12-08', checkOut: '2026-12-10', guests: 2 }, rules, today, blocked), []);
  });
});

describe('pricing (guest estimate)', () => {
  it('prices weekday/weekend nights, cleaning, and per-line taxes in cents', () => {
    // Thu 2027-01-07, Fri 08, Sat 09 nights.
    const quote = quoteStay('2027-01-07', '2027-01-10', pricing);
    assert.deepEqual(quote.nightly.map((night) => night.amount), [20000, 25000, 25000]);
    assert.equal(quote.lodging, 70000);
    assert.equal(quote.cleaning, 15000);
    assert.deepEqual(quote.taxes.map((tax) => tax.amount), [5100, 3500]);
    assert.equal(quote.total, 70000 + 15000 + 5100 + 3500);
  });
  it('applies seasonal rates (season inclusive of its last night)', () => {
    const quote = quoteStay('2027-03-30', '2027-04-02', pricing);
    assert.deepEqual(quote.nightly.map((night) => night.amount), [30000, 30000, 20000]);
    // Friday 2027-03-05 is a weekend night inside the season: the season rate wins.
    assert.equal(quoteStay('2027-03-05', '2027-03-06', pricing).lodging, 30000);
  });
  it('rounds fractional tax amounts to the nearest cent', () => {
    const quote = quoteStay('2027-01-04', '2027-01-05', { ...pricing, nightlyRate: 99.99, cleaningFee: 0, taxes: [{ id: 'x', label: 'x', rate: 0.075, appliesTo: ['lodging'] }] });
    assert.equal(quote.taxes[0].amount, 750);
  });
});

describe('readiness', () => {
  it('keeps booking requests closed until enabled and every confirmation is true', () => {
    assert.deepEqual(readinessProblems(config), []);
    const problems = readinessProblems({ ...config, directBooking: { enabled: false, requestEmail: 'not-an-email' }, ownerConfirmations: { taxes: false } });
    assert.equal(problems.length, 3);
    assert.ok(readinessProblems({ ...config, rules: { ...rules, minLeadDays: 3 } }).length);
    // Enabled with every confirmation set but no inbox yet: still closed, nothing published as open.
    const noInbox = { ...config, directBooking: { enabled: true, requestEmail: '' } };
    assert.deepEqual(readinessProblems(noInbox), ['No booking-request email address (directBooking.requestEmail) is configured.']);
    assert.equal(publicBookingSettings(noInbox).open, false);
  });
});

describe('request to book', () => {
  const details: GuestDetails = { name: 'Pat Guest', email: 'pat@example.com', phone: '(813) 555-0100', arrivalTime: 'About 4 PM', purpose: 'Event in Tampa', pets: 'no', petDetails: '', notes: 'Line one\nLine two & more' };
  const allAcks = { houseRules: true, cancellation: true, rentalTerms: true, requestOnly: true };
  it('requires contact details, arrival time, purpose, pet details and every acknowledgement', () => {
    assert.deepEqual(validateGuestDetails(details, allAcks), {});
    const errors = validateGuestDetails({ ...details, name: ' ', email: 'pat@', phone: '555', arrivalTime: '', purpose: '', pets: 'yes', notes: 'x'.repeat(501) }, { ...allAcks, houseRules: false, requestOnly: false });
    assert.deepEqual(Object.keys(errors).sort(), ['arrivalTime', 'email', 'houseRules', 'name', 'notes', 'petDetails', 'phone', 'purpose', 'requestOnly']);
  });
  it('makes a short PII-free reference from the check-in date', () => {
    assert.equal(requestReference('2027-01-07', new Uint8Array([0, 1, 30, 31])), 'BB-270107-AB9A');
  });
  it('builds a prefilled email with dates, guest details, estimate and agreements', () => {
    const quote = quoteStay('2027-01-07', '2027-01-10', pricing);
    const email = buildRequestEmail({ propertyName: 'Blue Bliss', reference: 'BB-270107-ABCD', checkIn: '2027-01-07', checkOut: '2027-01-10', guests: 4, details: { ...details, pets: 'yes', petDetails: 'One small dog' }, quote, termsVersion: 'v2' });
    assert.equal(email.subject, 'Booking request BB-270107-ABCD: 2027-01-07 to 2027-01-10');
    for (const expected of ['Checkout: 2027-01-10 (3 nights)', 'Guests: 4', 'Phone: (813) 555-0100', 'Pets: Yes - One small dog', 'Estimated total: $936.00', '(version v2)', 'nothing is charged until the host approves it']) {
      assert.ok(email.body.includes(expected), expected);
    }
    const url = mailtoUrl('stay@example.com', email.subject, email.body);
    assert.ok(url.startsWith('mailto:stay@example.com?subject=Booking%20request%20BB-270107-ABCD'));
    assert.ok(url.includes('%0D%0A') && url.includes('%26%20more') && !/\s/.test(url));
    assert.equal(url.split('&').length, 2, 'only subject and body parameters');
    assert.ok(url.length < 2000, `mailto length ${url.length}`);
  });
});

describe('calendar build', () => {
  const today = '2026-11-15';
  const now = new Date('2026-11-15T12:00:00Z');
  const ok = (events: { start: string; end: string; summary: string }[]): FeedResult => ({ state: 'ok', events: events.map((event, index) => ({ uid: `u${index}`, ...event })) });
  const base = (overrides: Partial<SyncInput> = {}): SyncInput => ({
    config, ownerBlocks: [], directBookings: [], today, now, previous: null,
    feeds: { airbnb: ok([]), vrbo: { state: 'not-configured' } }, ...overrides,
  });

  it('merges OTA, direct, and owner blocks and publishes direct + owner blocks in direct.ics', () => {
    const result = buildCalendar(base({
      feeds: { airbnb: ok([{ start: '2026-12-01', end: '2026-12-05', summary: 'Reserved' }, { start: '2026-11-01', end: '2026-11-03', summary: 'Reserved' }]), vrbo: { state: 'not-configured' } },
      directBookings: [
        { id: 'BB-261210-AAAA', checkIn: '2026-12-10', checkOut: '2026-12-12', status: 'confirmed' },
        { id: 'BB-261220-BBBB', checkIn: '2026-12-20', checkOut: '2026-12-22', status: 'cancelled' },
      ],
      ownerBlocks: [{ start: '2027-01-01', end: '2027-01-04', note: 'Painting' }],
    }));
    assert.deepEqual(result.calendar.blocked, [
      { start: '2026-12-01', end: '2026-12-05', source: 'airbnb' },
      { start: '2026-12-10', end: '2026-12-12', source: 'direct' },
      { start: '2027-01-01', end: '2027-01-04', source: 'owner' },
    ]);
    assert.equal(result.calendar.sources.vrbo, 'not-configured');
    assert.deepEqual(result.alerts, []);
    const feed = parseIcal(result.ics, TZ);
    assert.deepEqual(feed.map((event) => [event.start, event.end]), [['2026-12-10', '2026-12-12'], ['2027-01-01', '2027-01-04']]);
    assert.ok(!result.ics.includes('BB-261210-AAAA'), 'booking references are not exposed in the public feed');
    assert.ok(!result.ics.includes('Painting'), 'owner notes are not exposed');
    assert.ok(!JSON.stringify(result.calendar).includes('BB-261210-AAAA'));
  });

  it('keeps last good dates when a feed fails, is missing, or suddenly empties', () => {
    const previous = buildCalendar(base({ feeds: { airbnb: ok([{ start: '2026-12-01', end: '2026-12-05', summary: 'Reserved' }]), vrbo: ok([{ start: '2026-12-08', end: '2026-12-09', summary: 'Blocked' }]) } })).calendar;
    for (const airbnb of [{ state: 'error', error: 'HTTP 500' }, { state: 'not-configured' }, ok([])] as FeedResult[]) {
      const result = buildCalendar(base({ previous, feeds: { airbnb, vrbo: ok([{ start: '2026-12-08', end: '2026-12-09', summary: 'Blocked' }]) } }));
      assert.deepEqual(result.calendar.blocked.filter((range) => range.source === 'airbnb'), [{ start: '2026-12-01', end: '2026-12-05', source: 'airbnb' }]);
      assert.equal(result.calendar.sources.airbnb, 'stale');
      assert.equal(result.alerts.length, 1);
    }
    const accepted = buildCalendar(base({ previous, acceptEmptyFeeds: true, feeds: { airbnb: ok([]), vrbo: ok([]) } }));
    assert.deepEqual(accepted.calendar.blocked, []);
  });

  it('alerts on double bookings but keeps both stays blocked; OTA echo blocks do not conflict', () => {
    const result = buildCalendar(base({
      feeds: { airbnb: ok([{ start: '2026-12-01', end: '2026-12-05', summary: 'Reserved' }, { start: '2026-12-10', end: '2026-12-12', summary: 'Airbnb (Not available)' }]), vrbo: { state: 'not-configured' } },
      directBookings: [
        { id: 'BB-261210-AAAA', checkIn: '2026-12-03', checkOut: '2026-12-07', status: 'confirmed' },
        { id: 'BB-261220-BBBB', checkIn: '2026-12-10', checkOut: '2026-12-12', status: 'confirmed' },
      ],
    }));
    assert.equal(result.conflicts.length, 1);
    assert.match(result.alerts[0], /double booking/);
    assert.ok(result.calendar.blocked.some((range) => range.source === 'airbnb' && range.start === '2026-12-01'));
    assert.ok(result.calendar.blocked.some((range) => range.source === 'direct' && range.start === '2026-12-03'));
  });

  it('only reports a change (and new timestamp) when content changes', () => {
    const first = buildCalendar(base());
    const second = buildCalendar(base({ previous: first.calendar, now: new Date('2026-11-16T00:00:00Z') }));
    assert.equal(second.changed, false);
    assert.equal(second.calendar.generatedAt, first.calendar.generatedAt);
    assert.equal(second.ics, first.ics);
    const third = buildCalendar(base({ previous: first.calendar, ownerBlocks: [{ start: '2027-01-01', end: '2027-01-02' }] }));
    assert.equal(third.changed, true);
  });

  it('rejects invalid owner data so the previous calendar stays published', () => {
    assert.throws(() => buildCalendar(base({ ownerBlocks: [{ start: '2027-01-05', end: '2027-01-01' }] })), DataValidationError);
    assert.throws(() => buildCalendar(base({ directBookings: [{ id: 'x', checkIn: '2027-01-01', checkOut: '2027-01-02', status: 'maybe' as 'confirmed' }] })), DataValidationError);
  });

  it('publishes booking settings as closed while readiness problems remain', () => {
    const closed = buildCalendar(base({ config: { ...config, directBooking: { ...config.directBooking, enabled: false } } })).calendar as CalendarDocument;
    assert.equal(closed.booking.open, false);
    assert.ok(closed.booking.problems.length > 0);
  });

  it('pauses direct checkout while an OTA feed is stale or the Airbnb feed is not configured', () => {
    const previous = buildCalendar(base({ feeds: { airbnb: ok([{ start: '2026-12-01', end: '2026-12-05', summary: 'Reserved' }]), vrbo: { state: 'not-configured' } } })).calendar;
    const healthy = buildCalendar(base()).calendar;
    assert.ok(!healthy.booking.problems.some((problem) => /feed/.test(problem)), 'Vrbo not configured is fine');
    const stale = buildCalendar(base({ previous, feeds: { airbnb: { state: 'error', error: 'HTTP 500' }, vrbo: { state: 'not-configured' } } })).calendar;
    assert.equal(stale.booking.open, false);
    assert.ok(stale.booking.problems.some((problem) => /airbnb calendar feed is stale/.test(problem)));
    const missing = buildCalendar(base({ feeds: { airbnb: { state: 'not-configured' }, vrbo: { state: 'not-configured' } } })).calendar;
    assert.ok(missing.booking.problems.some((problem) => /AIRBNB_ICAL_URL/.test(problem)));
  });
});

describe('tax report', () => {
  it('lists confirmed direct bookings checking in during the month with an estimated split', () => {
    const report = taxReportCsv([
      { id: 'BB-270110-B', checkIn: '2027-01-10', checkOut: '2027-01-12', status: 'confirmed' },
      { id: 'BB-270107-A', checkIn: '2027-01-07', checkOut: '2027-01-10', status: 'confirmed' },
      { id: 'BB-270115-C', checkIn: '2027-01-15', checkOut: '2027-01-17', status: 'cancelled' },
      { id: 'BB-270201-D', checkIn: '2027-02-01', checkOut: '2027-02-03', status: 'confirmed' },
    ], { config, month: '2027-01' });
    assert.equal(report.rows, 2);
    const lines = report.csv.split('\n');
    assert.equal(lines[0], 'reference,check_in,check_out,nights,lodging,cleaning,tax_state,tax_tdt,estimated_total');
    assert.equal(lines[1], 'BB-270107-A,2027-01-07,2027-01-10,3,700.00,150.00,51.00,35.00,936.00');
    assert.equal(lines[2].split(',')[0], 'BB-270110-B');
  });
});
