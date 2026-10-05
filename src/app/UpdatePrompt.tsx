import type { JSX } from 'preact';
import { useMessages } from '../i18n/index.ts';
import { Button } from '../ui/index.ts';
import { messages } from './messages.ts';
import styles from './UpdatePrompt.module.css';
import { applyUpdate, needRefresh } from './update-state.ts';

/**
 * A new build never replaces the running one silently: a traveler mid-task at an
 * airport decides when to reload. See ADR 0007.
 */
export function UpdatePrompt(): JSX.Element | null {
  const t = useMessages(messages);
  if (!needRefresh.value) return null;
  return (
    <div class={styles.prompt} role="status" data-testid="update-prompt">
      <p class={styles.message}>{t('app.update.message')}</p>
      <div class={styles.actions}>
        <Button
          variant="quiet"
          onClick={() => {
            needRefresh.value = false;
          }}
        >
          {t('app.update.dismiss')}
        </Button>
        <Button onClick={() => void applyUpdate()} data-testid="update-apply">
          {t('app.update.action')}
        </Button>
      </div>
    </div>
  );
}
