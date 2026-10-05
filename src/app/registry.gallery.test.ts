import { describe, expect, it } from 'vitest';
import { features } from './registry.ts';

/**
 * This suite runs under Vitest, which sets `import.meta.env.DEV = true`: the gallery
 * feature is expected to register here. Its absence from a *production* build is proved
 * separately, against the real build output — `e2e/production-bundle.spec.ts` (M1-3e,
 * #27), since there is no production bundle inside Vitest. See also the probe measurement
 * recorded on #65 and the dev-route exemption in `registry.ts`'s `collectFeatures`.
 */
describe('feature registry in a development build', () => {
  it('registers the gallery feature at /dev/gallery, outside the tab navigation', () => {
    const gallery = features.find((feature) => feature.id === 'gallery');
    expect(gallery).toBeDefined();
    expect(gallery?.routes[0]?.pattern).toBe('/dev/gallery');
    expect(gallery?.routes[0]?.screenIds).toEqual([]);
    expect(gallery?.tab).toBeUndefined();
  });
});
