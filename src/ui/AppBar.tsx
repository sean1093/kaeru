import type { JSX } from 'preact';
import styles from './AppBar.module.css';
import type { AppBarProps } from './contracts.ts';
import { ChevronLeftIcon, CloseIcon } from './icons.tsx';

/**
 * `components.md` section 1. One row: optional leading control, the screen's `<h1>`, at
 * most one icon action. More than one action belongs in an overflow menu, which the MVP
 * does not have, which is the point.
 *
 * `elevated` is the scrolled state. The shell decides when content has scrolled under the
 * bar; the bar itself has no scroll listener, so it stays usable in a test and in a sheet.
 */
export function AppBar({ title, elevated = false, leading, action }: AppBarProps): JSX.Element {
  const ActionIcon = action?.icon;

  return (
    <header class={`${styles.bar} ${elevated ? styles.elevated : ''}`} data-elevated={elevated}>
      {leading ? (
        <button
          type="button"
          class={styles.iconButton}
          aria-label={leading.label}
          onClick={leading.onActivate}
          data-testid="app-bar-leading"
        >
          {leading.kind === 'back' ? <ChevronLeftIcon /> : <CloseIcon />}
        </button>
      ) : null}

      <h1 class={styles.title}>{title}</h1>

      {action && ActionIcon ? (
        <button
          type="button"
          class={styles.iconButton}
          aria-label={action.label}
          onClick={action.onActivate}
          data-testid="app-bar-action"
        >
          <ActionIcon />
        </button>
      ) : null}
    </header>
  );
}
