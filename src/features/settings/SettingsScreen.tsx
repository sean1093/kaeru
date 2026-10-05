import type { JSX } from 'preact';
import { LanguageSwitcher } from '../../app/LanguageSwitcher.tsx';
import { hrefFor } from '../../app/router.ts';
import { pathTo, screenAttrs } from '../../app/screens.ts';
import { setTheme, settings } from '../../app/settings-store.ts';
import { SCHEMA_VERSION, THEME_PREFERENCES, type ThemePreference } from '../../data/index.ts';
import { useMessages } from '../../i18n/index.ts';
import { Card, VisuallyHidden } from '../../ui/index.ts';
import { messages } from './messages.ts';
import styles from './SettingsScreen.module.css';

const THEME_LABEL_KEY = {
  system: 'settings.theme.system',
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
} as const satisfies Record<ThemePreference, string>;

export function SettingsScreen(): JSX.Element {
  const t = useMessages(messages);
  const theme = settings.value.theme;

  return (
    <div class={styles.screen} {...screenAttrs('S60')}>
      <h1 class={styles.title}>{t('settings.title')}</h1>

      <Card title={t('settings.language.title')}>
        <p>{t('settings.language.body')}</p>
        <LanguageSwitcher />
      </Card>

      <Card title={t('settings.theme.title')}>
        <fieldset class={styles.fieldset}>
          <legend>
            <VisuallyHidden>{t('settings.theme.title')}</VisuallyHidden>
          </legend>
          <div class={styles.options}>
            {THEME_PREFERENCES.map((preference) => (
              <button
                key={preference}
                type="button"
                class={styles.option}
                aria-pressed={preference === theme}
                data-testid={`theme-${preference}`}
                onClick={() => void setTheme(preference)}
              >
                {t(THEME_LABEL_KEY[preference])}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card title={t('settings.data.title')}>
        <p>{t('settings.data.body')}</p>
        <p class={styles.meta}>{t('settings.data.schema', { version: SCHEMA_VERSION })}</p>
        {/*
          Export, import and delete live on S62, not here. One screen owns the backup
          surface so there is one import path rather than two — the v1 path on this screen
          wrote settings only, which looked like an import and was not one.
        */}
        <a class={styles.dataLink} href={hrefFor(pathTo('S62'))} data-testid="open-data">
          {t('settings.data.open')}
        </a>
      </Card>
    </div>
  );
}
