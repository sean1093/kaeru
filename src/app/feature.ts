import type { ComponentType } from 'preact';
import type { MessageBundle } from '../i18n/index.ts';

export interface FeatureNav {
  /** Lower comes first in the bottom navigation. */
  order: number;
  /** Key in the feature's own message bundle. */
  labelKey: string;
  icon: ComponentType;
}

export interface Feature {
  id: string;
  /** Route path inside the hash, always starting with `/`. */
  path: string;
  messages: MessageBundle;
  screen: ComponentType;
  nav?: FeatureNav;
}

/**
 * Declare a feature. Generic over the feature's message keys so `nav.labelKey` is
 * checked against the bundle instead of being a hopeful string.
 */
export function defineFeature<K extends string>(feature: {
  id: string;
  path: string;
  messages: MessageBundle<K>;
  screen: ComponentType;
  nav?: { order: number; labelKey: K; icon: ComponentType };
}): Feature {
  return feature as Feature;
}
