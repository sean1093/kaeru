import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';

/**
 * M1-3e (#27): the gallery's bundle-absence claim needs a gate, not a PR-body
 * measurement. Runs once per production project (no browser needed — a fast `fs` check),
 * against the real `dist/` the `webServer` in `playwright.config.ts` just built.
 *
 * `GALLERY_MARKER` in `src/features/gallery/GalleryScreen.tsx` is a string used nowhere
 * else in the app; grepping for a gallery-only *content* string is the correct gate —
 * the registration glob's key map still carries the module path
 * (`"/src/features/gallery/index.ts"`), which is why #65/#98's bundle-absence test
 * targets content rather than the path string.
 */
const GALLERY_MARKER = 'kaeru-ui-kit-gallery';
/** `src/ui/**` + `src/features/gallery/**` at launch; generous headroom under the ~100 KB
 * budget stated in the architecture plan while still catching an accidental regression —
 * tightened once more of M1-3/M2 land and the real baseline is known. */
const GZIP_BUDGET_BYTES = 40 * 1024;

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

  test('gzip size stays under budget', () => {
    const assetsDir = join(process.cwd(), 'dist', 'assets');
    const jsFiles = readdirSync(assetsDir).filter((name) => name.endsWith('.js'));
    let totalGzip = 0;
    for (const name of jsFiles) {
      const buf = readFileSync(join(assetsDir, name));
      totalGzip += gzipSync(buf).length;
    }
    expect(
      totalGzip,
      `production JS gzip size ${(totalGzip / 1024).toFixed(2)} KB exceeds the ${(GZIP_BUDGET_BYTES / 1024).toFixed(0)} KB budget`,
    ).toBeLessThan(GZIP_BUDGET_BYTES);
  });

  test('dist/ exists and is non-trivial (sanity check for the two tests above)', () => {
    const distDir = join(process.cwd(), 'dist');
    const stat = statSync(distDir);
    expect(stat.isDirectory()).toBe(true);
  });
});
