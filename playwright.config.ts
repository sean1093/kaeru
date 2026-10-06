import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/kaeru/`;

/**
 * The UI kit gallery (`src/features/gallery/**`) only registers in a development build
 * (`import.meta.env.DEV`) and is absent from the production bundle by construction — see
 * `src/features/gallery/index.ts` and the bundle-absence test in M1-3e (#27). A preview
 * server serving the production build therefore 404s on it; the gallery can only be
 * reached from `npm run dev`.
 */
const GALLERY_PORT = 5174;
const GALLERY_BASE_URL = `http://localhost:${GALLERY_PORT}/kaeru/`;

/** Never run on a pull request: the production smoke needs a deployed target. */
const IGNORED = ['**/production.spec.ts'];

/**
 * Which device projects this run exercises, and whether the gallery runs at all.
 *
 * Unset means everything, so a local `npm run e2e` behaves exactly as it always has —
 * only CI narrows, and only CI needs to. See `.github/workflows/ci.yml` for which runs
 * narrow and why; the short version is that **a pull request's green check is evidence
 * about one project**, deliberately, and `main` runs the full matrix before the deploy
 * gate so the guarantee moves rather than disappears.
 */
const SELECTED = process.env.KAERU_E2E_PROJECT ?? 'all';
const FULL_MATRIX = SELECTED === 'all';

/**
 * The gallery is a development harness whose code is `import.meta.env.DEV`-gated and
 * absent from the production bundle (#27 makes that a CI gate). On a pull request that
 * touches neither `src/ui/**` nor `src/features/gallery/**` the code under test cannot
 * have changed and cannot ship, so the run proves nothing and its dev server is started
 * for nobody (QALead, #130).
 */
const RUN_GALLERY = process.env.KAERU_E2E_GALLERY !== 'false';

/**
 * `true` when the caller has already built `dist/`.
 *
 * CI builds once in the `verify` job and hands the artifact to this one, because building
 * the same commit once per project is duplicated work rather than coverage — the first
 * throughput fix to try, since it deletes effort instead of evidence.
 */
const PREBUILT = process.env.KAERU_E2E_PREBUILT === 'true';

export default defineConfig({
  // Disjoint from Vitest: Playwright owns e2e/**, Vitest owns src/**.
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  // The production smoke has its own config and its own target; a pull request must never
  // run it and must never be slowed by it.
  //
  // Repeated on every project below, and that is not redundancy: a project's `testIgnore`
  // **replaces** this one rather than adding to it, so the moment any project declared its
  // own (for the gallery carve-out) this line stopped applying to it and the smoke started
  // running on pull requests with no target URL. Anything added here must be added there.
  testIgnore: IGNORED,
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
      testIgnore: [...IGNORED, '**/gallery/**'],
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'pixel-chromium',
      testIgnore: [...IGNORED, '**/gallery/**'],
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-chromium',
      testIgnore: [...IGNORED, '**/gallery/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      /**
       * Carve-out from `test-strategy.md` section 3 ("E2E runs against the production
       * build … never the dev server"), recorded there and here together (#71): the
       * gallery does not exist in a production build, so there is no preview server to
       * test it against. This project is for component conformance and the M1-3e
       * capture matrix ONLY.
       *
       * It is NOT evidence for any accessibility claim about a real screen — axe on the
       * three production projects above is the gate that counts. It asserts nothing
       * about offline, the service worker or caching: `devOptions.enabled` is `false` in
       * `vite.config.ts`, so there is no worker here to test. Any other dev-server
       * project needs a reason this specific ("the thing under test does not exist in
       * the production bundle"), stated in its own pull request.
       *
       * Scoped twice, belt and braces: `testDir`/`testMatch` here, `testIgnore` on the
       * three production projects above, so a future `testMatch` widening up there does
       * not silently pull `e2e/gallery/**` into a preview-server run, where it 404s.
       */
      name: 'gallery-dev',
      testDir: 'e2e/gallery',
      testMatch: '**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: GALLERY_BASE_URL },
    },
  ].filter((project) =>
    project.name === 'gallery-dev' ? RUN_GALLERY : FULL_MATRIX || project.name === SELECTED,
  ),
  // Two servers: production for the three real projects, dev for the gallery only.
  webServer: [
    {
      // `PREBUILT` skips the build, never the preview: the suite must always serve a real
      // production build with a real service worker (ADR 0007), and the only question here
      // is whether this process is the one that produced it.
      command: PREBUILT
        ? `npm run preview -- --port ${PORT} --strictPort`
        : `npm run build && npm run preview -- --port ${PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
    // Started only when the gallery project is running. A dev server nobody connects to is
    // a minute of every run spent on nothing.
    ...(RUN_GALLERY
      ? [
          {
            command: `npm run dev -- --port ${GALLERY_PORT} --strictPort`,
            url: GALLERY_BASE_URL,
            reuseExistingServer: !CI,
            timeout: 60_000,
          },
        ]
      : []),
  ],
});
