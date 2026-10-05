import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { activeLocale, formatNumber } from '../i18n/index.ts';
import styles from './AmountEntry.module.css';
import type { AmountEntryProps } from './contracts.ts';
import { Field } from './Field.tsx';

/**
 * `components.md` section 11, "Amount entry". `inputmode="numeric"` text, never
 * `type="number"` — that brings spinners, scroll-wheel mutation, and locale-dependent
 * parsing.
 *
 * Group separators are inserted on blur, never while typing: while focused the field
 * shows the raw digit string so the caret never jumps over a comma that appears mid-entry;
 * once blurred, it shows the same value formatted with `Intl.NumberFormat` grouping.
 *
 * The `¥` adornment sits outside the editable area and is `aria-hidden`; the field's own
 * `aria-label` carries the currency so a screen reader still hears it.
 *
 * `autoFocus` is applied imperatively on mount rather than via the native attribute: the
 * attribute is a linted anti-pattern everywhere else in this kit for good reason — it
 * only belongs here because the prop exists specifically so Add Receipt can open with the
 * numeric keypad already raised, and doing it once on mount keeps that intent explicit.
 */
export function AmountEntry({
  id,
  label,
  value,
  onChange,
  onBlur,
  autoFocus,
  error,
  derivedHint,
}: AmountEntryProps): JSX.Element {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = activeLocale.value;
  const describedBy = error ? `${id}-error` : derivedHint ? `${id}-derived` : undefined;
  const displayValue = value === null ? '' : focused ? String(value) : formatNumber(locale, value);

  // Mount only, deliberately: "autofocus on screen open", not "refocus on every render".
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <Field id={id} label={label} {...(error !== undefined ? { error } : {})}>
      <div class={`${styles.control} ${error ? styles.controlError : ''}`}>
        <span class={styles.prefix} aria-hidden="true">
          ¥
        </span>
        <input
          ref={inputRef}
          id={id}
          class={styles.input}
          type="text"
          inputMode="numeric"
          autocomplete="off"
          aria-label={`${label}, 日圓 / yen`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          value={displayValue}
          onFocus={() => setFocused(true)}
          onInput={(event) => {
            // Strip everything but digits on every keystroke, so a pasted "¥12,345" or a
            // stray letter never reaches `onChange` — the caret stays put because the
            // string never grows or shrinks by more than what the user typed.
            const digits = event.currentTarget.value.replace(/\D/g, '');
            onChange(digits === '' ? null : Number(digits));
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />
      </div>
      {derivedHint ? (
        <p class={styles.derived} id={`${id}-derived`}>
          {derivedHint}
        </p>
      ) : null}
    </Field>
  );
}
