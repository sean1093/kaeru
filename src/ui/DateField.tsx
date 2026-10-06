import type { JSX } from 'preact';
import type { DateFieldProps } from './contracts.ts';
import styles from './DateField.module.css';
import { Field } from './Field.tsx';

/** `YYYY-MM-DD` in the user's local clock, the shape `<input type="date">` expects. */
function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * `components.md` section 11, "Date". A native `<input type="date">`: localised,
 * accessible and keyboard-operable for free, and it works offline. The "Today" chip
 * resets it in one tap; the derived deadline beneath is read-only text, never a second
 * editable field, because a derived value that looks editable invites someone to "fix" it
 * by hand and lose the one honest copy (`DR-031`).
 */
export function DateField({
  id,
  label,
  value,
  onChange,
  todayLabel,
  deadlineHint,
  error,
}: DateFieldProps): JSX.Element {
  const describedBy = error ? `${id}-error` : deadlineHint ? `${id}-deadline` : undefined;

  return (
    <Field id={id} label={label} {...(error !== undefined ? { error } : {})}>
      <div class={styles.row}>
        <input
          id={id}
          class={`${styles.input} ${error ? styles.inputError : ''}`}
          type="date"
          value={value}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          onInput={(event) => onChange(event.currentTarget.value)}
        />
        <button type="button" class={styles.today} onClick={() => onChange(todayIsoDate())}>
          {todayLabel}
        </button>
      </div>
      {deadlineHint ? (
        <p class={styles.deadline} id={`${id}-deadline`}>
          {deadlineHint}
        </p>
      ) : null}
    </Field>
  );
}
