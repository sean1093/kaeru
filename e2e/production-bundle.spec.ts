import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';

/**
 * M1-3e (#27): the gallery's bundle-absence claim needs a gate, not a PR-body
 * measurement. Runs once per production project (no browser needed — a fast `fs` check,
 * deliberately run three times against the same `dist/`: a dedicated project would cost
 * more to maintain than the second and third runs cost to execute).
 *
 * `GALLERY_MARKER` in `src/features/gallery/GalleryScreen.tsx` is a string used nowhere
 * else in the app; grepping for a gallery-only *content* string is the correct gate —
 * the registration glob's key map still carries the module path
 * (`"/src/features/gallery/index.ts"`), which is why #65/#98's bundle-absence test
 * targets content rather than the path string.
 */
const GALLERY_MARKER = 'kaeru-ui-kit-gallery';

/**
 * A regression tripwire, not **the** budget — ADR 0003 sets that, initial JS ≤ 100 KB gzip
 * for the whole app. This number is deliberately a different kind of check: it sums each JS
 * asset's own gzip size rather than the bundle's actual gzip size, and it ignores CSS, so it
 * is not a substitute for the real budget — it exists to fail fast on an accidental import,
 * the gallery's above all, and is re-baselined deliberately when a feature legitimately
 * moves the floor.
 *
 * Baselines: 23.3 KB at #27, when this was "roughly twice today's size". 53.7 KB at #140,
 * where the guide made the bundled content reachable for the first time — guide, FAQ and
 * operators in both locales, in the bundle by ADR 0006 so they work offline — plus #122's
 * backup service. Doubling stopped making sense there (it would pass the budget itself), so
 * the tripwire is now the baseline plus about 10 KB: room for the next feature to arrive and
 * be noticed. It is a coarse guard for the gallery — whose source alone gzips to about
 * 10.6 KB before minification, so a leak lands near this line, not certainly past it — and
 * the content-marker test above is the gallery's exact one.
 */
const GZIP_TRIPWIRE_BYTES = 64 * 1024;

test.describe('production bundle (#27 bundle-absence gate)', () => {
  test('contains no gallery content string', () => {
    const assetsDir = join(process.cwd(), 'dist', 'assets');
    const files = readdirSync(assetsDir).filter((name) => name.endsWith('.js'));
    expect(files.length, 'no built JS assets found — did the build run?').toBeGreaterThan(0);

    const offenders = files.filter((name) => {
      const contents = readFileSync(join(assetsDir, name), 'utf8');
      return contents.includes(GALLERY_MARKER);
    });
    expect(offenders, 'built JS asset(s) containing the gallery-only marker string').toEqual([]);
  });

  test('gzip size stays under the regression tripwire', () => {
    const assetsDir = join(process.cwd(), 'dist', 'assets');
    const jsFiles = readdirSync(assetsDir).filter((name) => name.endsWith('.js'));
    let totalGzip = 0;
    for (const name of jsFiles) {
      const buf = readFileSync(join(assetsDir, name));
      totalGzip += gzipSync(buf).length;
    }
    expect(
      totalGzip,
      `production JS gzip size ${(totalGzip / 1024).toFixed(2)} KB exceeds the ${(GZIP_TRIPWIRE_BYTES / 1024).toFixed(0)} KB tripwire`,
    ).toBeLessThan(GZIP_TRIPWIRE_BYTES);
  });
});
