import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { kaeruRules, RATE_LABEL_KEYS, resolveRules } from '../../../domain/index.ts';
import { useMessages } from '../../../i18n/index.ts';
import {
  AmountDisplay,
  AmountEntry,
  DateField,
  Field,
  SegmentedControl,
} from '../../../ui/index.ts';
import { galleryCopy } from '../copy.ts';
import styles from '../Gallery.module.css';
import { GallerySection, Specimen } from '../Specimen.tsx';

/** `components.md` sections 7 and 11 — money and the form field family (M1-3c, #25). */
export function FormsSection(): JSX.Element {
  const t = useMessages(galleryCopy);
  const [amount, setAmount] = useState<number | null>(12345);
  const [emptyAmount, setEmptyAmount] = useState<number | null>(null);
  const [erroredAmount, setErroredAmount] = useState<number | null>(null);
  const [date, setDate] = useState('2026-11-04');
  const [rate, setRate] = useState<number>(0.1);
  const [shop, setShop] = useState('');

  /**
   * Genuinely resolved from `kaeruRules` for the field's own purchase date — not a
   * hard-coded pair (`DR-023`, #25's acceptance). The copy per `labelKey` is this
   * gallery's own translation of the same message key a real feature would translate in
   * its own bundle; only the shipped rate *values* and which ones apply on this date come
   * from the domain.
   */
  const RATE_LABEL_TEXT: Record<string, { label: string; helper: string }> = {
    [RATE_LABEL_KEYS.mostGoods]: {
      label: t('gallery.field.taxRate10'),
      helper: t('gallery.field.taxRate10Helper'),
    },
    [RATE_LABEL_KEYS.foodAndNewspapers]: {
      label: t('gallery.field.taxRate8'),
      helper: t('gallery.field.taxRate8Helper'),
    },
  };
  const rateOptions = useMemo(() => {
    const resolved = resolveRules(kaeruRules, date);
    return resolved.rates.map((option) => {
      const text = RATE_LABEL_TEXT[option.labelKey];
      return text
        ? { value: option.rate, label: text.label, helper: text.helper }
        : { value: option.rate, label: option.labelKey };
    });
  }, [date]);

  return (
    <>
      <GallerySection id="amount-display" title={t('gallery.section.amountDisplay')}>
        <Specimen id="amount-actual" state='kind: "actual", size: "body"'>
          <AmountDisplay
            kind="actual"
            value={890}
            label={t('gallery.amount.tax')}
            accessibleName={t('gallery.amount.taxValue')}
          />
        </Specimen>
        <Specimen id="amount-estimate-hero" state='kind: "estimate", size: "hero"'>
          <AmountDisplay
            kind="estimate"
            value={24860}
            label={t('gallery.amount.estimate')}
            size="hero"
            accessibleName={t('gallery.amount.estimateValue')}
          />
        </Specimen>
        <Specimen id="amount-received" state='kind: "received", size: "large", with fee'>
          <AmountDisplay
            kind="received"
            value={520}
            label={t('gallery.amount.received')}
            size="large"
            fee={{ value: 20, label: t('gallery.amount.fee') }}
            accessibleName={t('gallery.amount.receivedValue')}
          />
        </Specimen>
        <Specimen id="amount-zero" state="value: 0, muted label (no receipts yet)">
          <AmountDisplay
            kind="actual"
            value={0}
            label={t('gallery.amount.zero')}
            accessibleName={t('gallery.amount.zeroValue')}
          />
        </Specimen>
      </GallerySection>

      <GallerySection id="form-fields" title={t('gallery.section.formFields')}>
        <Specimen id="field-helper" state="Field: label + helper, custom control">
          <div class={styles.stretch}>
            <Field
              id="shop"
              label={t('gallery.field.shopLabel')}
              helper={t('gallery.field.shopHelper')}
            >
              <input
                id="shop"
                value={shop}
                onInput={(event) => setShop(event.currentTarget.value)}
              />
            </Field>
          </div>
        </Specimen>
        <Specimen id="field-error" state="Field: label + error, required">
          <div class={styles.stretch}>
            <Field
              id="shop-error"
              label={t('gallery.field.shopLabel')}
              required
              error={t('gallery.field.shopError')}
            >
              <input id="shop-error" aria-invalid="true" />
            </Field>
          </div>
        </Specimen>
        <Specimen id="amount-entry" state="AmountEntry: value set">
          <div class={styles.stretch}>
            <AmountEntry
              id="amount-entry"
              label={t('gallery.field.amountLabel')}
              accessibleName={t('gallery.field.amountAccessibleName')}
              value={amount}
              onChange={setAmount}
            />
          </div>
        </Specimen>
        <Specimen id="amount-entry-empty" state="AmountEntry: value null (empty, not zero)">
          <div class={styles.stretch}>
            <AmountEntry
              id="amount-entry-empty"
              label={t('gallery.field.amountLabel')}
              accessibleName={t('gallery.field.amountAccessibleName')}
              value={emptyAmount}
              onChange={setEmptyAmount}
            />
          </div>
        </Specimen>
        <Specimen id="amount-entry-derived" state="AmountEntry: derivedHint (DR-022)">
          <div class={styles.stretch}>
            <AmountEntry
              id="amount-entry-derived"
              label={t('gallery.field.amountLabel')}
              accessibleName={t('gallery.field.amountAccessibleName')}
              value={1000}
              onChange={() => {}}
              derivedHint={t('gallery.field.amountDerived')}
            />
          </div>
        </Specimen>
        <Specimen id="amount-entry-error" state="AmountEntry: error">
          <div class={styles.stretch}>
            <AmountEntry
              id="amount-entry-error"
              label={t('gallery.field.amountLabel')}
              accessibleName={t('gallery.field.amountAccessibleName')}
              value={erroredAmount}
              onChange={setErroredAmount}
              error={t('gallery.field.amountError')}
            />
          </div>
        </Specimen>
        <Specimen id="date-field" state="DateField: Today chip + derived deadline">
          <div class={styles.stretch}>
            <DateField
              id="date-field"
              label={t('gallery.field.dateLabel')}
              value={date}
              onChange={setDate}
              todayLabel={t('gallery.field.dateToday')}
              deadlineHint={t('gallery.field.dateDeadline')}
            />
          </div>
        </Specimen>
        <Specimen
          id="segmented-tax-rate"
          state="SegmentedControl: resolved from kaeruRules for the date above (DR-023)"
        >
          <div class={styles.stretch}>
            <SegmentedControl
              legend={t('gallery.field.taxRateLegend')}
              options={rateOptions}
              value={rate}
              onChange={setRate}
            />
          </div>
        </Specimen>
      </GallerySection>
    </>
  );
}
