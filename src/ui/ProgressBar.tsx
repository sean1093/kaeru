import type { JSX } from 'preact';
import type { ProgressBarProps, StepIndicatorProps } from './contracts.ts';
import styles from './ProgressBar.module.css';

/**
 * `components.md` section 8, linear form. The numeric form is required beside the bar —
 * the bar alone is decoration, so `valueText` ("3/5") is rendered as real text, never
 * just exposed through `aria-valuetext`.
 *
 * `max <= 0` means the total is not known yet, not a confident zero: ARIA's answer to
 * an unknown value is an indeterminate progressbar, so `aria-valuenow`/`aria-valuemax`
 * are both omitted rather than rendering a `valuenow` with no real `valuemax` to compare
 * it against. When `max > 0`, `aria-valuenow` is clamped to `[0, max]` so the spoken
 * value can never disagree with the fill, which is clamped the same way.
 */
export function ProgressBar({
  value,
  max,
  label,
  valueText,
  complete = false,
}: ProgressBarProps): JSX.Element {
  const determinate = max > 0;
  const ratio = determinate ? Math.min(1, Math.max(0, value / max)) : 0;
  const clampedValue = determinate ? Math.min(max, Math.max(0, value)) : undefined;

  return (
    <div class={styles.wrap}>
      <div
        class={styles.track}
        role="progressbar"
        aria-valuenow={determinate ? clampedValue : undefined}
        aria-valuemin={0}
        aria-valuemax={determinate ? max : undefined}
        aria-label={label}
      >
        <div
          class={`${styles.fill} ${complete ? styles.complete : ''}`}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <span class={styles.value}>{valueText}</span>
    </div>
  );
}

/**
 * `components.md` section 8, step form. The text is the accessible source of truth,
 * already translated by the caller into whichever single locale is active — zh-TW
 * renders e.g. "步驟 2/5", en renders "Step 2 of 5"; never both at once in one string.
 * The dots beside it are `aria-hidden` decoration.
 */
export function StepIndicator({ current, total, text }: StepIndicatorProps): JSX.Element {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <div class={styles.steps}>
      <span class={styles.stepsText}>{text}</span>
      <span class={styles.dots} aria-hidden="true">
        {steps.map((step) => (
          <span
            key={step}
            class={`${styles.dot} ${
              step < current ? styles.dotDone : step === current ? styles.dotCurrent : ''
            }`}
          />
        ))}
      </span>
    </div>
  );
}
