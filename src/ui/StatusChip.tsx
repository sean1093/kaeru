import type { JSX } from 'preact';
import type { ChipStatus, Icon, StatusChipProps } from './contracts.ts';
import {
  CheckCircleIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleIcon,
  CircleSlashIcon,
  ClockIcon,
  CloseIcon,
  FlagIcon,
  InfoIcon,
} from './icons.tsx';
import styles from './StatusChip.module.css';

/**
 * `components.md` section 6. The set is closed: a status outside this map does not exist,
 * and the type makes adding one a compile error in every consumer at once.
 *
 * Two pairs of states share a background (`customs_confirmed` with `refunded`,
 * `registered` with `refund_pending`). They are told apart by icon and word, which is the
 * rule for every chip anyway — colour never carries the meaning on its own. The same rule
 * is why `needs_action` and `refund_disputed` get different glyphs even though both read
 * as "attention" at a glance, and why `operator_unknown` gets `InfoIcon` rather than
 * reusing `circle-alert` a third time: it is an admission of missing information, not a
 * warning, and the icon should say that distinction before the label does.
 */
const ICONS: Readonly<Record<ChipStatus, Icon>> = {
  logged: CircleIcon,
  registered: CheckIcon,
  customs_confirmed: CheckCircleIcon,
  refund_pending: ClockIcon,
  refunded: CheckCircleIcon,
  rejected: CloseIcon,
  refund_disputed: CircleAlertIcon,
  not_claiming: CircleSlashIcon,
  needs_action: FlagIcon,
  operator_unknown: InfoIcon,
};

/** A chip is a label, never a control: it is not focusable and it has no action. */
export function StatusChip({ status, label }: StatusChipProps): JSX.Element {
  const Glyph = ICONS[status];

  return (
    <span class={`${styles.chip} ${styles[status]}`} data-status={status}>
      <span class={styles.icon}>
        <Glyph />
      </span>
      {label}
    </span>
  );
}
