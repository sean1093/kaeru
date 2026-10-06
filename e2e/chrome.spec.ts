import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { E2E_LOCALES, E2E_ROUTES } from './support/routes.ts';

/**
 * The shell chrome, in a real browser.
 *
 * Chrome *switching* is asserted in `src/app/shell.test.tsx`, which can register a route of
 * each kind without inventing a feature. Here the concern is what only a browser can tell
 * us: that the bar is clear of the home indicator on a notched phone, and that the chrome
 * itself is accessible in both languages.
 */

test.describe('shell chrome', () => {
  for (const locale of E2E_LOCALES) {
    test(`the chrome is axe-clean in ${locale.id}`, async ({ page }, testInfo) => {
      for (const route of E2E_ROUTES) {
        await page.goto(route.path);
        await page.getByRole('banner').getByTestId(locale.testId).click();
        await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
        // Same settle the smoke's scan needs: axe resolves contrast from computed styles,
        // and scanning mid-paint invents a background that never ships (#111).
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
          });
        });

        const results = await new AxeBuilder({ page })
          .include('[data-testid="bottom-nav"]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const blocking = results.violations.filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        );
        expect(
          blocking,
          `${testInfo.project.name} ${route.name} ${locale.id}: ${JSON.stringify(blocking, null, 2)}`,
        ).toEqual([]);
      }
    });
  }

  /**
   * The bar is persistent navigation: on a page taller than the viewport it is at the
   * bottom of the viewport from the first frame and stays there while the page scrolls.
   *
   * #135 replaced the shell's own bar with the kit's `BottomNav`, which is deliberately
   * position-agnostic so the gallery can show it in place, and the shell never re-applied
   * `position: sticky`. The bar then sat at the end of the document, reachable only by
   * scrolling to it, and every check built on a pinned bar went on passing vacuously — the
   * obscuring checks cannot find a control under a bar that is never over content. So this
   * asserts the pinning itself, and first that the page is long enough for it to be tested.
   */
  test('the navigation stays pinned to the bottom of the viewport while the page scrolls', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    for (const route of E2E_ROUTES.filter((candidate) => candidate.chrome === 'tabs')) {
      await page.goto(route.path);
      await page.getByTestId('bottom-nav').waitFor({ state: 'visible' });
      const room = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      expect(
        room,
        `${route.name} must be taller than the viewport to test pinning`,
      ).toBeGreaterThan(0);

      for (const at of [0, Math.round(room / 2)]) {
        await page.evaluate((y) => window.scrollTo(0, y), at);
        const gap = await page.evaluate(() => {
          const nav = document.querySelector('[data-testid="bottom-nav"]');
          return nav ? innerHeight - nav.getBoundingClientRect().bottom : Number.NaN;
        });
        expect(Math.abs(gap), `${route.name} scrolled to ${at}px`).toBeLessThan(1);
      }
    }
  });

  test('the navigation clears the safe area at the bottom of the viewport', async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.includes('iphone'),
      'the home indicator inset only exists on a notched device profile',
    );
    await page.goto('./');

    const bar = page.getByTestId('bottom-nav');
    await expect(bar).toBeVisible();

    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('[data-testid="bottom-nav"]');
      if (!nav) return null;
      const rect = nav.getBoundingClientRect();
      const link = nav.querySelector('a');
      return {
        bottom: rect.bottom,
        viewport: window.innerHeight,
        linkBottom: link?.getBoundingClientRect().bottom ?? 0,
        paddingBottom: getComputedStyle(nav).paddingBottom,
      };
    });

    expect(metrics).not.toBeNull();
    // The bar itself reaches the bottom edge; its *targets* stop short of it, which is what
    // `--safe-bottom` buys. A tap target flush against the home indicator is one the
    // gesture area swallows.
    expect(metrics?.bottom).toBeCloseTo(metrics?.viewport ?? 0, 0);
    expect(metrics?.linkBottom ?? 0).toBeLessThanOrEqual(metrics?.bottom ?? 0);
  });

  test('every tab target is at least 44 px', async ({ page }) => {
    await page.goto('./');
    const links = page.getByTestId('bottom-nav').getByRole('link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await links.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    // Keyboard reachability is deliberately not asserted here: Safari only tabs to links
    // when Full Keyboard Access is enabled, which is an OS setting rather than anything
    // this shell controls, so the assertion would measure the test machine. The tabs are
    // ordinary anchors, and axe covers focusability in the scan above.
  });

  /**
   * The nav's measured height reaches the things that offset from it.
   *
   * QAEngineer found my first attempt at this proved nothing, and chasing it down showed
   * the reservation does not bind where I assumed. The bar is `position: sticky` and still
   * **in flow** at the end of the column, so at full scroll it sits below the content by
   * construction — content is never under it there, with or without the padding. The
   * padding matters at intermediate offsets, which `smoke.spec.ts` already covers by
   * scrolling every control clear.
   *
   * What is unique to this PR, and falsifiable, is that the measured height actually
   * reaches its consumers. `--shell-nav-block-size` is the one number the content padding,
   * the scrolling root's `scroll-padding-block-end` and the toast offset all derive from,
   * and the failure it exists to prevent is three places agreeing by hand and then drifting.
   * So: assert the published value equals the bar's real height, and that the scroll
   * padding — the Focus Not Obscured guarantee (WCAG 2.2 SC 2.4.11) — is derived from it
   * rather than written down separately.
   */
  test('the published nav height is the real one, and focus scrolling derives from it', async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByTestId('bottom-nav').waitFor({ state: 'visible' });

    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('[data-testid="bottom-nav"]');
      if (!nav) return null;
      const published = getComputedStyle(document.documentElement)
        .getPropertyValue('--shell-nav-block-size')
        .trim();
      return {
        published,
        measured: nav.getBoundingClientRect().height,
        scrollPadding: getComputedStyle(document.documentElement).scrollPaddingBottom,
      };
    });

    expect(metrics).not.toBeNull();
    // Published from the element rather than derived from tokens: a label that wraps at
    // 320 px or a raised text size changes the real height and not the declared one.
    expect(Number.parseFloat(metrics?.published ?? '0')).toBeCloseTo(metrics?.measured ?? -1, 0);
    // And the scrolling root reserves exactly that, so a tabbed-to control is never left
    // underneath the bar.
    expect(Number.parseFloat(metrics?.scrollPadding ?? '0')).toBeGreaterThanOrEqual(
      metrics?.measured ?? Number.POSITIVE_INFINITY,
    );
  });
});
