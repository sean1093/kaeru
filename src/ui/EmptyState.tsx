import type { JSX } from 'preact';
import { Button } from './Button.tsx';
import type { EmptyStateProps } from './contracts.ts';
import styles from './EmptyState.module.css';

/**
 * `components.md` section 14. An empty state says why it is empty and what fills it;
 * "No data" is not an empty state, it is a shrug.
 *
 * The headline is a `<p>`, not a heading: an empty state replaces the body of a list that
 * already sits under a heading, and inventing a level here is how heading order breaks.
 */
export function EmptyState({
  mark,
  headline,
  body,
  action,
  secondary,
}: EmptyStateProps): JSX.Element {
  const Mark = mark;

  return (
    <div class={styles.empty} data-testid="empty-state">
      {Mark ? (
        <span class={styles.mark} aria-hidden="true">
          <Mark />
        </span>
      ) : null}
      <p class={styles.headline}>{headline}</p>
      <p class={styles.body}>{body}</p>

      {action ? (
        action.href !== undefined ? (
          <a class={styles.action} href={action.href}>
            {action.label}
          </a>
        ) : (
          <Button variant="primary" onClick={action.onActivate}>
            {action.label}
          </Button>
        )
      ) : null}

      {secondary ? (
        <a class={styles.secondary} href={secondary.href}>
          {secondary.label}
        </a>
      ) : null}
    </div>
  );
}
