import type { JSX } from 'preact';
import { activeLocale } from '../i18n/index.ts';
import type { AmountDisplayProps } from './contracts.ts';
import styles from './AmountDisplay.module.css';

/** Cached per locale: constructing an `Intl.NumberFormat` is the expensive part. */
const formatters = new Map<string, Intl.NumberFormat>();

function jpyFormatter(locale: string): Intl.NumberFormat {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    });
    formatters.set(locale, formatter);
  }
  return formatter;
}

/**
 * Splits a formatted yen string into its currency symbol and the digits, via
 * `formatToParts` rather than a regex: the symbol's position and content are an `Intl`
 * implementation detail this kit should not guess at.
 */
function splitCurrency(locale: string, value: number): { symbol: string; digits: string } {
  const parts = jpyFormatter(locale).formatToParts(value);
  let symbol = '';
  let digits = '';
  for (const part of parts) {
    if (part.type === 'currency') symbol += part.value;
    else digits += part.value;
  }
  return { symbol, digits };
}

/**
 * `components.md` section 7. Money is the product; the three kinds of number are told
 * apart by form, never by colour — `estimate` carries a `~` prefix, `received` carries a
 * derived fee line with a true minus sign, `actual` is plain.
 *
 * `tabular-nums` always, so a total that re-renders does not shift. The visible string and
 * the accessible name are deliberately different: the `~` is never announced, and the
 * word "estimated" in `accessibleName` carries that meaning instead (the caller supplies
 * it already translated, same as every other string in this kit).
 */
export function AmountDisplay({
  kind,
  value,
  label,
  size = 'body',
  fee,
  accessibleName,
}: AmountDisplayProps): JSX.Element {
  const locale = activeLocale.value;
  const { symbol, digits } = splitCurrency(locale, value);
  const feeParts = fee ? splitCurrency(locale, fee.value) : null;

  return (
    <span class={`${styles.amount} ${styles[size]}`}>
      <span class={styles.label}>{label}</span>
      <span class={styles.value} aria-label={accessibleName}>
        {kind === 'estimate' ? <span class={styles.tilde}>~</span> : null}
        <span class={styles.currency}>{symbol}</span>
        {digits}
      </span>
      {kind === 'received' && fee && feeParts ? (
        <span class={styles.fee}>
          {fee.label}
          {/* True minus sign (U+2212), never a hyphen. */}
          {' \u2212 '}
          {feeParts.symbol}
          {feeParts.digits}
        </span>
      ) : null}
    </span>
  );
}
