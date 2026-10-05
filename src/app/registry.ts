import type { Feature } from './feature.ts';

/** A feature module may export nothing — see `featuresFromModules`. */
export interface FeatureModule {
  feature?: Feature;
}

/**
 * Features register themselves by existing. Adding `src/features/<name>/index.ts` with a
 * default-exported `feature` puts it in the router and the navigation, so two feature
 * branches never conflict over a shared registration file.
 */
const modules = import.meta.glob<FeatureModule>('/src/features/*/index.ts', {
  eager: true,
});

export function collectFeatures(entries: readonly Feature[]): readonly Feature[] {
  const byPath = new Map<string, Feature>();
  for (const feature of entries) {
    const clash = byPath.get(feature.path);
    if (clash) {
      throw new Error(
        `Route "${feature.path}" is claimed by both "${clash.id}" and "${feature.id}".`,
      );
    }
    byPath.set(feature.path, feature);
  }
  return [...entries].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * A feature module is allowed to export nothing. The glob is eager, so a development-only
 * feature can only stay out of the production bundle by registering as
 * `export const feature = import.meta.env.DEV ? defineFeature({ … }) : undefined`: Vite
 * replaces the condition at build time and Rollup drops the whole module subtree. A
 * runtime check would not do it, and a second registration mechanism would reintroduce
 * the shared file that this one exists to avoid.
 */
export function featuresFromModules(
  entries: Readonly<Record<string, FeatureModule>>,
): readonly Feature[] {
  const declared = Object.values(entries)
    .map((module) => module.feature)
    .filter((feature): feature is Feature => feature !== undefined);
  return collectFeatures(declared);
}

export const features: readonly Feature[] = featuresFromModules(modules);

export const navigationFeatures: readonly Feature[] = features
  .filter((feature) => feature.nav !== undefined)
  .sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0));

export function featureForPath(path: string): Feature | undefined {
  return features.find((feature) => feature.path === path);
}
