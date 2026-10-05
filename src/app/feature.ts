import type { MessageBundle } from '../i18n/index.ts';
import type { FeatureV2, ScreenRoute, TabRegistration } from './navigation.ts';

/**
 * Declare a feature.
 *
 * Generic over the feature's own message keys, so `tab.labelKey` is checked against the
 * bundle it is looked up in rather than being a hopeful string that renders as itself when
 * it is wrong. Everything else is validated at startup by `registry.ts`, against the
 * published screen inventory.
 */
export function defineFeature<K extends string>(feature: {
  id: string;
  messages: MessageBundle<K>;
  routes: readonly ScreenRoute[];
  tab?: Omit<TabRegistration, 'labelKey'> & { labelKey: K };
}): FeatureV2 {
  return feature as FeatureV2;
}
