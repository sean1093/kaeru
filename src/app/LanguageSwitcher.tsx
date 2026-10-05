import type { JSX } from 'preact';
import { activeLocale, LOCALE_LABEL, LOCALES, useMessages } from '../i18n/index.ts';
import { VisuallyHidden } from '../ui/index.ts';
import styles from './LanguageSwitcher.module.css';
import { messages } from './messages.ts';
import { setLocale } from './settings-store.ts';

export function LanguageSwitcher(): JSX.Element {
  const t = useMessages(messages);
  const current = activeLocale.value;
  return (
    <fieldset class={styles.group}>
      <legend>
        <VisuallyHidden>{t('app.languageLabel')}</VisuallyHidden>
      </legend>
      <div class={styles.options}>
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            class={styles.option}
            aria-pressed={locale === current}
            data-testid={`language-${locale}`}
            onClick={() => void setLocale(locale)}
          >
            {LOCALE_LABEL[locale]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
