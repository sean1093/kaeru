import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/kaeru/`;

export default defineConfig({
  // Disjoint from Vitest: Playwright owns e2e/**, Vitest owns src/**.
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  ...(CI ? { workers: 1 } : {}),
  reporter: CI
    ? [
        ['list'],
        ['github'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    // Deterministic default; individual tests may override locale/timezoneId.
    timezoneId: 'Asia/Tokyo',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'iphone-webkit',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'pixel-chromium',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Test the production build so the service worker and base path are real.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
