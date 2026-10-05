import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

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
    for (const route of ['./', './#/settings']) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );
      expect(
        blocking,
        `${testInfo.project.name} ${route}: ${JSON.stringify(blocking, null, 2)}`,
      ).toEqual([]);
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
