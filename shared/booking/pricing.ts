import { addDays, dayOfWeek, type IsoDate } from './dates.ts';

export type TaxBase = 'lodging' | 'cleaning';

export interface TaxConfig {
  id: string;
  label: string;
  /** Decimal rate, e.g. 0.06 for 6%. Owner must confirm with the taxing authority. */
  rate: number;
  appliesTo: TaxBase[];
}

export interface Season {
  name: string;
  /** First night of the season (inclusive). */
  start: IsoDate;
  /** Last night of the season (inclusive). */
  end: IsoDate;
  nightlyRate: number;
}

/** Amounts are whole currency units (dollars) for easy owner editing. */
export interface PricingConfig {
  currency: string;
  nightlyRate: number;
  /** Optional rate for weekendNights (0 = Sunday … 6 = Saturday). */
  weekendRate?: number;
  weekendNights?: number[];
  seasons?: Season[];
  cleaningFee: number;
  taxes: TaxConfig[];
}

/** Estimated quote shown to the guest. All amounts are integer cents. */
export interface Quote {
  currency: string;
  nights: number;
  nightly: { date: IsoDate; amount: number }[];
  lodging: number;
  cleaning: number;
  taxes: { id: string; label: string; rate: number; amount: number }[];
  taxTotal: number;
  total: number;
}

export const toCents = (amount: number) => Math.round(amount * 100);

/** Season rates win over weekend rates, which win over the base rate. */
export function nightlyRateFor(date: IsoDate, pricing: PricingConfig): number {
  const season = pricing.seasons?.find((entry) => date >= entry.start && date <= entry.end);
  if (season) return season.nightlyRate;
  if (pricing.weekendRate && pricing.weekendNights?.includes(dayOfWeek(date))) return pricing.weekendRate;
  return pricing.nightlyRate;
}

export function quoteStay(checkIn: IsoDate, checkOut: IsoDate, pricing: PricingConfig): Quote {
  const nightly: Quote['nightly'] = [];
  for (let date = checkIn; date < checkOut; date = addDays(date, 1)) nightly.push({ date, amount: toCents(nightlyRateFor(date, pricing)) });
  const lodging = nightly.reduce((sum, night) => sum + night.amount, 0);
  const cleaning = nightly.length ? toCents(pricing.cleaningFee) : 0;
  const bases: Record<TaxBase, number> = { lodging, cleaning };
  const taxes = pricing.taxes.map((tax) => ({
    id: tax.id,
    label: tax.label,
    rate: tax.rate,
    amount: Math.round(tax.appliesTo.reduce((sum, base) => sum + bases[base], 0) * tax.rate),
  }));
  const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);
  return { currency: pricing.currency, nights: nightly.length, nightly, lodging, cleaning, taxes, taxTotal, total: lodging + cleaning + taxTotal };
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

export function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(3))}%`;
}
