import type { JSX } from 'preact';
import { useMessages } from '../i18n/index.ts';
import { BrandMark } from '../ui/BrandMark.tsx';
import styles from './AppHeader.module.css';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { messages } from './messages.ts';
import { hrefFor } from './router.ts';
import { SettingsGlyph } from './SettingsAction.tsx';
import { pathTo } from './screens.ts';

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
        <div class={styles.actions}>
          <LanguageSwitcher />
          {/*
            Settings is an app-bar action rather than a fifth tab (IA section 2): it is
            visited a handful of times per trip, and four tabs is the maximum that keeps
            every target >= 64 px wide with English labels un-truncated at 320 px.
          */}
          <a
            class={styles.action}
            href={hrefFor(pathTo('S60'))}
            aria-label={t('app.settings')}
            data-testid="app-bar-settings"
          >
            <SettingsGlyph />
          </a>
        </div>
      </div>
    </header>
  );
}
