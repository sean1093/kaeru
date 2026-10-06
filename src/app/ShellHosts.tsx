import type { JSX } from 'preact';
import { Banner, Toast } from '../ui/index.ts';
import styles from './ShellHosts.module.css';
import { dismissToast, shellBanner, shellToast } from './shell-state.ts';

/**
 * The shell's banner slot.
 *
 * Rendered by the shell rather than by a screen, which is the whole requirement: the
 * bag-drop warning has to survive every Airport Mode step, and a screen that unmounts
 * cannot hold it. It renders above the content and below the app bar, so it is the first
 * thing read after the screen's title and cannot be scrolled past.
 */
export function ShellBannerSlot(): JSX.Element | null {
  const banner = shellBanner.value;
  if (!banner) return null;
  return (
    <div class={styles.banner} data-testid="shell-banner">
      <Banner
        tone={banner.tone}
        {...(banner.heading === undefined ? {} : { heading: banner.heading })}
        body={banner.body}
        {...(banner.action === undefined ? {} : { action: banner.action })}
        live="none"
      />
    </div>
  );
}

/**
 * One toast at a time, fixed above the navigation.
 *
 * Keyed on the toast's id rather than its message so showing the same text twice remounts
 * the component and restarts its countdown — otherwise a second "Receipt saved" would
 * inherit the remains of the first one's timer and could disappear almost at once.
 */
export function ShellToastHost(): JSX.Element | null {
  const toast = shellToast.value;
  if (!toast) return null;
  return (
    <div class={styles.toast} data-testid="shell-toast">
      <Toast
        key={toast.id}
        message={toast.message}
        {...(toast.action === undefined ? {} : { action: toast.action })}
        onDismiss={() => dismissToast(toast.id)}
      />
    </div>
  );
}
