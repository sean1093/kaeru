import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { ToastProps } from './contracts.ts';
import styles from './Toast.module.css';

const DEFAULT_DURATION_MS = 5000;
const WITH_ACTION_DURATION_MS = 10000;

/**
 * `components.md` section 13. Transient confirmation; `role="status"` /
 * `aria-live="polite"` rather than `alert`, because a save confirming itself is not an
 * interruption.
 *
 * Toasts never stack — the host that renders this component is responsible for showing
 * at most one at a time — and undo is a convenience: the action it undoes is always
 * reversible elsewhere, so this component is never the only path to it.
 */
export function Toast({ message, action, durationMs, onDismiss }: ToastProps): JSX.Element {
  const duration = durationMs ?? (action ? WITH_ACTION_DURATION_MS : DEFAULT_DURATION_MS);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    // Re-armed only when the visible message or duration changes; a changing
    // `onDismiss` identity across re-renders must not restart a countdown the user is
    // already watching, which is why it is read through a ref rather than listed here.
    const timer = window.setTimeout(() => onDismissRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [message, duration]);

  return (
    <div class={styles.toast} role="status" aria-live="polite">
      <span class={styles.message}>{message}</span>
      {action ? (
        <button type="button" class={styles.action} onClick={action.onActivate}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
