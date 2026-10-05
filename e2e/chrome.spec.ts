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

    // `position: sticky` holds an element within its flow position; it does not pull one
    // that sits below the fold up into view. So scroll to where the bar is actually pinned
    // before measuring, which is also where a user meets it.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => {
      const nav = document.querySelector('[data-testid="bottom-nav"]');
      return nav ? Math.abs(nav.getBoundingClientRect().bottom - window.innerHeight) < 2 : false;
    });

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
});
