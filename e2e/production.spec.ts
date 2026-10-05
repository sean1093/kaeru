import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Production smoke — runs against the deployed site, never against a pull request.
 *
 * It **observes and files**. It never reverts, never redeploys and never mutates anything.
 * An automated revert turns every false positive into a real outage, and this runs against
 * a CDN we do not control, so its failure modes include propagation lag and upstream
 * incidents that a revert would make worse.
 *
 * Severity is carried by the tag on each test, and the deploy workflow reads it back out of
 * the JSON report (`scripts/check-smoke-report.mjs`):
 *
 * - `@infra` — a non-2xx, a connection failure or a timeout. Retried once, then filed `S2`.
 *   The site may be fine and the CDN may not be.
 * - `@content` — the shell does not render, a locale is missing, the worker's scope is
 *   wrong, axe reports a serious violation, a third-party request appears. Filed `S1`:
 *   these are true of the build regardless of who serves it.
 *
 * Only runs when `KAERU_SMOKE_URL` is set, and `playwright.smoke.config.ts` fails loudly
 * when it is set but unreachable rather than reporting a green run over nothing.
 */

const SMOKE_URL = process.env.KAERU_SMOKE_URL ?? '';

/** The site's own origin plus base path, e.g. `https://sean1093.github.io/kaeru/`. */
function siteBase(): URL {
  const base = new URL(SMOKE_URL);
  if (!base.pathname.endsWith('/')) base.pathname = `${base.pathname}/`;
  return base;
}

test.describe('deployed site is reachable @infra', () => {
  test('serves the app shell under its base path', async ({ request }) => {
    const response = await request.get(siteBase().toString());
    expect(response.status(), `GET ${siteBase()}`).toBe(200);
    expect(await response.text()).toContain('<div id="app">');
  });

  test('serves the web app manifest', async ({ request }) => {
    const url = new URL('manifest.webmanifest', siteBase()).toString();
    const response = await request.get(url);
    expect(response.status(), `GET ${url}`).toBe(200);
    const manifest = JSON.parse(await response.text()) as { start_url: string; scope: string };
    expect(manifest.scope).toBe(siteBase().pathname);
    expect(manifest.start_url).toBe(siteBase().pathname);
  });

  test('serves the service worker', async ({ request }) => {
    const url = new URL('sw.js', siteBase()).toString();
    const response = await request.get(url);
    expect(response.status(), `GET ${url}`).toBe(200);
    expect(await response.text()).toContain('workbox');
  });
});

test.describe('deployed build is the one we think it is @content', () => {
  test('registers a worker scoped to the site path and no wider', async ({ page }) => {
    await page.goto(siteBase().toString());
    const scope = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration.scope;
    });
    // A worker scoped to the origin root would claim every other project on github.io.
    expect(new URL(scope).pathname).toBe(siteBase().pathname);
  });

  test('renders the shell in zh-TW', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'zh-TW' });
    const page = await context.newPage();
    await page.goto(siteBase().toString());
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('日本退稅，安心帶回家');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant-TW');
    await context.close();
  });

  test('renders the shell in en', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-GB' });
    const page = await context.newPage();
    await page.goto(siteBase().toString());
    await page.getByTestId('language-en').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Bring your Japan tax refund home',
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await context.close();
  });

  test('a hash route reaches a second screen', async ({ page }) => {
    await page.goto(new URL('#/settings', siteBase()).toString());
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/#\/settings$/);
  });

  test('axe reports no serious or critical violations', async ({ page }, testInfo) => {
    await page.goto(siteBase().toString());
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );
    expect(blocking, `${testInfo.project.name}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
  });

  test('makes no third-party request', async ({ page }) => {
    const origin = siteBase().origin;
    const external: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(origin)) external.push(request.url());
    });
    await page.goto(siteBase().toString());
    await page.goto(new URL('#/settings', siteBase()).toString());
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(external).toEqual([]);
  });
});
