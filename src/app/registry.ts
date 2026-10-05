import type { FeatureModule, FeatureV2, ScreenRoute } from './navigation.ts';
import { ROUTE_DEFINITIONS, SCREEN_LOCATIONS } from './screens.ts';

/** Widened for lookups keyed by an id the caller was handed rather than wrote. */
const LOCATION_BY_SCREEN: Readonly<Record<string, { pattern: string } | undefined>> =
  SCREEN_LOCATIONS;

/**
 * Feature registration v2.
 *
 * A feature registers itself by existing: `src/features/<id>/index.ts` exports `feature` and
 * the glob below picks it up. A feature branch therefore adds a folder and touches nothing
 * shared, which is what lets four M2 tracks run at once without any of them waiting to merge
 * a registration file.
 *
 * Everything here fails at boot rather than at the moment a user walks into it. A duplicate
 * route pattern, a screen id claimed twice, two tabs at the same position, a route the
 * published inventory does not contain — each of those renders *something*, just not the
 * thing the author meant, and the symptom is a wrong screen rather than an error. Loud at
 * startup is the only version that cannot ship.
 */

const modules = import.meta.glob<FeatureModule>('/src/features/*/index.ts', {
  eager: true,
});

/**
 * A feature module is allowed to export nothing. The glob is eager, so a development-only
 * feature can only stay out of the production bundle by registering as
 * `export const feature = import.meta.env.DEV ? defineFeature({ … }) : undefined`: Vite
 * replaces the condition at build time and Rollup drops the whole module subtree. A runtime
 * check would not do it, and a second registration mechanism would reintroduce the shared
 * file this one exists to avoid.
 *
 * **The filter is load-bearing, not dead code.** Deleting it puts the UI-kit gallery in the
 * production bundle, and the bundle-size check on #27 is the only thing that would notice.
 */
export function featuresFromModules(
  entries: Readonly<Record<string, FeatureModule>>,
): readonly FeatureV2[] {
  return collectFeatures(
    Object.values(entries)
      .map((module) => module.feature)
      .filter((feature): feature is FeatureV2 => feature !== undefined),
  );
}

/**
 * Validate the whole registration and return it in a stable order.
 *
 * Every error names both claimants, because "duplicate route" sends someone hunting through
 * every feature folder and "claimed by both home and summary" does not.
 */
export function collectFeatures(entries: readonly FeatureV2[]): readonly FeatureV2[] {
  const byPattern = new Map<string, string>();
  const byScreen = new Map<string, string>();
  const byTabOrder = new Map<number, string>();

  for (const feature of entries) {
    for (const route of feature.routes) {
      // Duplicate screen ids first: two features claiming one screen is the clash that
      // names both owners usefully, and it is true regardless of which route each used.
      for (const screen of route.screenIds) {
        const clashingScreen = byScreen.get(screen);
        if (clashingScreen) {
          throw new Error(
            `Screen "${screen}" is claimed by both "${clashingScreen}" and "${feature.id}".`,
          );
        }
        byScreen.set(screen, feature.id);
      }

      const clashingRoute = byPattern.get(route.pattern);
      if (clashingRoute) {
        throw new Error(
          `Route "${route.pattern}" is claimed by both "${clashingRoute}" and "${feature.id}".`,
        );
      }
      byPattern.set(route.pattern, feature.id);

      // The inventory in `screens.ts` is the published route table (IA section 3.1). A
      // feature that invents a pattern has forked it, and the fork is invisible until a
      // cross-track `pathTo` link lands on a route nobody registered.
      const known = ROUTE_DEFINITIONS[route.pattern];
      if (!known) {
        throw new Error(
          `Feature "${feature.id}" registers "${route.pattern}", which is not in the published route inventory. Add it to src/app/screens.ts, or use the pattern the inventory already has.`,
        );
      }

      if (route.chrome !== known.chrome) {
        throw new Error(
          `Feature "${feature.id}" registers "${route.pattern}" with chrome "${route.chrome}", but the inventory says "${known.chrome}".`,
        );
      }

      for (const screen of route.screenIds) {
        if (LOCATION_BY_SCREEN[screen]?.pattern !== route.pattern) {
          throw new Error(
            `Feature "${feature.id}" claims screen "${screen}" on "${route.pattern}", but the inventory puts it on "${LOCATION_BY_SCREEN[screen]?.pattern ?? 'no route'}".`,
          );
        }
      }

      for (const sheet of route.sheets ?? []) {
        if (!(known.sheets as readonly string[]).includes(sheet)) {
          throw new Error(
            `Feature "${feature.id}" declares sheet "${sheet}" on "${route.pattern}", which the inventory does not allow there.`,
          );
        }
      }
    }

    if (feature.tab) {
      const clashingTab = byTabOrder.get(feature.tab.order);
      if (clashingTab) {
        throw new Error(
          `Tab order ${feature.tab.order} is claimed by both "${clashingTab}" and "${feature.id}".`,
        );
      }
      byTabOrder.set(feature.tab.order, feature.id);

      // A tab is a permanent destination, so it cannot need a parameter nobody can supply:
      // there is no receipt id to put in the bar. Checked here rather than left to produce
      // a link to a literal `/receipts/:receiptId` that matches nothing.
      const destination = feature.routes[0];
      if (!destination) {
        throw new Error(`Feature "${feature.id}" registers a tab but no route for it to open.`);
      }
      if (destination.pattern.includes(':')) {
        throw new Error(
          `Feature "${feature.id}" opens its tab on "${destination.pattern}", which needs a parameter. A tab's destination must be a plain path.`,
        );
      }
    }
  }

  return [...entries].sort((a, b) => a.id.localeCompare(b.id));
}

export const features: readonly FeatureV2[] = featuresFromModules(modules);

/** Every registered route, flattened, for the router to match against. */
export const routes: readonly ScreenRoute[] = features.flatMap((feature) => feature.routes);

/** Tabs in their declared order. Sparse numbering leaves room to insert without renumbering. */
export const tabFeatures: readonly FeatureV2[] = features
  .filter((feature) => feature.tab !== undefined)
  .sort((a, b) => (a.tab?.order ?? 0) - (b.tab?.order ?? 0));
