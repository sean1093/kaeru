import { signal } from '@preact/signals';
import { DEFAULT_LOCALE, HTML_LANG, isLocale, type Locale, negotiateLocale } from './locale.ts';

/**
 * Boot cache. IndexedDB is the canonical store for settings, but it is async and the
 * first paint must already be in the right language, so the chosen locale is mirrored
 * here and read synchronously at startup. See ADR 0005 and ADR 0006.
 */
const BOOT_CACHE_KEY = 'kaeru.locale';

function readBootCache(): Locale | null {
  try {
    const stored = localStorage.getItem(BOOT_CACHE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    // Private mode or storage disabled: fall back to detection.
    return null;
  }
}

export function detectLocale(): Locale {
  const cached = readBootCache();
  if (cached) return cached;
  const languages = typeof navigator === 'undefined' ? [] : navigator.languages;
  return negotiateLocale(languages ?? [], DEFAULT_LOCALE);
}

export const activeLocale = signal<Locale>(DEFAULT_LOCALE);

/** Set the UI language, mirror it to the boot cache and update `<html lang>`. */
export function setActiveLocale(locale: Locale): void {
  activeLocale.value = locale;
  try {
    localStorage.setItem(BOOT_CACHE_KEY, locale);
  } catch {
    // Non-fatal: the language still applies for this session.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = HTML_LANG[locale];
  }
}
