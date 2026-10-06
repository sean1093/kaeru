import { describe, expect, it } from 'vitest';
import { defineMessages } from '../i18n/index.ts';
import type { Icon } from '../ui/contracts.ts';
import { defineFeature } from './feature.ts';
import type { FeatureV2, ScreenId, ScreenRoute } from './navigation.ts';
import { collectFeatures, features, featuresFromModules, routes, tabFeatures } from './registry.ts';
import { ROUTE_DEFINITIONS } from './screens.ts';

const messages = defineMessages({
  'zh-TW': { 'test.nav': '測試' },
  en: { 'test.nav': 'Test' },
});

const noScreen = () => null;
/** The kit's `Icon` returns a VNode; these tests never render one. */
const icon = (() => null) as unknown as Icon;

function route(pattern: string, screenIds: readonly ScreenId[], extra: Partial<ScreenRoute> = {}) {
  return { pattern, screenIds, chrome: 'tabs', screen: noScreen, ...extra } as ScreenRoute;
}

function featureWith(
  id: string,
  routes: readonly ScreenRoute[],
  tab?: number,
  screenId: ScreenId = 'S10',
): FeatureV2 {
  return defineFeature({
    id,
    messages,
    routes,
    ...(tab === undefined ? {} : { tab: { order: tab, screenId, labelKey: 'test.nav', icon } }),
  });
}

/**
 * Every case here is a mis-registration that would otherwise render *something* — just not
 * what the author meant. That is why they throw at boot: the symptom of each is a wrong
 * screen rather than an error, which is the hardest kind of bug to notice.
 */
describe('registry v2 startup validation', () => {
  it('refuses two features claiming the same route pattern, naming both', () => {
    expect(() =>
      collectFeatures([
        featureWith('home', [route('/', ['S10'])]),
        featureWith('summary', [route('/', ['S11'])]),
      ]),
    ).toThrow(/Route "\/" is claimed by both "home" and "summary"/);
  });

  it('refuses two features claiming the same screen id, naming both', () => {
    expect(() =>
      collectFeatures([
        featureWith('receipts', [route('/receipts', ['S20'])]),
        featureWith('other', [route('/receipts/new', ['S20'], { chrome: 'fullscreen' })]),
      ]),
    ).toThrow(/Screen "S20" is claimed by both "receipts" and "other"/);
  });

  it('refuses two tabs at the same position, naming both', () => {
    expect(() =>
      collectFeatures([
        featureWith('home', [route('/', ['S10'])], 10),
        featureWith('guide', [route('/guide', ['S50'])], 10, 'S50'),
      ]),
    ).toThrow(/Tab order 10 is claimed by both "home" and "guide"/);
  });

  it('refuses a route the published inventory does not contain', () => {
    // Inventing a pattern forks the route table, and the fork stays invisible until a
    // cross-track `pathTo` link lands on a route nobody registered.
    expect(() =>
      collectFeatures([featureWith('rogue', [route('/not-a-screen', ['S10'])])]),
    ).toThrow(/not in the published route inventory/);
  });

  it('refuses a screen id registered on the wrong route', () => {
    expect(() => collectFeatures([featureWith('home', [route('/', ['S20'])])])).toThrow(
      /claims screen "S20" on "\/", but the inventory puts it on "\/receipts"/,
    );
  });

  it('refuses chrome that disagrees with the inventory', () => {
    // An Airport screen that forgets `mode` would ship a tab bar into a customs queue.
    expect(() => collectFeatures([featureWith('airport', [route('/airport', ['S30'])])])).toThrow(
      /chrome "tabs", but the inventory says "mode"/,
    );
  });

  it('refuses a sheet the inventory does not allow on that route', () => {
    expect(() =>
      collectFeatures([featureWith('home', [route('/', ['S10'], { sheets: ['operator'] })])]),
    ).toThrow(/declares sheet "operator" on "\/", which the inventory does not allow there/);
  });

  it('refuses a tab whose destination needs a parameter nobody can supply', () => {
    expect(() =>
      collectFeatures([
        featureWith(
          'receipts',
          [route('/receipts/:receiptId', ['S22'], { sheets: [] })],
          20,
          'S22',
        ),
      ]),
    ).toThrow(/needs a parameter. A tab's destination must be a plain path/);
  });

  it('accepts a correct registration and sorts it stably', () => {
    const collected = collectFeatures([
      featureWith('settings', [route('/settings', ['S60'])]),
      featureWith('home', [route('/', ['S10'])], 10),
    ]);
    expect(collected.map((feature) => feature.id)).toEqual(['home', 'settings']);
  });
});

describe('feature modules', () => {
  it('skips a module that exports nothing, so a dev-only feature leaves the production bundle', () => {
    // This filter is load-bearing: `export const feature = import.meta.env.DEV ? … :
    // undefined` is the only way an eager glob can drop the UI-kit gallery from production,
    // and the bundle-size check on #27 is the only other thing that would catch its return.
    const collected = featuresFromModules({
      '/src/features/home/index.ts': { feature: featureWith('home', [route('/', ['S10'])]) },
      '/src/features/gallery/index.ts': {},
    });
    expect(collected.map((feature) => feature.id)).toEqual(['home']);
  });
});

describe('the real registration', () => {
  it('registers every route against the published inventory', () => {
    // Vitest runs with import.meta.env.DEV = true, so the gallery (M1-3, #65) registers
    // here same as it would in `npm run dev`; its absence from a production build is
    // proved separately in `e2e/production-bundle.spec.ts` (#27), where DEV is false.
    //
    // A census, not a decision: every track adds routes, so pinning the list would make
    // this file a merge-conflict generator in the one place #33 exists to keep
    // conflict-free. The property that matters is that nothing registers a route the
    // published inventory does not know about — and `/dev/gallery` is deliberately not in
    // it, which is why the development tool is excluded here rather than exempted there.
    expect(features.length).toBeGreaterThan(0);
    expect(routes.length).toBeGreaterThan(0);
    for (const entry of routes) {
      if (entry.pattern.startsWith('/dev/')) continue;
      expect(
        ROUTE_DEFINITIONS[entry.pattern],
        `"${entry.pattern}" is not in the published inventory`,
      ).toBeDefined();
    }
  });

  it('makes settings an app-bar route rather than a fifth tab', () => {
    // IA section 2: four tabs is the maximum that keeps every target >= 64 px wide with
    // English labels un-truncated at 320 px, and settings is visited a handful of times.
    expect(tabFeatures.map((feature) => feature.id)).toEqual(['home']);
  });
});
