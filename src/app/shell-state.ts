import { signal } from '@preact/signals';
import type { BannerProps } from '../ui/index.ts';
import type { ShellBanner, ToastHost } from './navigation.ts';

/**
 * The two pieces of chrome state that outlive the screen showing them.
 *
 * Both live here rather than in a component because both are *shell* state by definition:
 * a banner that survives navigation cannot be owned by a screen that unmounts, and a toast
 * raised by the action of leaving a screen has to outlive it by design.
 */

export type ShellBannerState = (BannerProps & { dismissible: false }) | null;

export const shellBanner = signal<ShellBannerState>(null);

/**
 * The one shell state that can save a refund: "do not check your bags yet" (`UJ-026`,
 * `UJ-031`, IA flow F).
 *
 * There is deliberately **no dismiss path** — not a close button, not a timeout, not an
 * auto-clear on navigation. It is cleared only by `clear()`, which Airport Mode calls at
 * step 4 once customs confirmation is recorded. The reason is the consequence: a traveller
 * who dismisses this banner and then checks their bags has put the goods beyond the reach
 * of the customs check, and no part of the refund can be recovered afterwards. A banner
 * that can be swiped away during a five-step flow is one the user will swipe away.
 *
 * `live` is forced to `'none'` for the same reason it exists in `BannerProps`: the banner
 * persists across every Airport Mode step, and a live region would re-announce it on each
 * one — five interruptions to someone reading a kiosk screen in a queue.
 */
export const appShellBanner: ShellBanner = {
  set(banner) {
    shellBanner.value = { ...banner, live: 'none' };
  },
  clear() {
    shellBanner.value = null;
  },
};

export interface ShellToast {
  /** Changes on every `show`, so a repeated message still restarts the timer. */
  readonly id: number;
  readonly message: string;
  readonly action?: { label: string; onActivate: () => void };
}

export const shellToast = signal<ShellToast | null>(null);

let nextToastId = 0;

/**
 * One toast at a time: a new one replaces the current one rather than stacking.
 *
 * The `id` matters more than it looks. Showing the same message twice — "Receipt saved",
 * twice in a row, which is the commonest case in the twenty-second add flow — would
 * otherwise be a no-op for the `Toast` component, whose timer is keyed on the message, so
 * the second confirmation would inherit whatever was left of the first one's countdown and
 * could vanish almost immediately.
 */
export const appToastHost: ToastHost = {
  show(message, action) {
    nextToastId += 1;
    shellToast.value = action ? { id: nextToastId, message, action } : { id: nextToastId, message };
  },
};

export function dismissToast(id: number): void {
  // Ignore a dismissal from a toast that has already been replaced: its timer may land
  // after the new one is on screen, and acting on it would cut the new one short.
  if (shellToast.value?.id === id) shellToast.value = null;
}
