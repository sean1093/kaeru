import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { type DeployServer, deriveNextBuild, startDeployServer } from './support/deploy-server.ts';

/**
 * Service-worker update, tested rather than assumed (`TC-AIR-020`, `TC-AIR-021`, risk R06).
 *
 * `UpdatePrompt` has shipped since M0 and nothing exercised it. This is the path a corrected
 * tax rule travels to a phone, and the path a wrong one persists on, so "it probably works"
 * is not good enough for the one mechanism that can fix a bad rule after launch.
 *
 * Two builds are served from one origin by a server that can be switched between them,
 * which is what a deploy looks like to a browser. `vite preview` cannot do that.
 */

const BUILD_A = 'dist';
let server: DeployServer;
let buildB: string;
let workspace: string;

test.beforeAll(() => {
  workspace = mkdtempSync(join(tmpdir(), 'kaeru-deploy-'));
  buildB = join(workspace, 'build-b');
  deriveNextBuild(BUILD_A, buildB, 'B');
});

test.afterAll(() => {
  // The server is per-test and `afterEach` owns closing it; closing it twice throws.
  rmSync(workspace, { recursive: true, force: true });
});

test.beforeEach(async () => {
  server = await startDeployServer(BUILD_A);
});

test.afterEach(async () => {
  await server.close();
});

/** Installs the worker and reloads once so it controls the page (ADR 0007). */
async function activate(page: Page, origin: string): Promise<void> {
  await page.goto(`${origin}/kaeru/`);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 15_000,
  });
}

/** Writes something only a surviving database would still have. */
async function storeLanguage(page: Page): Promise<void> {
  await page.getByTestId('language-en').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Bring your Japan tax refund home',
  );
}

test.describe('service worker update', () => {
  // Chromium only: this drives worker lifecycle through CDP-backed APIs that Playwright's
  // WebKit build does not expose. Real iOS update behaviour is covered by QA's device pass.
  test.skip(({ browserName }) => browserName !== 'chromium', 'worker lifecycle needs Chromium');

  test('TC-AIR-020: a new build reaches the device and stored data survives', async ({ page }) => {
    await activate(page, server.origin);
    await storeLanguage(page);

    // The deploy.
    server.serve(buildB);

    // The browser only notices a new worker when it checks for one.
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });
    await page.waitForFunction(
      () => navigator.serviceWorker.getRegistration().then((r) => r?.waiting != null),
      undefined,
      { timeout: 15_000 },
    );

    // Accept the way a traveler does, through the affordance itself. This is the whole
    // point: `applyUpdate` calls vite-plugin-pwa's `updateServiceWorker(true)`, which posts
    // SKIP_WAITING *and* registers the `controllerchange` listener that reloads once the
    // new worker takes control. Posting SKIP_WAITING by hand skips that listener, so the
    // page never reloads and sits on the old document forever — a true observation about a
    // path no user takes, and what #102 measured before this was understood.
    await expect(page.getByTestId('update-prompt')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('update-apply').click();

    // The promise the button makes: the page the traveler is looking at is now the new
    // build. Nothing weaker is worth showing them a button for.
    await expect(page.locator('#app')).toHaveAttribute('data-build', 'B', { timeout: 20_000 });

    // And the device holds it, so the next cold start gets it too — the half that matters
    // when the correction is a tax rule and the phone is in airplane mode tomorrow.
    await page.waitForFunction(
      async () => {
        const cached = await caches.match('index.html', { ignoreSearch: true });
        return cached ? (await cached.text()).includes('data-build="B"') : false;
      },
      undefined,
      { timeout: 15_000 },
    );

    // Stored data surviving the update is asserted on a fresh client, because that is the
    // half that loses a traveler's receipts if it breaks.
    const fresh = await page.context().newPage();
    await fresh.goto(`${server.origin}/kaeru/`);
    await expect(fresh.getByRole('heading', { level: 1 })).toHaveText(
      'Bring your Japan tax refund home',
    );
    await fresh.close();
  });

  test('accepting also reloads every other open client, which ADR 0007 used to deny', async ({
    page,
  }) => {
    // Measured rather than assumed, and it contradicts what the ADR originally promised:
    // `skipWaiting()` makes the new worker claim every client of the registration, and each
    // one reloads on `controllerchange`. Consent is per user, not per tab. An installed PWA
    // is a single client so no traveler meets this, but the guarantee was overstated and
    // this is what keeps the ADR honest.
    await activate(page, server.origin);

    const bystander = await page.context().newPage();
    await bystander.goto(`${server.origin}/kaeru/`);
    await bystander.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
      timeout: 15_000,
    });
    // A mark that only survives if this document is never replaced.
    await bystander.evaluate(() => {
      document.body.dataset.kaeruProbe = 'alive';
    });

    server.serve(buildB);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });
    await expect(page.getByTestId('update-prompt')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('update-apply').click();

    await expect(bystander.locator('#app')).toHaveAttribute('data-build', 'B', {
      timeout: 20_000,
    });
    await expect(bystander.locator('body')).not.toHaveAttribute('data-kaeru-probe', 'alive');
    await bystander.close();
  });

  test('TC-AIR-021: the update prompt appears, and declining leaves the session working', async ({
    page,
  }) => {
    await activate(page, server.origin);
    await storeLanguage(page);

    server.serve(buildB);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });

    // The affordance, not the lifecycle: this is what the traveller actually sees.
    const prompt = page.getByTestId('update-prompt');
    await expect(prompt).toBeVisible({ timeout: 20_000 });
    await expect(prompt).toContainText('A new version is available.');

    // Declining mid-task is the whole point of ADR 0007: a traveller at a kiosk decides when
    // to reload, and the running build keeps working until they do.
    await prompt.getByRole('button', { name: 'Later' }).click();
    await expect(prompt).toBeHidden();

    await expect(page.locator('#app')).not.toHaveAttribute('data-build', 'B');
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');

    // And the update is still there to accept later — declining postpones, never cancels.
    const stillWaiting = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.waiting != null;
    });
    expect(stillWaiting).toBe(true);
  });
});
