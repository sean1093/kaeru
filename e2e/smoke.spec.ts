import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const ROUTES = ['./', './#/settings'] as const;
const LOCALES = ['zh-TW', 'en'] as const;

/**
 * axe evaluates a page at whatever scroll offset it finds it in, so a persistent bottom
 * bar makes `target-size` report every control beneath it as obscured. That report is
 * true about the moment it was taken and says nothing about whether the control is
 * operable, which is what SC 2.5.8 is about.
 *
 * This filter exists only because something stronger replaces it. TC-A11Y-017 — the test
 * `every interactive control can be brought clear of the persistent navigation` below,
 * specified in docs/qa/test-cases.md and reasoned through in PR #91 — asserts operability
 * over every control on the route rather than the ones visible at one offset, and it still
 * fails the build when a control genuinely cannot be cleared. Delete that test and this
 * filter loses its justification; they are meant to fail together.
 *
 * Deliberately narrow: only `target-size`, and only when every node blamed for the
 * obstruction is the navigation itself. Anything else covering a control is a real
 * finding and still fails the build.
 */
function isChromeOverlapAtOneScrollPosition(violation: {
  id: string;
  nodes: readonly unknown[];
}): boolean {
  if (violation.id !== 'target-size') return false;
  const blamed = (violation.nodes as { relatedNodes?: { target?: string[] }[] }[]).flatMap(
    (node) => node.relatedNodes ?? [],
  );
  return (
    blamed.length > 0 &&
    blamed.every((node) => (node.target ?? []).some((selector) => selector.includes('bottom-nav')))
  );
}

/**
 * Runs in the page. Brings each interactive control into view the way a user would and
 * reports the ones still intersecting the navigation afterwards.
 */
async function scrollEveryControlClear(): Promise<string[]> {
  const bar = document.querySelector('[data-testid="bottom-nav"]');
  if (!bar) return ['no persistent navigation on this route'];
  const stuck: string[] = [];
  for (const element of document.querySelectorAll('main button, main a, main [tabindex="0"]')) {
    element.scrollIntoView({ block: 'center' });
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

  test('bottom navigation moves between registered features', async ({ page }) => {
    await page.getByTestId('language-en').click();
    await page.getByRole('link', { name: 'Settings' }).click();

    await expect(page).toHaveURL(/#\/settings$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
    await expect(page.getByTestId('nav-settings')).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Bring your Japan tax refund home',
    );
  });

  test('an unknown route shows the not-found screen instead of a blank page', async ({ page }) => {
    await page.goto('./#/no-such-route');
    await expect(page.getByTestId('not-found')).toBeVisible();
  });

  test('no third-party requests are made on any route', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('http://localhost')) external.push(request.url());
    });
    await page.goto('./');
    await page.getByTestId('language-en').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
    await page.getByTestId('export-backup').click();
    await page.goto('./#/no-such-route');
    await expect(page.getByTestId('not-found')).toBeVisible();
    expect(external).toEqual([]);
  });

  test('home and settings have no serious or critical accessibility violations', async ({
    page,
  }, testInfo) => {
    for (const route of ROUTES) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations
        .filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
        .filter((violation) => !isChromeOverlapAtOneScrollPosition(violation));
      expect(
        blocking,
        `${testInfo.project.name} ${route}: ${JSON.stringify(blocking, null, 2)}`,
      ).toEqual([]);
    }
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

  /**
   * TC-A11Y-016, as narrowed by the measurement behind this suite's methodology. The nav
   * does paint over in-flow content mid-scroll — that is what sticky positioning is for —
   * so the claim worth testing is about the end of the scroll: the content column
   * reserves the bar's space rather than ending flush beneath it.
   */
  test('the content column reserves the navigation space at the end of the scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    await page.goto('./#/settings');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const gap = await page.evaluate(() => {
      const last = [...document.querySelectorAll('main button, main a')].at(-1);
      const bar = document.querySelector('[data-testid="bottom-nav"]');
      if (!last || !bar) return Number.NaN;
      return bar.getBoundingClientRect().top - last.getBoundingClientRect().bottom;
    });
    expect(gap).toBeGreaterThan(0);
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
