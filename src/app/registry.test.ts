import { describe, expect, it } from 'vitest';
import { defineMessages } from '../i18n/index.ts';
import { defineFeature } from './feature.ts';
import { type FeatureModule, featuresFromModules } from './registry.ts';

const messages = defineMessages({
  'zh-TW': { 'test.nav': '測試' },
  en: { 'test.nav': 'Test' },
});

function moduleFor(id: string, path: string): FeatureModule {
  return {
    feature: defineFeature({ id, path, messages, screen: () => null }),
  };
}

describe('feature registry', () => {
  it('skips a feature module that exports nothing, so a dev-only feature can be dropped from the production bundle', () => {
    const features = featuresFromModules({
      '/src/features/home/index.ts': moduleFor('home', '/'),
      // What `export const feature = import.meta.env.DEV ? … : undefined` compiles to.
      '/src/features/gallery/index.ts': {},
    });

    expect(features.map((feature) => feature.id)).toEqual(['home']);
  });

  it('refuses two features that claim the same route', () => {
    expect(() =>
      featuresFromModules({
        '/src/features/home/index.ts': moduleFor('home', '/'),
        '/src/features/summary/index.ts': moduleFor('summary', '/'),
      }),
    ).toThrow(/claimed by both/);
  });
});
