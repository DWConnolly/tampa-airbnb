import type { BookingConfig } from './config.ts';
import type { DirectBooking } from './bookings.ts';
import { quoteStay } from './pricing.ts';

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const dollars = (cents: number) => (cents / 100).toFixed(2);

/**
 * Monthly worksheet of confirmed direct bookings that CHECK IN during `month`
 * (YYYY-MM), with the lodging/cleaning/tax split estimated from the current
 * rates in data/booking-config.json. The owner invoices manually in Stripe, so
 * reconcile against the actual invoices; which date determines the tax period
 * is for the owner/accountant to confirm.
 */
export function taxReportCsv(bookings: DirectBooking[], options: { config: BookingConfig; month: string }): { csv: string; rows: number } {
  const { config, month } = options;
  const header = ['reference', 'check_in', 'check_out', 'nights', 'lodging', 'cleaning', ...config.pricing.taxes.map((tax) => `tax_${tax.id}`), 'estimated_total'];
  const rows = bookings
    .filter((booking) => booking.status === 'confirmed' && booking.checkIn.startsWith(`${month}-`))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.id.localeCompare(b.id))
    .map((booking) => {
      const quote = quoteStay(booking.checkIn, booking.checkOut, config.pricing);
      return [booking.id, booking.checkIn, booking.checkOut, quote.nights, dollars(quote.lodging), dollars(quote.cleaning), ...quote.taxes.map((tax) => dollars(tax.amount)), dollars(quote.total)];
    });
  return { csv: `${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}\n`, rows: rows.length };
}
