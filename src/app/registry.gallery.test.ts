import { describe, expect, it } from 'vitest';
import { features } from './registry.ts';

/**
 * This suite runs under Vitest, which sets `import.meta.env.DEV = true`: the gallery
 * feature is expected to register here. Its absence from a *production* build is proved
 * separately, against the real build output (`src/features/gallery/bundle.e2e.test.ts`
 * would be the natural home, but there is no production bundle inside Vitest — see the
 * build-output assertion in the PR body / CI's `npm run build`, and the probe measurement
 * recorded on #65).
 */
describe('feature registry in a development build', () => {
  it('registers the gallery feature at /dev/gallery, outside the tab navigation', () => {
    const gallery = features.find((feature) => feature.id === 'gallery');
    expect(gallery).toBeDefined();
    expect(gallery?.path).toBe('/dev/gallery');
    expect(gallery?.nav).toBeUndefined();
  });
});
