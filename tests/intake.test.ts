import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyEnquiry, dateErrors, contactErrors, enquiryEmail } from '../src/enquiry/intake.ts';

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
test('enquiry email preserves encoded input and explicitly avoids booking or delivery claims', () => {
  const result = enquiryEmail({ ...valid, name: 'Test & Guest', notes: 'A & B? #1\nSecond line' }, 'host@example.invalid', 'Blue Bliss');
  const url = new URL(result.href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'host@example.invalid');
  assert.equal(url.searchParams.get('subject'), 'Availability enquiry for Blue Bliss');
  assert.match(url.searchParams.get('body')!, /A & B\? #1\nSecond line/);
  assert.match(result.text, /No dates are held and no payment is taken/);
  assert.match(result.text, /Preferred check-in: 2027-01-10/);
  assert.doesNotMatch(result.text, /confirmed booking|request received|request sent/i);
});
