import type { JSX } from 'preact';
import styles from './Banner.module.css';
import type { BannerProps } from './contracts.ts';
import { CheckCircleIcon, CircleAlertIcon, InfoIcon } from './icons.tsx';

const TONE_ICON = {
  info: InfoIcon,
  attention: CircleAlertIcon,
  success: CheckCircleIcon,
} as const;

/**
 * `components.md` section 13. Persistent, in-flow, never dismissible by timeout — unlike
 * `Toast`, a banner stays until the situation it describes changes.
 *
 * `live` defaults to `'none'`: a persistent shell banner (the Airport Mode "do not check
 * your bags yet" warning) must not re-announce on every step. `'alert'` is reserved for a
 * banner that appears in direct response to something the user just did.
 */
export function Banner({ tone, heading, body, action, live = 'none' }: BannerProps): JSX.Element {
  const Icon = TONE_ICON[tone];
  const role = live === 'alert' ? 'alert' : live === 'status' ? 'status' : undefined;
  const ariaLive = live === 'none' ? 'off' : undefined;

  return (
    <div class={`${styles.banner} ${styles[tone]}`} role={role} aria-live={ariaLive}>
      <span class={styles.icon} aria-hidden="true">
        <Icon />
      </span>
      <div class={styles.text}>
        {heading ? <p class={styles.heading}>{heading}</p> : null}
        <p class={styles.body}>{body}</p>
        {action ? (
          action.href !== undefined ? (
            <a class={styles.action} href={action.href}>
              {action.label}
            </a>
          ) : (
            <button type="button" class={styles.action} onClick={action.onActivate}>
              {action.label}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
