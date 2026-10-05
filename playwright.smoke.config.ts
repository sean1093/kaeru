import { defineConfig, devices } from '@playwright/test';

/**
 * The production smoke, kept in its own config so a pull request run can never pick it up
 * and is never slowed by it. `playwright.config.ts` ignores `production.spec.ts` for the
 * same reason from the other side.
 *
 * There is no `webServer`: the target is a site somebody already deployed, not one this
 * process builds. `globalSetup` refuses to start when `KAERU_SMOKE_URL` is missing or
 * unreachable, so a misconfigured job fails loudly instead of passing over nothing.
 */
const SMOKE_URL = process.env.KAERU_SMOKE_URL ?? '';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/production.spec.ts',
  globalSetup: './e2e/support/smoke-setup.ts',
  fullyParallel: true,
  forbidOnly: true,
  // An infrastructure failure is retried once before it is believed: a CDN that is briefly
  // unreachable is not a reason to file an issue, a CDN that is unreachable twice is.
  retries: 1,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/smoke.json' }], ['github']],
  use: {
    baseURL: SMOKE_URL,
    timezoneId: 'Asia/Tokyo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // The smoke only ever reads. Nothing here writes to the site.
    extraHTTPHeaders: { 'Cache-Control': 'no-cache' },
  },
  projects: [{ name: 'production-chromium', use: { ...devices['Desktop Chrome'] } }],
});
