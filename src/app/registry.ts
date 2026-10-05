import type { Feature } from './feature.ts';

/**
 * Features register themselves by existing. Adding `src/features/<name>/index.ts` with a
 * default-exported `feature` puts it in the router and the navigation, so two feature
 * branches never conflict over a shared registration file.
 */
const modules = import.meta.glob<{ feature: Feature }>('/src/features/*/index.ts', {
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

export const features: readonly Feature[] = collectFeatures(
  Object.values(modules).map((module) => module.feature),
);

export const navigationFeatures: readonly Feature[] = features
  .filter((feature) => feature.nav !== undefined)
  .sort((a, b) => (a.nav?.order ?? 0) - (b.nav?.order ?? 0));

export function featureForPath(path: string): Feature | undefined {
  return features.find((feature) => feature.path === path);
}
