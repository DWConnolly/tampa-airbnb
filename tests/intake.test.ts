import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyEnquiry, dateErrors, contactErrors, enquiryPayload } from '../src/enquiry/intake.ts';
import { submitEnquiry } from '../src/enquiry/submit.ts';
import { enquiryEndpoint } from '../src/config/enquiry.ts';
import { readFileSync } from 'node:fs';
import { buildCalendar } from '../shared/booking/sync.ts';
import type { BookingConfig, CalendarDocument } from '../shared/booking/config.ts';

const rules = { minLeadDays: 7, minNights: 2, maxNights: 28, maxGuests: 6, bookingHorizonDays: 365 };
const today = '2027-01-01';
const valid = { ...emptyEnquiry, checkIn: '2027-01-10', checkOut: '2027-01-12', name: 'Test Guest', email: 'guest@example.invalid' };

test('enquiry checks real dates, order, stay constraints and guest bounds without claiming availability', () => {
  assert.deepEqual(dateErrors(valid, rules, today), []);
  for (const change of [{ checkIn: '' }, { checkIn: '2027-02-30' }, { checkOut: valid.checkIn }, { checkIn: '2027-01-08' }, { checkOut: '2027-01-11' }, { checkOut: '2027-03-01' }, { checkIn: '2028-02-01', checkOut: '2028-02-04' }, { guests: 7 }, { guests: 0 }, { guests: 1.5 }]) {
    assert.ok(dateErrors({ ...valid, ...change }, rules, today).length, JSON.stringify(change));
  }
});
test('enquiry requires usable name/email and bounded notes', () => {
  assert.deepEqual(contactErrors(valid), []);
  for (const change of [{ name: ' ' }, { name: 'x'.repeat(101) }, { email: 'invalid' }, { notes: 'x'.repeat(501) }]) assert.ok(contactErrors({ ...valid, ...change }).length);
});
test('structured payload retains enquiry details without recipient or payment claims', () => {
  const result = enquiryPayload({ ...valid, name: ' Test & Guest ', notes: 'A & B? #1\nSecond line' }, 'Blue Bliss');
  assert.equal(result.email, valid.email);
  assert.equal(result.subject, 'Availability enquiry for Blue Bliss');
  assert.equal(result.name, 'Test & Guest');
  assert.equal(result.checkIn, valid.checkIn);
  assert.equal(result.guests, 2);
  assert.equal(result.notes, 'A & B? #1\nSecond line');
  assert.match(result.message, /No dates are held and no payment is taken/);
  assert.ok(!('recipient' in result));
});

test('submission posts JSON once and accepts only explicit provider acceptance', async () => {
  let calls = 0;
  const result = await submitEnquiry(valid, 'Blue Bliss', async (url, options) => {
    calls++;
    assert.equal(url, enquiryEndpoint);
    assert.equal(options?.method, 'POST');
    assert.equal(options?.credentials, 'omit');
    assert.deepEqual(JSON.parse(String(options?.body)), enquiryPayload(valid, 'Blue Bliss'));
    return Response.json({ ok: true });
  });
  assert.deepEqual(result, { accepted: true });
  assert.equal(calls, 1);
  for (const response of [Response.json({ ok: false }), Response.json({}), new Response('invalid JSON'), Response.json({ ok: true }, { status: 500 })]) {
    assert.equal((await submitEnquiry(valid, 'Blue Bliss', async () => response)).accepted, false);
  }
});

test('rejections, rate limits and connection errors keep actionable feedback without retries', async () => {
  for (const [status, message] of [[422, /rejected/], [429, /wait/], [503, /try later/]] as const) {
    let calls = 0;
    const result = await submitEnquiry(valid, 'Blue Bliss', async () => { calls++; return Response.json({ errors: [{ message: 'server details' }] }, { status }); });
    assert.equal(result.accepted, false);
    if (!result.accepted) assert.match(result.message, message);
    assert.equal(calls, 1);
  }
  const result = await submitEnquiry(valid, 'Blue Bliss', async () => { throw new TypeError('Failed to fetch'); });
  assert.equal(result.accepted, false);
  if (!result.accepted) assert.match(result.message, /could not confirm receipt.*duplicate/);
});

test('slow requests time out without claiming failure to deliver or automatically retrying', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const pending = submitEnquiry(valid, 'Blue Bliss', async (_url, options) => {
    calls++;
    return new Promise<Response>((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  });

  context.mock.timers.tick(15000);
  const result = await pending;
  assert.equal(result.accepted, false);
  if (!result.accepted) assert.match(result.message, /could not confirm receipt.*timed out/);
  assert.equal(calls, 1);
});

test('current owner config and future calendar sync keep the notification recipient private', () => {
  const config: BookingConfig = JSON.parse(readFileSync(new URL('../data/booking-config.json', import.meta.url), 'utf8'));
  const previous: CalendarDocument = JSON.parse(readFileSync(new URL('../public/calendar.json', import.meta.url), 'utf8'));
  const result = buildCalendar({
    config, previous, ownerBlocks: [], directBookings: [], now: new Date('2027-01-01T12:00:00Z'), today,
    feeds: { airbnb: { state: 'not-configured' }, vrbo: { state: 'not-configured' } },
  });
  assert.equal(config.directBooking.requestEmail, '');
  assert.equal(previous.booking.requestEmail, '');
  assert.equal(result.calendar.booking.requestEmail, '');
  assert.equal(result.calendar.booking.open, false);
});
