export const LOCALES = ['zh-TW', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh-TW';

/** BCP 47 tag written to `<html lang>`; `zh-TW` is better spelled `zh-Hant-TW`. */
export const HTML_LANG: Record<Locale, string> = {
  'zh-TW': 'zh-Hant-TW',
  en: 'en',
};

/** Native name of each locale, used by the language switcher in every language. */
export const LOCALE_LABEL: Record<Locale, string> = {
  'zh-TW': '中文',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Pick the best supported locale for a list of browser language tags.
 * Any Chinese tag that is not explicitly Simplified maps to zh-TW.
 */
export function negotiateLocale(
  preferred: readonly string[],
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  for (const raw of preferred) {
    const tag = raw.toLowerCase();
    if (tag === 'zh-cn' || tag === 'zh-sg' || tag.startsWith('zh-hans')) continue;
    if (tag.startsWith('zh')) return 'zh-TW';
    if (tag.startsWith('en')) return 'en';
  }
  return fallback;
}
