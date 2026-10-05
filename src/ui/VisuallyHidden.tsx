import type { ComponentChildren, JSX } from 'preact';
import styles from './VisuallyHidden.module.css';

/** Text for screen readers only — never use it to hide something from everyone. */
export function VisuallyHidden({ children }: { children: ComponentChildren }): JSX.Element {
  return <span class={styles.hidden}>{children}</span>;
}
