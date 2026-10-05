import { activeLocale } from './active-locale.ts';
import { type MessageBundle, translate, type Values } from './bundle.ts';

export { activeLocale, detectLocale, setActiveLocale } from './active-locale.ts';
export type { MessageBundle, MessageModule, Values } from './bundle.ts';
export { defineMessages, translate } from './bundle.ts';
export { allBundles } from './catalogs.ts';
export { formatCurrency, formatDate, formatNumber } from './format.ts';
export type { Locale } from './locale.ts';
export {
  DEFAULT_LOCALE,
  HTML_LANG,
  isLocale,
  LOCALE_LABEL,
  LOCALES,
  negotiateLocale,
} from './locale.ts';

export type Translate<K extends string> = (key: K, values?: Values) => string;

/**
 * Bind a message bundle to the active language. Reading the signal inside a component
 * subscribes it, so switching language re-renders every screen without a provider.
 */
export function useMessages<K extends string>(bundle: MessageBundle<K>): Translate<K> {
  const locale = activeLocale.value;
  return (key, values) => translate(bundle, locale, key, values);
}
