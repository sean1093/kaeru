import type { JSX } from 'preact';

/**
 * The app bar's settings control.
 *
 * Lives in the shell rather than being imported from `src/features/settings`, deliberately:
 * the shell knowing a feature module would be the shared coupling that registration v2
 * exists to remove. It links by **screen id** through `pathTo`, which is a published
 * contract, so the settings feature can move its route without the shell noticing.
 *
 * M1-5b replaces this with the real `AppBar` component's `action` slot.
 */
export function SettingsGlyph(): JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2.2" fill="var(--color-surface)" />
      <circle cx="15" cy="12" r="2.2" fill="var(--color-surface)" />
      <circle cx="8" cy="17" r="2.2" fill="var(--color-surface)" />
    </svg>
  );
}
