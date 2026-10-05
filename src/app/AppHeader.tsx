import type { JSX } from 'preact';
import { useMessages } from '../i18n/index.ts';
import { BrandMark } from '../ui/BrandMark.tsx';
import styles from './AppHeader.module.css';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { messages } from './messages.ts';
import { hrefFor } from './router.ts';

export function AppHeader(): JSX.Element {
  const t = useMessages(messages);
  return (
    <header class={styles.header}>
      <div class={styles.inner}>
        <a class={styles.brand} href={hrefFor('/')} data-testid="brand-home">
          <BrandMark />
          <span class={styles.text}>
            <span class={styles.name}>{t('app.name')}</span>
            <span class={styles.tagline}>{t('app.tagline')}</span>
          </span>
        </a>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
