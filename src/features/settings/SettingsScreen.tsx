import type { JSX } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { LanguageSwitcher } from '../../app/LanguageSwitcher.tsx';
import { screenAttrs } from '../../app/screens.ts';
import { setTheme, settings } from '../../app/settings-store.ts';
import {
  BackupError,
  exportBackup,
  getDatabase,
  importBackup,
  parseBackup,
  SCHEMA_VERSION,
  THEME_PREFERENCES,
  type ThemePreference,
} from '../../data/index.ts';
import { systemClock } from '../../domain/index.ts';
import { useMessages } from '../../i18n/index.ts';
import { Button, Card, VisuallyHidden } from '../../ui/index.ts';
import { messages } from './messages.ts';
import styles from './SettingsScreen.module.css';

const THEME_LABEL_KEY = {
  system: 'settings.theme.system',
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
} as const satisfies Record<ThemePreference, string>;

export function SettingsScreen(): JSX.Element {
  const t = useMessages(messages);
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string>('');
  const theme = settings.value.theme;

  async function downloadBackup(): Promise<void> {
    const backup = await exportBackup(await getDatabase(), systemClock);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kaeru-backup-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function readBackup(file: File): Promise<void> {
    try {
      await importBackup(await getDatabase(), parseBackup(await file.text()));
      setNotice(t('settings.data.imported'));
    } catch (error) {
      setNotice(
        error instanceof BackupError
          ? t(`settings.error.${error.code}`)
          : t('settings.error.not-a-backup'),
      );
    }
  }

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
        <div class={styles.actions}>
          <Button data-testid="export-backup" onClick={() => void downloadBackup()}>
            {t('settings.data.export')}
          </Button>
          <Button variant="quiet" onClick={() => fileInput.current?.click()}>
            {t('settings.data.import')}
          </Button>
        </div>
        <input
          ref={fileInput}
          class={styles.fileInput}
          type="file"
          accept="application/json,.json"
          aria-label={t('settings.data.import')}
          data-testid="import-backup"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void readBackup(file);
            event.currentTarget.value = '';
          }}
        />
        <p role="status" class={styles.meta} data-testid="backup-notice">
          {notice}
        </p>
      </Card>
    </div>
  );
}
