import type { JSX } from 'preact';
import { useId } from 'preact/hooks';
import type { SegmentedControlProps } from './contracts.ts';
import styles from './SegmentedControl.module.css';

/** Three stacked rows at `--text-sm` fit roughly this many Latin characters before a
 * label like "Checked luggage" (16 characters, `components.md` section 11's own example
 * of a label that wraps) starts breaking across two lines inside a segment. Deliberately
 * conservative: a false rejection costs the author a glance at this file, a false
 * acceptance ships a wrapped label nobody catches until a screenshot review. */
const MAX_ENGLISH_LABEL_LENGTH = 14;
const MAX_OPTIONS = 3;

function isWrapRisk(label: string): boolean {
  // Only Latin-script labels are at risk here: CJK text wraps per character, not per
  // word, so `visual-language.md`'s `--leading-cjk` already accounts for it.
  return /^[\x20-\x7E]+$/.test(label) && label.length > MAX_ENGLISH_LABEL_LENGTH;
}

/**
 * `components.md` section 11, "Segmented control". A native radio `<fieldset>` styled as
 * segments, which is the preferred semantics over `role="radiogroup"`: arrow keys and
 * form semantics come for free.
 *
 * Above three options, or when any English label would wrap, this is the wrong
 * component — `SelectSheet` (#26) is the replacement. Both conditions throw at render
 * rather than silently reflowing to look fine, so the author hits this during
 * development rather than a reviewer catching it in a screenshot.
 */
export function SegmentedControl<T extends string | number>({
  legend,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>): JSX.Element {
  const groupId = useId();

  if (options.length > MAX_OPTIONS) {
    throw new Error(
      `SegmentedControl "${legend}" has ${options.length} options; above ${MAX_OPTIONS}, use SelectSheet instead (components.md section 11).`,
    );
  }
  const wrapping = options.find((option) => isWrapRisk(option.label));
  if (wrapping) {
    throw new Error(
      `SegmentedControl "${legend}" option "${wrapping.label}" would wrap at this width; use SelectSheet instead (components.md section 11).`,
    );
  }

  return (
    <fieldset class={styles.group}>
      <legend class={styles.legend}>{legend}</legend>
      <div class={styles.track}>
        {options.map((option) => {
          const checked = option.value === value;
          const inputId = `${groupId}-${option.value}`;
          return (
            <label key={option.value} class={styles.segment} for={inputId}>
              <input
                id={inputId}
                class={styles.input}
                type="radio"
                name={groupId}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              <span class={`${styles.thumb} ${checked ? styles.thumbSelected : ''}`}>
                <span class={styles.optionLabel}>{option.label}</span>
                {option.helper ? <span class={styles.helper}>{option.helper}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
