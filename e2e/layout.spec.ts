import { expect, test } from '@playwright/test';
import { E2E_LOCALES, E2E_ROUTES } from './support/routes.ts';

/**
 * Reflow at the narrowest viewport we support (WCAG 2.2 SC 1.4.10).
 *
 * 320 px is the floor the design sets, and nothing may require horizontal scrolling there.
 * This lives in its own spec rather than in the smoke because it is a property of every
 * screen rather than of one journey: each new route should join the list below.
 */

const NARROW = { width: 320, height: 640 };

const ROUTES = E2E_ROUTES;
const LOCALES = E2E_LOCALES;

test.describe('320 px reflow', () => {
  test.use({ viewport: NARROW });

  for (const route of ROUTES) {
    for (const locale of LOCALES) {
      test(`${route.name} does not scroll horizontally in ${locale.id}`, async ({ page }) => {
        await page.goto(route.path);
        // Settings renders its own language control, so scope to the app bar's.
        await page.getByRole('banner').getByTestId(locale.testId).click();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          const widest = [...document.querySelectorAll<HTMLElement>('body *')]
            .map((element) => ({
              selector: `${element.tagName.toLowerCase()}.${element.className}`,
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            }))
            .filter((entry) => entry.scrollWidth > entry.clientWidth && entry.clientWidth > 0);
          return {
            documentScrollWidth: root.scrollWidth,
            documentClientWidth: root.clientWidth,
            widest,
          };
        });

        expect(
          overflow.documentScrollWidth,
          `the page scrolls horizontally at ${NARROW.width} px: ${JSON.stringify(overflow.widest, null, 2)}`,
        ).toBeLessThanOrEqual(overflow.documentClientWidth);
      });
    }
  }
});
