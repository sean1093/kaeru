import type { JSX } from 'preact';

/**
 * The Kaeru mark: a calm rounded square with an arrow coming back up — the tax
 * returning to the traveler. Decorative here; the app name next to it carries meaning.
 */
export function BrandMark({ size = 28 }: { size?: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="4" width="40" height="40" rx="12" fill="var(--color-primary)" />
      <path
        d="M24 34V17M16.5 24.5L24 16l7.5 8.5"
        fill="none"
        stroke="var(--color-on-primary)"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
