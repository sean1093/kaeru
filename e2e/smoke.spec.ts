import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import type { Result } from 'axe-core';
import { isChromeOverlapAtOneScrollPosition } from './a11y-filters.ts';
import { E2E_LOCALES, E2E_ROUTES } from './support/routes.ts';

const ROUTES = E2E_ROUTES.map((route) => route.path);
const LOCALES = E2E_LOCALES.map((locale) => locale.id);

/**
 * Runs in the page. Brings each interactive control into view the way a user would and
 * reports the ones still intersecting the navigation afterwards.
 */
async function scrollEveryControlClear(): Promise<string[]> {
  const bar = document.querySelector('[data-testid="bottom-nav"]');
  if (!bar) return ['no persistent navigation on this route'];
  const stuck: string[] = [];
  for (const element of document.querySelectorAll('main button, main a, main [tabindex="0"]')) {
    // `nearest`, deliberately, not `center`. Centring an element puts it in the middle of
    // the viewport, which is clear of a bottom bar by definition — so a centring test is a
    // test that `scrollIntoView` centres things, and it passes at every viewport height with
    // the bar sticky or fixed (measured: 500, 240, 160, 120 px; all green under every
    // mutation). `nearest` is how the browser scrolls for focus and for a fragment link: it
    // moves a control just past the fold by the minimum amount, which is exactly the case
    // `scroll-padding-block-end` exists to correct. The assertion then binds on the real
    // mechanism rather than on the test's own generosity.
    element.scrollIntoView({ block: 'nearest' });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const box = element.getBoundingClientRect();
    const chrome = bar.getBoundingClientRect();
    if (box.height === 0) continue;
    if (box.bottom > chrome.top && box.top < chrome.bottom) {
      stuck.push((element.textContent ?? '').trim().slice(0, 32));
    }
  }
  return stuck;
}

test.describe('app shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('loads under the /kaeru/ base path and renders the home screen', async ({ page }) => {
    await expect(page).toHaveURL(/\/kaeru\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('system-countdown')).toContainText(/2026/);
  });

  test('switching language changes the visible text and the document language', async ({
    page,
  }) => {
    await page.getByTestId('language-zh-TW').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('日本退稅，安心帶回家');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant-TW');

    await page.getByTestId('language-en').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Bring your Japan tax refund home',
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('remembers the language across a reload', async ({ page }) => {
    await page.getByTestId('language-en').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Bring your Japan tax refund home',
    );

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Bring your Japan tax refund home',
    );
  });

  test('the app bar opens settings, and the bottom navigation returns home', async ({ page }) => {
    await page.getByTestId('language-en').click();
    // Settings is an app-bar action, not a fifth tab (IA section 2).
    await page.getByTestId('app-bar-settings').click();

    await expect(page).toHaveURL(/#\/settings$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
    await expect(page.locator('[data-screen="S60"]')).toBeAttached();

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Bring your Japan tax refund home',
    );
    await expect(page.locator('[data-screen="S10"]')).toBeAttached();
  });

  test('an unknown route shows the not-found screen instead of a blank page', async ({ page }) => {
    await page.goto('./#/no-such-route');
    await expect(page.getByTestId('not-found')).toBeVisible();
  });

  /**
   * The gate for the gallery's bundle-absence claim (M1-3a #23, M1-3e #27): the dev-only
   * gallery route (`src/features/gallery/**`) registers only behind
   * `import.meta.env.DEV`, so against this production build `/dev/gallery` is simply an
   * unregistered route and renders the same not-found screen as any other one. Checking
   * this here, against the real production build the three projects above test, is the
   * difference between a claim in a PR body and an assertion CI enforces on every change.
   */
  test('the dev-only gallery route does not exist in the production build', async ({ page }) => {
    await page.goto('./#/dev/gallery');
    await expect(page.getByTestId('not-found')).toBeVisible();
  });

  test('no third-party requests are made on any route', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('http://localhost')) external.push(request.url());
    });
    await page.goto('./');
    await page.getByTestId('language-en').click();
    await page.getByTestId('app-bar-settings').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
    // Export lives on S62 now, not on the settings index: one screen owns the backup
    // surface so there is one import path rather than two.
    await page.getByTestId('open-data').click();
    await page.getByTestId('export-backup').click();
    await page.goto('./#/no-such-route');
    await expect(page.getByTestId('not-found')).toBeVisible();
    expect(external).toEqual([]);
  });

  /**
   * Wait for the page to be *scannable*, not merely loaded.
   *
   * axe computes colour contrast from resolved styles. Run it before the first paint has
   * settled and it cannot resolve an element's background, so it falls back to `#c0c0c0` — a
   * grey that is in no palette of ours — and reports a contrast violation against a colour
   * that never ships. The failure is real-looking, intermittent, and lands on the one test
   * everybody is most tempted to retry past, which is how a genuine contrast regression would
   * eventually be retried past too (#111).
   *
   * So this waits for signals the page actually emits — its own first heading, the font
   * loading promise, and two animation frames to apply and paint any font-driven relayout —
   * rather than for a duration, which would only move the race.
   */
  async function settleForScan(page: Page): Promise<void> {
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
      });
    });
  }

  test('home and settings have no serious or critical accessibility violations', async ({
    page,
  }, testInfo) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await settleForScan(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );
      const blocking: Result[] = [];
      for (const violation of serious) {
        if (!(await isChromeOverlapAtOneScrollPosition(page, violation))) {
          blocking.push(violation);
        }
      }
      expect(
        blocking,
        `${testInfo.project.name} ${route}: ${JSON.stringify(blocking, null, 2)}`,
      ).toEqual([]);
    }
  });

  /**
   * The filter above only runs when a `target-size` finding exists, which `main` does not
   * currently produce — so its first version matched nothing, passed every build and
   * protected nothing. A branch meant to be rare still needs one run where it is not.
   *
   * The two selectors below are the ones axe actually generated for the navigation links
   * when this was measured on a built preview. Neither contains the string "bottom-nav",
   * which is exactly how the first version failed; one of them is an `href` selector that
   * only appeared after `aria-current` was added, which is how a selector-text match fails
   * again later. Both must resolve to the navigation, and a control outside it must not.
   */
  test('the navigation-overlap filter resolves nodes rather than matching selector text', async ({
    page,
  }) => {
    await page.goto('./#/settings');

    const violation = (selectors: string[]): Result =>
      ({
        id: 'target-size',
        nodes: [
          {
            all: [],
            none: [],
            any: [{ relatedNodes: selectors.map((target) => ({ target: [target] })) }],
          },
        ],
      }) as unknown as Result;

    expect(
      await isChromeOverlapAtOneScrollPosition(
        page,
        // Two spellings of the same tab. Settings served as the second one until M1-5c
        // made it an app-bar action rather than a tab, so it is no longer in the navigation
        // at all — which the third assertion below now covers instead. A bare `a[href$="#/"]`
        // would not do: the brand link in the app bar has the same href and resolves first.
        violation(['a[data-testid="nav-home"]', '[data-testid="bottom-nav"] a']),
      ),
      'both selectors resolve inside the navigation, however axe chose to spell them',
    ).toBe(true);

    expect(
      await isChromeOverlapAtOneScrollPosition(page, violation(['[data-testid="language-en"]'])),
      'a control outside the navigation is a real finding and must still fail the build',
    ).toBe(false);

    expect(
      await isChromeOverlapAtOneScrollPosition(
        page,
        violation(['[data-testid="app-bar-settings"]']),
      ),
      'the app-bar settings action is not navigation chrome, so overlapping it is a real finding',
    ).toBe(false);

    expect(
      await isChromeOverlapAtOneScrollPosition(page, {
        ...violation(['a[data-testid="nav-home"]']),
        id: 'color-contrast',
      } as Result),
      'the filter is scoped to target-size and drops nothing else',
    ).toBe(false);
  });

  /**
   * TC-A11Y-017. The gate that replaces axe's obscured-target finding, and the reason
   * that finding can be set aside: it is strictly stronger. axe judges the controls that
   * happen to be visible at one scroll offset; this judges every control on the route,
   * and it still fails when a control genuinely cannot be cleared — a page too short to
   * scroll past the bar, which is the real defect.
   */
  test('every interactive control can be brought clear of the persistent navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    for (const locale of LOCALES) {
      for (const route of ROUTES) {
        await page.goto(route);
        await page.getByRole('banner').getByTestId(`language-${locale}`).click();
        const stuck = await page.evaluate(scrollEveryControlClear);
        expect(stuck, `${locale} ${route}`).toEqual([]);
      }
    }
  });

  /**
   * WCAG 2.2 SC 2.4.11, Focus Not Obscured. Scrolling a control into view is one way to
   * reach it; tabbing to it is the other, and the two scroll by different machinery —
   * `scroll-padding-block-end` is what makes the keyboard path land clear.
   */
  test('keyboard focus is never left underneath the persistent navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    for (const locale of LOCALES) {
      for (const route of ROUTES) {
        await page.goto(route);
        await page.getByRole('banner').getByTestId(`language-${locale}`).click();
        await page.evaluate(() => {
          document.body.focus();
          window.scrollTo(0, 0);
        });
        const obscured: string[] = [];
        // One pass through the document: the count is bounded by the controls present,
        // and the loop stops when focus returns to where it started.
        const total = await page.locator('a[href], button, [tabindex="0"]').count();
        for (let step = 0; step < total + 2; step += 1) {
          await page.keyboard.press('Tab');
          const hit = await page.evaluate(() => {
            const active = document.activeElement;
            const bar = document.querySelector('[data-testid="bottom-nav"]');
            if (!active || !bar || active === document.body) return null;
            if (bar.contains(active)) return null;
            const box = active.getBoundingClientRect();
            const chrome = bar.getBoundingClientRect();
            if (box.height === 0) return null;
            return box.bottom > chrome.top && box.top < chrome.bottom
              ? `${active.tagName}: ${(active.textContent ?? '').trim().slice(0, 32)}`
              : null;
          });
          if (hit) obscured.push(hit);
        }
        expect(obscured, `${locale} ${route}`).toEqual([]);
      }
    }
  });
});

test.describe('offline', () => {
  /** Installs the worker and reloads once so it controls the page (ADR 0007). */
  async function activateServiceWorker(page: Page): Promise<void> {
    await page.goto('./');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
      timeout: 15_000,
    });
  }

  test('serves the app shell and its assets from the precache while offline', async ({
    page,
    context,
  }) => {
    await activateServiceWorker(page);

    // The cache read happens with the network off, so this asserts real offline
    // availability on every engine, including WebKit where a navigation cannot complete
    // under Playwright's offline emulation.
    await context.setOffline(true);
    const cached = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) urls.push(request.url);
      }
      const shell = await caches.match('./index.html', { ignoreSearch: true });
      return { urls, shellStatus: shell?.status ?? 0 };
    });
    await context.setOffline(false);

    expect(cached.shellStatus).toBe(200);
    expect(cached.urls.some((url) => url.includes('/kaeru/assets/') && url.includes('.js'))).toBe(
      true,
    );
    expect(cached.urls.some((url) => url.includes('/kaeru/assets/') && url.includes('.css'))).toBe(
      true,
    );
  });

  test('cold-starts offline', async ({ page, context, browserName }) => {
    // Playwright's WebKit build cannot complete a navigation under offline emulation;
    // offline availability on WebKit is asserted by the cache test above, and real iOS
    // offline behaviour is covered by QA's per-milestone device pass.
    test.skip(browserName === 'webkit', 'WebKit cannot navigate with offline emulation');
    await activateServiceWorker(page);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await context.setOffline(false);
  });
});
