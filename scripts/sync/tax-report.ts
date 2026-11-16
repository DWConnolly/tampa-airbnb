// Monthly direct-booking tax worksheet from data/direct-bookings.json.
// Writes a CSV for the workflow to upload as a workflow artifact.
// Usage: node scripts/sync/tax-report.ts [YYYY-MM] [output.csv]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { DirectBooking } from '../../shared/booking/bookings.ts';
import type { BookingConfig } from '../../shared/booking/config.ts';
import { addDays, todayInTimeZone } from '../../shared/booking/dates.ts';
import { taxReportCsv } from '../../shared/booking/taxReport.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const config = JSON.parse(await readFile(`${root}data/booking-config.json`, 'utf8')) as BookingConfig;
const bookings = JSON.parse(await readFile(`${root}data/direct-bookings.json`, 'utf8')) as DirectBooking[];

const today = todayInTimeZone(config.timeZone);
// Default: the previous calendar month.
const month = process.argv[2] || addDays(`${today.slice(0, 7)}-01`, -1).slice(0, 7);
if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`Month must be YYYY-MM, received ${month}`);
const output = process.argv[3] || `tax-report-${month}.csv`;

const report = taxReportCsv(bookings, { config, month });
await writeFile(output, report.csv);
console.log(`Wrote ${output}: ${report.rows} direct booking(s) checking in during ${month}. Amounts are estimates from current rates; reconcile with your Stripe invoices and confirm the filing basis with your accountant.`);
