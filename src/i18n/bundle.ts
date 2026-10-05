import type { Locale } from './locale.ts';

/**
 * A message bundle is a plain object keyed by locale. Bundles are declared per feature
 * (`src/features/<feature>/messages.ts`) so parallel feature branches never touch a
 * shared translation file, and `defineMessages` makes TypeScript reject a bundle whose
 * locales do not have exactly the same keys.
 */
export type MessageBundle<K extends string = string> = {
  readonly [L in Locale]: { readonly [P in K]: string };
};

export interface MessageModule {
  readonly id: string;
  readonly messages: MessageBundle;
}

export function defineMessages<T extends Record<string, string>>(bundle: {
  'zh-TW': T;
  en: { [K in keyof T]: string };
}): MessageBundle<Extract<keyof T, string>> {
  return bundle as MessageBundle<Extract<keyof T, string>>;
}

export type Values = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Look a key up in a bundle and substitute `{name}` placeholders.
 * A missing translation falls back to the key itself so a gap is visible, never blank.
 */
export function translate<K extends string>(
  bundle: MessageBundle<K>,
  locale: Locale,
  key: K,
  values?: Values,
): string {
  const template = bundle[locale][key] ?? key;
  if (!values) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}
