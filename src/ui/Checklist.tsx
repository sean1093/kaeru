import type { JSX } from 'preact';
import styles from './Checklist.module.css';
import type { ChecklistGroupProps, ChecklistRowProps } from './contracts.ts';
import { ChevronRightIcon, CircleAlertIcon, InfoIcon } from './icons.tsx';
import { ProgressBar } from './ProgressBar.tsx';

/**
 * `components.md` section 10. The core of Airport Mode step 1 and the packing plan.
 *
 * **A row is one receipt, never one item.** Customs confirms a whole purchase
 * transaction, all or nothing: if any item on a receipt is missing, the entire receipt is
 * rejected including the items the traveler does have (`DR-030`). An item-level checkbox
 * would model something that does not exist, and would let someone tick four of five
 * items and believe they were four-fifths fine.
 *
 * The whole row toggles, because a 24 px target held one-handed in a queue with luggage
 * is not acceptable. The semantics are a real `<input type="checkbox">` inside a
 * `<label>`, so the accessible name, the state and the keyboard behaviour are the
 * platform's rather than ours.
 */
export function ChecklistRow({
  id,
  checked,
  onChange,
  primary,
  secondary,
  excluded,
  warning,
}: ChecklistRowProps): JSX.Element {
  // A receipt routed to a human counter is not a thing to tick. Rendering it as an
  // unchecked box would invite the traveler to tick it and walk to the kiosk, which is
  // the one place the official instruction says not to take it (`DR-035`).
  if (excluded) {
    return (
      <a class={`${styles.row} ${styles.excluded}`} href={excluded.href} data-row-id={id}>
        <span class={styles.text}>
          <span class={styles.primary}>{primary}</span>
          {secondary ? <span class={styles.secondary}>{secondary}</span> : null}
          <span class={styles.excludedReason}>{excluded.reason}</span>
        </span>
        <span class={styles.chevron} aria-hidden="true">
          <ChevronRightIcon />
        </span>
      </a>
    );
  }

  const WarningIcon = warning?.tone === 'info' ? InfoIcon : CircleAlertIcon;

  return (
    <label class={styles.row} data-row-id={id}>
      <input
        type="checkbox"
        class={styles.checkbox}
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span class={styles.text}>
        <span class={styles.primary}>{primary}</span>
        {secondary ? <span class={styles.secondary}>{secondary}</span> : null}
        {/* Not `secondary` text, deliberately. This line exists to make a traveler stop on
            this row rather than tick through it, and rendering it muted beside the date
            and the amount would remove exactly the emphasis it is for. It is inside the
            label, so it is part of the checkbox's accessible name. */}
        {warning ? (
          <span class={`${styles.warning} ${styles[warning.tone]}`}>
            <span class={styles.warningIcon} aria-hidden="true">
              <WarningIcon />
            </span>
            {warning.text}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * One traveler's rows. A `<fieldset>` whose `<legend>` names them, so the traveler is
 * part of every row's accessible name — each passport is a separate customs procedure
 * (`UJ-019`, `UJ-027`) and a row read without its owner is ambiguous in a family's list.
 */
export function ChecklistGroup({ legend, progress, children }: ChecklistGroupProps): JSX.Element {
  return (
    <fieldset class={styles.group}>
      <legend class={styles.legend}>{legend}</legend>
      <ProgressBar {...progress} />
      <div class={styles.rows}>{children}</div>
    </fieldset>
  );
}
