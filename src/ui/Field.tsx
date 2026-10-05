import type { JSX } from 'preact';
import type { FieldProps } from './contracts.ts';
import styles from './Field.module.css';
import { CircleAlertIcon } from './icons.tsx';

/**
 * `components.md` section 11, shared anatomy. Label above the control, always visible —
 * never a placeholder standing in for one. Helper or error text below; an error replaces
 * the helper rather than stacking under it.
 *
 * `Field` wraps a control; it does not render one, so the id contract is a convention
 * every sibling in this file follows: a control with id `x` is described by `x-error`
 * when `error` is set, otherwise by `x-helper` when `helper` is set, otherwise by
 * nothing. `AmountEntry` and `DateField` wrap their own `<input>` in a `Field` and wire
 * that id onto it directly; a bespoke field does the same.
 */
export function Field({ id, label, required, helper, error, children }: FieldProps): JSX.Element {
  return (
    <div class={styles.field}>
      <label class={styles.label} for={id}>
        {label}
        {required ? (
          <span class={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p class={styles.error} id={`${id}-error`}>
          <span class={styles.errorIcon} aria-hidden="true">
            <CircleAlertIcon />
          </span>
          {error}
        </p>
      ) : helper ? (
        <p class={styles.helper} id={`${id}-helper`}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
