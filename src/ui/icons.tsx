import type { ComponentChildren, JSX } from 'preact';
import type { Icon } from './contracts.ts';
import styles from './icons.module.css';

/**
 * The icon set of `visual-language.md` section 7: stroke only, 1.75 px on a 24 px grid,
 * round caps and joins, `currentColor`, no fills.
 *
 * Every glyph sizes itself to `1em`, so the component around it picks a size with a type
 * token (`--text-base` = 16 px in a chip, `--text-lg` = 20 px in a list row, `--text-xl` =
 * 24 px in the app bar). That keeps icons in step with the text at 200 % scale instead of
 * staying stubbornly 24 px next to 48 px words.
 *
 * Glyphs are decorative by construction: the control around them carries the name.
 */
function Glyph({ children }: { children: ComponentChildren }): JSX.Element {
  return (
    <svg
      class={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const ChevronLeftIcon: Icon = () => (
  <Glyph>
    <path d="M14.5 5 8 12l6.5 7" />
  </Glyph>
);

export const ChevronRightIcon: Icon = () => (
  <Glyph>
    <path d="M9.5 5 16 12l-6.5 7" />
  </Glyph>
);

export const CloseIcon: Icon = () => (
  <Glyph>
    <path d="M6 6l12 12M18 6 6 18" />
  </Glyph>
);

export const CheckIcon: Icon = () => (
  <Glyph>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Glyph>
);

export const CircleIcon: Icon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8" />
  </Glyph>
);

export const CheckCircleIcon: Icon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8 12.3 2.8 2.8L16.2 9.7" />
  </Glyph>
);

export const ClockIcon: Icon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2v5.1l3.2 2" />
  </Glyph>
);

export const CircleAlertIcon: Icon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.6v5.2" />
    <path d="M12 16.4v.1" />
  </Glyph>
);

export const CircleSlashIcon: Icon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M6.2 17.8 17.8 6.2" />
  </Glyph>
);

/** "Needs you" — flagged for the traveller to do something, distinct from an alert. */
export const FlagIcon: Icon = () => (
  <Glyph>
    <path d="M6 20V4" />
    <path d="M6 4.8h11l-3 4 3 4H6" />
  </Glyph>
);

export const InfoIcon: Icon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11.2v5.2" />
    <path d="M12 7.6v.1" />
  </Glyph>
);

export const ReceiptIcon: Icon = () => (
  <Glyph>
    <path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6-2.4-1.6z" />
    <path d="M9.2 8.5h5.6M9.2 12.5h5.6" />
  </Glyph>
);

/**
 * The Kaeru frog seen from above, reduced to a body arc and two eyes
 * (`visual-language.md` section 9). Decorative; used in empty states only.
 */
export const FrogMarkIcon: Icon = () => (
  <Glyph>
    <path d="M4.5 17.5a7.5 7.5 0 0 1 15 0" />
    <path d="M4.5 17.5h15" />
    <path d="M8.6 10.6v-.1M15.4 10.6v-.1" />
    <path d="M6.2 9.4a2.2 2.2 0 0 1 3.1-2M17.8 9.4a2.2 2.2 0 0 0-3.1-2" />
  </Glyph>
);
