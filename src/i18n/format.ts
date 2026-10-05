import type { CalendarDate } from '../domain/index.ts';
import { calendarDateToInstant } from '../domain/index.ts';
import type { Locale } from './locale.ts';

/**
 * Intl wrappers. Formatter construction is the expensive part, so instances are cached
 * per locale and options signature and reused for the life of the page.
 */
const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

function numberFormatter(locale: Locale, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormats.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, formatter);
  }
  return formatter;
}

export function formatNumber(
  locale: Locale,
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return numberFormatter(locale, options).format(value);
}

/** Japanese yen has no minor unit; never show decimals for JPY amounts. */
export function formatCurrency(locale: Locale, value: number, currency = 'JPY'): string {
  return numberFormatter(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(value);
}

export function formatDate(
  locale: Locale,
  date: CalendarDate,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = dateFormats.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    dateFormats.set(key, formatter);
  }
  return formatter.format(calendarDateToInstant(date));
}
