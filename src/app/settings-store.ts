import { signal } from '@preact/signals';
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  getDatabase,
  loadSettings,
  saveSettings,
  type ThemePreference,
} from '../data/index.ts';
import { detectLocale, type Locale, setActiveLocale } from '../i18n/index.ts';

export const settings = signal<AppSettings>(DEFAULT_SETTINGS);

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

/**
 * Boot: show the detected language immediately, then reconcile with the stored
 * settings once IndexedDB answers. A first-time visitor keeps the detected language.
 */
export async function initSettings(): Promise<AppSettings> {
  const detected = detectLocale();
  setActiveLocale(detected);
  settings.value = { ...DEFAULT_SETTINGS, locale: detected };

  const stored = await loadSettings(await getDatabase(), { ...DEFAULT_SETTINGS, locale: detected });
  settings.value = stored;
  setActiveLocale(stored.locale);
  applyTheme(stored.theme);
  return stored;
}

export async function setLocale(locale: Locale): Promise<void> {
  setActiveLocale(locale);
  settings.value = { ...settings.value, locale };
  settings.value = await saveSettings(await getDatabase(), { locale });
}

export async function setTheme(theme: ThemePreference): Promise<void> {
  applyTheme(theme);
  settings.value = { ...settings.value, theme };
  settings.value = await saveSettings(await getDatabase(), { theme });
}
