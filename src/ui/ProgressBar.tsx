import type { JSX } from 'preact';
import type { ProgressBarProps, StepIndicatorProps } from './contracts.ts';
import styles from './ProgressBar.module.css';

/**
 * `components.md` section 8, linear form. The numeric form is required beside the bar —
 * the bar alone is decoration, so `valueText` ("3/5") is rendered as real text, never
 * just exposed through `aria-valuetext`.
 */
export function ProgressBar({
  value,
  max,
  label,
  valueText,
  complete = false,
}: ProgressBarProps): JSX.Element {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <div class={styles.wrap}>
      <div
        class={styles.track}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
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
 * `components.md` section 8, step form. The text is the accessible source of truth
 * ("步驟 2/5 · Step 2 of 5"); the dots beside it are `aria-hidden` decoration.
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
