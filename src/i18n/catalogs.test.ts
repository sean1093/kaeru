import { describe, expect, it } from 'vitest';
import { allBundles } from './catalogs.ts';
import { LOCALES } from './locale.ts';

describe('message catalogs', () => {
  it('finds every feature bundle', () => {
    expect(allBundles.length).toBeGreaterThanOrEqual(3);
    expect(allBundles.map((bundle) => bundle.id)).toContain('/src/features/home/messages.ts');
  });

  it.each(allBundles.map((bundle) => [bundle.id, bundle] as const))(
    '%s has the same keys in every locale',
    (_id, bundle) => {
      const [reference, ...rest] = LOCALES;
      const expected = Object.keys(bundle.messages[reference]).sort();
      for (const locale of rest) {
        expect(Object.keys(bundle.messages[locale]).sort()).toEqual(expected);
      }
    },
  );

  it.each(allBundles.map((bundle) => [bundle.id, bundle] as const))(
    '%s has no empty translations',
    (_id, bundle) => {
      for (const locale of LOCALES) {
        for (const [key, value] of Object.entries(bundle.messages[locale])) {
          expect(value.trim(), `${locale} ${key}`).not.toBe('');
        }
      }
    },
  );

  it('keeps message keys unique across bundles', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const bundle of allBundles) {
      for (const key of Object.keys(bundle.messages['zh-TW'])) {
        if (seen.has(key)) duplicates.push(key);
        seen.add(key);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('keeps the same placeholders in every locale', () => {
    const placeholders = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort();
    for (const bundle of allBundles) {
      for (const [key, zh] of Object.entries(bundle.messages['zh-TW'])) {
        const en = bundle.messages.en[key] ?? '';
        expect(placeholders(en), `${bundle.id} ${key}`).toEqual(placeholders(zh));
      }
    }
  });
});
