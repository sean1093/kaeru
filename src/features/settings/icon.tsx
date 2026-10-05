import type { JSX } from 'preact';

export function SettingsIcon(): JSX.Element {
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
