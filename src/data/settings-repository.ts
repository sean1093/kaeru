import { DEFAULT_LOCALE, isLocale } from '../i18n/index.ts';
import type { KaeruDatabase } from './db.ts';
import {
  type AppSettings,
  SETTINGS_KEY,
  THEME_PREFERENCES,
  type ThemePreference,
} from './types.ts';

export const DEFAULT_SETTINGS: AppSettings = {
  locale: DEFAULT_LOCALE,
  theme: 'system',
};

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/**
 * Stored settings are user data from an earlier app version or an imported backup, so
 * every field is validated and unknown values fall back to the default.
 */
export function normalizeSettings(value: unknown, fallback: AppSettings): AppSettings {
  if (typeof value !== 'object' || value === null) return fallback;
  const candidate = value as Partial<AppSettings>;
  return {
    locale: isLocale(candidate.locale) ? candidate.locale : fallback.locale,
    theme: isThemePreference(candidate.theme) ? candidate.theme : fallback.theme,
  };
}

export async function loadSettings(
  db: KaeruDatabase,
  fallback: AppSettings = DEFAULT_SETTINGS,
): Promise<AppSettings> {
  return normalizeSettings(await db.get('settings', SETTINGS_KEY), fallback);
}

/** Merge a patch into the stored settings and return the result. */
export async function saveSettings(
  db: KaeruDatabase,
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const tx = db.transaction('settings', 'readwrite');
  const store = tx.objectStore('settings');
  const current = normalizeSettings(await store.get(SETTINGS_KEY), DEFAULT_SETTINGS);
  const next = normalizeSettings({ ...current, ...patch }, current);
  await store.put(next, SETTINGS_KEY);
  await tx.done;
  return next;
}
