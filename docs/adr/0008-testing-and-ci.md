# 0008 — Testing and continuous integration

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4) and Senior QA (issue #5), agreed over the course of M0 |

## Context

The QA test strategy (`docs/qa/test-strategy.md`) scores five risks at 15 or above: wrong
refund estimate, wrong eligibility verdict, wrong deadline, IndexedDB data loss, offline
failure at the airport. Three of those are pure arithmetic and calendar logic, one is
storage, one is the service worker. The tooling has to make all five cheap to test, and the
pipeline has to be fast enough that nobody is tempted to skip it.

This ADR records the tooling agreement so that the test strategy and the repository cannot
drift apart.

## Decision

### Levels and tools

| Level | Tool | Scope |
|---|---|---|
| Unit — domain | Vitest | Pure functions: dates, money, eligibility, deadlines, formatting |
| Unit — storage | Vitest + `fake-indexeddb` | Repositories, migrations, backup import/export |
| Component | Vitest (jsdom) + `@testing-library/preact` | Rendering, states, interaction, both locales |
| End-to-end | Playwright | Journeys, offline, service-worker update, persistence, locale switch |
| Accessibility | `@axe-core/playwright` | Every E2E route; gate is zero serious or critical |

### Conventions

- Unit and component tests are `*.test.ts(x)` **next to the source**. E2E specs are
  `e2e/*.spec.ts`. The two are configured to be disjoint: Vitest `include` is
  `src/**/*.test.{ts,tsx}` and excludes `e2e/**`; Playwright `testDir` is `e2e` with
  `testMatch: **/*.spec.ts`. Vitest can never pick up a Playwright spec.
- Shared builders and fixtures live in `src/test-support/` so they share the `src` type
  graph and path aliases; nothing in the app imports them, so they are tree-shaken out.
- **No `new Date()` or `Date.now()` in `src/domain`.** Every function that needs the current
  time takes a `Clock`. This is a testability requirement, not a style preference: the
  90-day export window and the JST-versus-Taipei boundary are two of the top five risks.
- Locators prefer role and accessible name; `data-testid` (kebab-case) is the fallback for
  non-semantic containers. This keeps accessibility load-bearing — if the test cannot find
  it, a screen reader cannot either.
- No `waitForTimeout`. Wait for a state.

### Playwright projects

`iphone-webkit` (iPhone 14, WebKit), `pixel-chromium` (Pixel 7, Chromium), and
`desktop-chromium`. Default `timezoneId` is `Asia/Tokyo`, overridable per test so the
Taipei / UTC / UTC+14 matrix can be exercised.

E2E runs against the **production build** via a Playwright `webServer` that runs
`npm run build && npm run preview` on port 4173 at `/kaeru/`. The dev server is never used,
because the service worker and the base path are part of the system under test.

Artifacts: `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`,
`video: 'retain-on-failure'`. Reporters are `list` + `html` locally, plus `junit`
(`test-results/junit.xml`) and `github` in CI.

### Coverage

v8 provider, `text` + `lcov` + `html`. Thresholds, not deltas, so a PR is never blocked by
an unrelated percentage drift:

- Global: 50%.
- `src/domain/**`: **90%** lines, branches, functions and statements. The domain is pure and
  cheap to test; from M1 it is where the money logic lives.

### Scripts

`dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`, `test:watch`,
`test:coverage`, `e2e`, `e2e:ui`, `test:e2e` (alias of `e2e`), and `check` which runs
typecheck, lint, unit tests and build.

### CI

`.github/workflows/ci.yml`, on `pull_request` and on `push` to `main`, two jobs so a slow
browser matrix never hides a fast type error:

1. **verify** — checkout, `setup-node@v5` with Node 24 and npm cache, `npm ci`, typecheck,
   lint, `test:coverage`, build, upload coverage.
2. **e2e** — `npm ci`, `npx playwright install --with-deps`, `npm run e2e`, and on failure
   upload both `playwright-report/` and `test-results/`.

Concurrency is grouped per ref with `cancel-in-progress`, so pushing twice does not queue
two full matrices. Permissions are `contents: read`.

## Consequences

- A pull request cannot merge with a type error, a lint error, a failing test, a broken
  build, a failing journey or a serious accessibility violation.
- Unit tests run in about 1.5 seconds, so there is no excuse for not running them locally.
- The browser matrix is the slow part (roughly a minute). It is a separate job so its
  failures are easy to read and its artifacts easy to find.
- Flake policy (QA): a test that fails twice without a product cause is quarantined with an
  issue, never silently skipped.
- `fast-check` is approved for M1 property tests (dev dependency only); the invariants in
  the strategy — `net + tax == gross`, partition-stable aggregation, timezone-independent
  deadlines — are exactly what property testing is for.

## Alternatives considered

- **Jest.** Would need separate transform configuration for Vite's module graph and does not
  understand `import.meta.glob`, which the feature registry and the i18n catalogue rely on.
- **Cypress.** No WebKit, and iOS Safari is the primary target. Disqualifying.
- **Testing only in Chromium.** Cheaper and faster, and would miss the iOS Safari storage
  and service-worker differences that the strategy scores as high risk.
- **One CI job.** Simpler, but a two-minute browser matrix would gate the ten-second signal
  from the type checker.
- **Coverage deltas (`codecov` style).** Blocks PRs for reasons unrelated to the change.
  Thresholds are blunter and more honest.
