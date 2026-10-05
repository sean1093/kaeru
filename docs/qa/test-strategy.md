# Kaeru — Test Strategy

| | |
|---|---|
| Status | v0.1 (M0) |
| Date | 2026-10-05 |
| Owner | Senior QA |
| Tracking | Issue #5 |
| Applies to | All milestones M0–M3 |

Kaeru handles money that a traveler can permanently lose by making a procedural mistake at an airport, offline, under time pressure, in a language that may not be their own. That shapes everything below: we test the arithmetic and the deadlines hardest, we test offline as a first-class state rather than an edge case, and we treat accessibility and i18n parity as release gates, not polish.

Related: [Product brief](../product/brief.md) · [Team workflow](../process/team-workflow.md) · [Domain rules](../product/domain-rules.md) · [User journey](../product/user-journey.md) · [Test cases](./test-cases.md)

---

## 1. Quality goals

Ordered. When two goals conflict, the higher one wins.

| # | Goal | What it means concretely | How we know |
|---|---|---|---|
| G1 | **Correctness of money, thresholds, and deadlines** | A displayed refund estimate, an eligibility verdict, and a deadline date are never wrong in a way that costs the traveler the refund | Domain unit tests at every boundary; property-style tests; 90% coverage gate on `src/domain` |
| G2 | **No data loss** | A logged receipt survives reload, app update, offline use, and export/import round-trip | Storage tests with `fake-indexeddb`; E2E persistence and update scenarios; export/import round-trip property test |
| G3 | **Works offline, at the airport, on the phone the traveler actually owns** | Airport mode is fully usable with the radio off, on iOS Safari | Playwright offline projects on iPhone WebKit + Pixel Chromium |
| G4 | **Bilingual parity** | Every string exists and fits in zh-TW and en; nothing falls back silently | Locale key-parity unit test; E2E run in both locales; long-text layout checks |
| G5 | **Accessible (WCAG 2.2 AA)** | Usable with a screen reader, keyboard, 200% text, and in bright sunlight | `@axe-core/playwright` gate; manual VoiceOver/TalkBack pass per milestone |
| G6 | **Privacy by construction** | No network calls to anything but our own origin; no full passport numbers in storage or exports | E2E network assertion; storage inspection test |
| G7 | **Fast and calm** | App shell interactive quickly on a mid-range phone over a poor network | Lighthouse budget check in the production smoke |

Explicit non-goals for testing: we do not test refund operators' own websites or apps, we do not assert that an operator will actually pay, and we do not test server behavior (there is no server).

---

## 2. Risk register

Likelihood and Impact on a 1–5 scale. **Risk score = L × I.** Scores ≥ 15 are *critical* and must have automated coverage before the feature merges; 8–14 are *high* and need automated coverage before M3; ≤ 7 are covered by exploratory or manual checks.

| ID | Risk | L | I | Score | Mitigation / test response | Owner |
|---|---|---|---|---|---|---|
| R01 | **Wrong refund estimate** — wrong rate for the purchase date, wrong rounding direction, mixed 10%/8% lines treated as one blended rate, or an unknown operator fee treated as zero | 4 | 5 | **20** | Pure domain functions; the `domain-rules.md` §4 worked examples asserted verbatim; floor-rounding asserted (`DR-024`); property test `taxExcluded + tax == taxIncluded`; derived figures always labelled as estimates (`DR-022`); gross never shown as the payout (`DR-025`). TC-DOM-031…051 | QA + Engineers |
| R02 | **Wrong eligibility verdict at the ¥5,000 threshold** — off-by-one, or tax-included confused with tax-excluded | 4 | 5 | **20** | Boundary tests at ¥4,999 / ¥5,000 / ¥5,001 on the tax-excluded basis (`DR-010`, `DR-011`); same-shop same-day grouping by `(shop, day, traveler)` (`DR-012`); the tax-included ¥5,000 misconception pinned as a test. TC-DOM-011…020 | QA |
| R03 | **Wrong deadline** — the 90-day window off by a day, or shifted by the device timezone | 4 | 5 | **20** | Injected `Clock`, no `new Date()` under `src/domain`; the official vector 2026-11-01 → 2027-01-30 asserted (`DR-031`); inclusive-deadline-day cases; month-length, year-boundary and leap-day cases; Playwright `timezoneId` matrix. TC-DOM-055…066 | QA |
| R04 | **Data loss / corruption in IndexedDB** — failed schema migration, aborted transaction, quota exceeded, concurrent tabs | 3 | 5 | **15** | `fake-indexeddb` tests for every migration path including the newer-database downgrade guard; transaction-abort test; quota-exceeded simulation; E2E reload persistence; never a destructive upgrade without an export prompt. TC-DATA-001…010 | QA + Architect |
| R05 | **Offline failure at the airport** — Airport Mode needs a network call, the SW did not precache a route, or a deep link cold-starts offline. This is also where the hard gate (`UJ-024`, `UJ-026`) must hold, because checked bags cannot be retrieved (`DR-032`) | 3 | 5 | **15** | Playwright offline suite against the production build: cold start, deep link, full UJ-024→UJ-031 sequence, receipt logging, language switch, photo render, recovery online; run on `iphone-webkit` as well as Chromium. TC-AIR-001…023 | QA |
| R06 | **Stale app served by the service worker** — user keeps an old build with a wrong tax rule or a fixed bug | 3 | 5 | **15** | SW update E2E (load v1 → deploy v2 → reload → assert new build); versioned precache; visible "update available" affordance tested; rules shipped as versioned data with the build | QA + Architect |
| R07 | **iOS Safari storage eviction** — 7-day eviction of unused origins / Low Power or Private mode wiping IndexedDB | 3 | 5 | **15** | Persistent storage request tested; export reminder behavior tested; documented user guidance; manual iOS device pass each milestone (TC-DATA-0xx) | QA |
| R08 | **Failed import / corrupt export file** — hand-edited JSON, wrong version, truncated file silently wiping existing data | 3 | 5 | **15** | Import is validated and non-destructive by default; round-trip property test; malformed/old-version/empty/huge-file fixtures; "import never deletes without confirmation" assertion (TC-DATA-01x) | QA |
| R09 | **Missing or mismatched i18n strings** — key present in en but not zh-TW, raw key leaking into the UI, wrong-locale fallback | 4 | 3 | 12 | Catalog key-parity unit test (both directions, no empty values); E2E asserts no `\b[a-z]+\.[a-z]+\.[a-z]+\b` raw keys visible; both-locale E2E projects (TC-I18N-0xx) | QA |
| R10 | **Layout breaks with long English or CJK text** — truncated buttons, overflowing totals, no wrapping on long shop names | 4 | 3 | 12 | Component tests with longest-string fixtures; E2E screenshots at 320 px in both locales; CJK line-break and `word-break` checks; no fixed-height text containers | QA + UX |
| R11 | **Accessibility failures** — contrast under the Japanese-minimal palette, unlabeled icon buttons, focus lost in dialogs, 200% text scaling | 4 | 3 | 12 | axe on every E2E route (zero serious/critical); keyboard-only traversal test; focus-trap test; `text-spacing`/200% zoom checks; manual screen-reader pass (TC-A11Y-0xx) | QA + UX |
| R12 | **Timezone and date drift in the UI** — "today" differs between the device clock in Taipei and the trip in Japan; date-only values shifted by UTC conversion | 4 | 3 | 12 | Store dates as calendar dates (no UTC instants) — asserted in storage tests; Playwright `timezoneId` matrix Asia/Taipei, Asia/Tokyo, UTC, Pacific/Kiritimati (UTC+14) | QA |
| R13 | **Number formatting** — yen shown with decimals, missing grouping, locale-wrong currency placement, Intl differences across engines | 3 | 3 | 9 | Formatting unit tests pinned per locale with explicit expected strings; WebKit vs Chromium E2E assertion on one canonical total; never use floats for yen (integer minor-unit-free arithmetic) | QA |
| R14 | **PWA install / standalone quirks on iOS** — add-to-home-screen loses state, safe-area insets, no beforeinstallprompt | 3 | 3 | 9 | Manifest validated in CI; standalone-mode E2E via display-mode emulation; manual iOS install pass per milestone | QA |
| R15 | **Camera / file input on iOS Safari** — HEIC photos, large files, permission denial blocking receipt capture | 3 | 3 | 9 | File input tested with HEIC/JPEG/PNG/oversized fixtures; graceful failure path asserted; photo is never required to save a receipt | QA |
| R16 | **Multi-traveler mix-ups** — a receipt attributed to the wrong passport, totals aggregated across travelers | 2 | 4 | 8 | Domain aggregation tests per traveler; E2E two-traveler scenario | QA |
| R17 | **Privacy leak** — a third-party font/analytics request, a passport number persisted, data in URL/history | 2 | 5 | 10 | E2E asserts no cross-origin requests; storage snapshot asserts no field matching a full passport pattern; no PII in query strings | QA + Architect |
| R18 | **GitHub Pages base-path breakage** — app works locally but 404s on `/kaeru/`, SW scope wrong | 3 | 4 | 12 | Production smoke suite runs against the deployed URL after each deploy to `main`; base-path asserted in build output | QA + Architect |
| R19 | **Rules change and the shipped data is stale** — the 1% food rate for 2027-04-01 to 2029-03-31 is a cabinet decision whose bill has not passed (`UR-08`), and twelve rules are unsettled (`UR-01`…`UR-12`). Likely, but the blast radius is bounded because the values are dated data | 4 | 3 | 12 | Rules live as versioned, dated data resolved by `purchaseDate`; no rate, threshold or deadline constant appears in a conditional under `src/domain`; `@unconfirmed` tests pin behavior to the data file so a rule change is a data change. **Freshness is a scheduled check, not a PR gate:** a weekly workflow asserts the rules data `lastReviewed` date is within 180 days and opens an issue when it is not, so a stale date never turns a pull request red on a day nobody pushed | QA + Travel expert |
| R20 | **Flaky test suite erodes trust** | 3 | 3 | 9 | No arbitrary `waitForTimeout`; role-based locators; one retry in CI only; a test that fails twice without a product cause is quarantined with an issue, never silently skipped | QA |

### Top 5 by score

R01 wrong refund estimate · R02 wrong threshold verdict · R03 wrong deadline · R04 IndexedDB data loss · R05 offline failure at the airport.

These five define the non-negotiable automated coverage for M1 and M2.

---

## 3. Test levels and tools

Automation-first. Manual effort is reserved for what machines are bad at: real iOS hardware, screen readers, and visual taste.

| Level | Tool | Scope | Runs |
|---|---|---|---|
| **Unit — domain** | Vitest (node env) | Pure functions: tax extraction, eligibility, aggregation, deadlines, formatting, import/export schema | Every push, pre-commit optional |
| **Unit — storage** | Vitest + `fake-indexeddb` | Repository layer, schema migrations, transactions, quota errors | Every push |
| **Component** | Vitest (jsdom) + `@testing-library/preact` | Rendering, states (empty/loading/error), interaction, labels, both locales with longest-string fixtures | Every push |
| **Guardrail** | Vitest (node env) | Prohibition rules that have no runtime surface: forbidden network APIs, abolished vocabulary, severity ceilings, field-length limits, rules-data-to-guide drift | Every push |
| **E2E** | Playwright | User journeys, offline, service-worker update, persistence, install, locale switch | Every PR |
| **Accessibility** | `@axe-core/playwright` | Every E2E route and key dialog state | Every PR |
| **Production smoke** | Playwright against `https://sean1093.github.io/kaeru/` | Deployed build loads, base path, SW registers, manifest, one critical journey | After every deploy to `main` |
| **Manual / exploratory** | Real devices, VoiceOver, TalkBack | iOS Safari quirks, screen readers, visual review, charter-based exploration | Per milestone and before release |

### Unit test conventions

- Domain code is **pure**: no `new Date()`, no `Intl` defaults, no direct storage access. Time and locale are injected. This is a testability requirement, not a style preference — R03 and R12 depend on it.
- **Boundary cases are mandatory** for every numeric or date rule: `x−1`, `x`, `x+1` on both sides of the documented basis (tax-excluded vs tax-included matters — see `domain-rules.md`).
- **Property-style cases** using seeded pseudo-random input (`fast-check` if the Architect approves the dependency, otherwise a seeded loop helper in `src/test-support/`) for invariants such as:
  - `extractTax(price, rate)` + net == gross, for all integer prices in range;
  - export → import → export round-trips: the parsed documents are deep-equal ignoring volatile envelope fields (`exportedAt`, `appVersion`), which is the real invariant — byte equality would fail on every run;
  - aggregation of a receipt set equals the sum of its per-traveler partitions;
  - a deadline is always ≥ the purchase date and independent of the device timezone.
- **No floats for yen.** Yen is an integer. Any test that would need `toBeCloseTo` on a money value is a bug report, not a test.
- File naming: `*.test.ts` / `*.test.tsx` next to the source. Playwright specs live in `e2e/*.spec.ts` and are excluded from the Vitest `include`.

### Component test conventions

- Query by role and accessible name first (`getByRole('button', { name: … })`). `data-testid` is the fallback for non-semantic containers only. This keeps accessibility load-bearing: if the test can't find it, a screen reader can't either.
- Every component test renders in **both locales**, with a "longest realistic string" fixture per locale.
- Assert observable output, never internal state or props plumbing.

### Guardrail test conventions

Some domain rules are prohibitions rather than features. `DR-013` says the general-goods / consumables split must not exist; `DR-040`, `DR-044` and `DR-052` say the app must not talk to a network it does not own; `DR-041` caps a stored field at four characters; `DR-075` and `DR-078` say a validation finding must never block a save. There is nothing to build for any of them, so there is nothing a behavioural test can observe — and nothing stopping a later pull request from quietly violating one.

These get **guardrail tests**: a small suite that reads the source tree and the bundled content instead of running the app (`src/guardrails.test.ts`, owned by `M1-5d` / issue #59).

- This is the **one** exception to "assert observable output, never implementation". The rule above exists to stop tests pinning wording or internal structure in place of behaviour. A prohibition has no behaviour to pin: static assertion is the only mechanism available, and the thing being protected is a published contract in `domain-rules.md`, not an implementation detail. Nobody may cite the general rule to delete this suite.
- Every guardrail names the rule id it protects in its test title, so a failure explains itself to someone who has never read this document.
- A guardrail asserts a **prohibition or an equality**, never a quality judgement. "No `fetch` outside the outbound-link helper" is a guardrail. "The code is clean" is not.
- **No wall-clock assertions.** A guardrail that fails because a CI runner was busy is a flaky test, and under R20 a flaky test gets quarantined — which is exactly what must not happen to a guardrail. Keep the suite fast; do not assert that it is fast.
- Where a guardrail needs exceptions, they live in an **explicit, documented allowlist** in the test file. Adding to the allowlist must be a visible diff that a reviewer can argue with. A guardrail with an implicit escape hatch protects nothing.

### E2E conventions

- **Projects:** `iphone-webkit` (iPhone 14, WebKit), `pixel-chromium` (Pixel 7, Chromium), `desktop-chromium`. Locale is a parameter; critical journeys run in both `zh-TW` and `en`.
- E2E runs against the **production build** (`npm run build` + `npm run preview`), never the dev server — the service worker is part of the system under test. **One carve-out, and only one:** the development-only UI kit gallery (`M1-3e`, issue #27) is gated behind `import.meta.env.DEV` and is absent from the production bundle by design, so it cannot be reached from a preview server at all. Its project (`gallery-dev`, `testMatch` scoped to `e2e/gallery/**`, excluded from the three production projects) runs against `npm run dev` on its own port. What that project may be used for is narrow: component conformance and the capture matrix. It is **not evidence for any accessibility claim about a real screen** — axe on the production routes in the three real projects remains the only gate that counts — and it asserts nothing about offline, the service worker or caching, because `devOptions.enabled` is false and there is no worker to test. Any *other* dev-server project needs a reason as good as "the thing under test does not exist in the production bundle", and that reason goes in the pull request. Nobody may cite this carve-out to move a real screen's tests off the production build.
- **Offline:** the worker is registered with `registerType: 'prompt'` and `clientsClaim: false` (ADR 0007), so **the first page load is deliberately uncontrolled**. Every offline test must therefore let the worker install, reload once so the page is controlled, and only then `await context.setOffline(true)`. Going offline on the first load tests nothing and will fail for the wrong reason. We cover: cold start offline, deep link offline, data entry offline, the full airport sequence offline, and recovery when the network returns.
- **Service-worker update:** load build A, swap the served build to B, reload, assert the new asset hash, that the update prompt appeared, and that stored data survived.
- Default `timezoneId: 'Asia/Tokyo'`; a dedicated project/test group overrides it to `Asia/Taipei`, `UTC`, and `Pacific/Kiritimati`.
- No `waitForTimeout`. Wait for a state, not for a duration.
- **Artifacts:** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`. CI uploads `playwright-report/` and `test-results/`. Reporters: `list` + `html` locally; `junit` + `github` added in CI.
- **Screenshots on PRs:** every UI-affecting PR attaches screenshots in **both** zh-TW and en at a 390 px-wide viewport. Playwright writes them to `test-results/screenshots/`; the author drags them into the PR body.

### Accessibility conventions

- `@axe-core/playwright` on every route and on open dialogs/sheets. **Gate: zero `serious` or `critical` violations.** `moderate`/`minor` are filed as issues with a deadline, not merged away by suppression.
- Suppressions require a comment with a reason and a linked issue. A naked `.disableRules()` fails review.
- **Obscured-target findings are measured where the user can be.** A sticky bottom navigation covers whatever is beneath it at a given scroll offset — that is what sticky positioning is for, and what every mobile tab bar does. An axe scan evaluates at one scroll position, so it reports a true statement (*this target is obscured at scroll 0*) about a state the user is never stuck in. The property WCAG 2.5.8 protects is **operability**, so that is what we assert: `TC-A11Y-017` scrolls **every** interactive control on every route into view and requires it to land completely clear of the persistent chrome. That is strictly stronger than the axe scan it replaces for this one rule — it checks every control rather than only those visible at one offset — and it still fails the build, on the real 390 px viewport, when a control genuinely cannot be cleared.
- **What that is not.** It is not a suppression: no rule is disabled and no selector is scoped out. It is also not "scan at a taller viewport" — inflating the viewport until a finding disappears is a suppression wearing a costume, and it would leave the scan structurally blind to every scroll-dependent problem on the only viewport the product ships to. Nor is it "scan after scrolling to the bottom", which is as arbitrary a single position as scroll 0. Same reasoning as the offline rule above: a test run in a state the user cannot reach tests nothing and fails for the wrong reason.
- Automated checks catch roughly a third of real barriers. The manual pass per milestone covers: VoiceOver on iOS (reading order, button names, live-region announcements for totals), keyboard-only traversal, 200% text / 320 px reflow, focus visibility, and target size ≥ 24 px (WCAG 2.2 AA, 2.5.8).

---

## 4. Test data strategy

- **Builders over fixtures.** `src/test-support/builders.ts` exposes `aReceipt()`, `aTrip()`, `aTraveler()` with sensible defaults and fluent overrides (`aReceipt().inShop('BIC Camera').yen(5000).reducedRate()`). Tests state only the fields they care about, so adding a field does not break 200 tests. Support code lives under `src/` so it shares one TypeScript type graph with the code it builds.
- **Named scenario fixtures** for the recurring shapes, built from the builders: `emptyTrip`, `singleEligibleReceipt`, `thresholdEdgeTrip` (¥4,999 / ¥5,000 / ¥5,001), `mixedRateReceipt` (8% + 10% on one receipt), `oldSystemTrip` (purchases on 2026-10-31), `expiringTomorrowTrip`, `expiredTrip`.
- **Persona fixtures** mirroring `user-journey.md`, because they are the shapes that actually break things: `linFamilyTrip` (P1 — 14 receipts, 3-4 operators, 2 travelers, mixed rates, Narita, checked-bag goods, one consumed-item receipt) and `alexTrip` (P2 — 5 receipts, one ¥1,280,000 tax-excluded watch triggering `DR-016`, Kansai, 07:45 departure).
- **Golden files** (`src/test-support/fixtures/`) only where the format is the contract: export v1 JSON, a corrupted export, a previous-schema export, an oversized photo, a HEIC photo, a 300-receipt trip for performance.
- **Longest-string fixtures** per locale for layout risk (R10): the longest real shop name, a 40-character traveler name, a 7-figure total.
- **Deterministic by construction:** fixed seed for property tests, injected clock pinned to `2026-11-15T10:00:00+09:00` as the canonical "now", no network, no real device locale. A test that reads the machine clock, the machine timezone, or the machine locale is defective.
- **No real personal data, ever** — no real passport numbers, no real receipts with identifying content. Sample images are synthetic.

---

## 5. Environments

| Environment | What it is | Suites that run | Gate |
|---|---|---|---|
| **Local** | Developer machine, `npm run dev` / `npm run preview` | Unit, component, E2E (`desktop-chromium` minimum before pushing) | Advisory |
| **CI — pull request** | GitHub Actions, Node 24, `npm ci` | typecheck, lint, unit + coverage, build, full E2E matrix, axe | **Blocking** — merge requires green |
| **CI — main** | Same plus deploy | Everything above, then build + `actions/deploy-pages` | **Blocking** — a red main is fixed or reverted immediately |
| **Production smoke** | `https://sean1093.github.io/kaeru/` after deploy | Smoke project: loads under the `/kaeru/` base path, SW registers, manifest valid, one critical journey in each locale, axe on the home route | **Blocking for release sign-off**; failure opens an S1 |
| **Real devices (manual)** | iPhone (Safari, current iOS), Android (Chrome), one low-end device | iOS quirks charter, screen readers, install, camera, offline with the radio actually off | **Blocking for M3** |

Minimum device/browser support matrix: iOS Safari (latest and latest−1), Android Chrome (latest), desktop Chrome/Edge, desktop Safari, desktop Firefox (best effort — not an E2E project, covered by exploratory checks).

---

## 6. Entry and exit criteria

**Entry criteria (any milestone):** scope is written in issues with acceptance criteria; the relevant domain rules or design are merged; the test strategy covers the new risk (or is amended first).

| Milestone | Exit criteria |
|---|---|
| **M0 — Discovery & Design** | Research, UX, architecture, and this strategy merged. Risk register reviewed by the team. Tooling agreed with the Architect (#4). Issue and PR templates live. Initial test cases drafted and traced to requirement IDs. |
| **M1 — Foundation** | Domain rules implemented as pure functions with **≥ 90% line and branch coverage on `src/domain`**, every boundary in `domain-rules.md` covered by a test, storage migrations tested with `fake-indexeddb`, i18n key-parity test green, CI running all levels, E2E skeleton green on all three projects, axe green on the app shell. Zero open S1/S2. |
| **M2 — MVP Features** | Every MVP journey has an E2E test in both locales; offline suite green (cold start, deep link, airport checklist, recovery); SW update test green; export/import round-trip green; axe zero serious/critical on every route; screenshots in both locales attached to every UI PR. Zero open S1/S2; S3 count agreed with the PM. |
| **M3 — Launch** | Full release checklist (§10) passed on the live site; manual iOS + Android device pass done; manual screen-reader pass done; production smoke green; QA sign-off comment on the release issue. Zero open S1/S2, no unresolved S3 in a critical journey. |

**Stop-the-line rule:** any defect that can cause a traveler to lose a refund (wrong amount, wrong eligibility, wrong deadline, lost data, airport mode unusable offline) is S1 by definition and blocks the next merge to `main` until fixed or reverted.

---

## 7. Definition of Done — QA additions

Extends the DoD in [team-workflow.md](../process/team-workflow.md). A PR is done when, in addition:

- [ ] Tests added or updated at the right level (domain logic → unit; UI state → component; journey → E2E). A bug fix includes a test that fails without the fix.
- [ ] New or changed numeric/date rules have boundary tests on both sides of the boundary.
- [ ] CI is green, including the full E2E matrix and axe; no new flaky test introduced.
- [ ] Coverage gate holds (`src/domain` ≥ 90% lines/branches from M1).
- [ ] UI changes include screenshots in **zh-TW and en** at a phone viewport.
- [ ] Both locales verified; no missing keys, no raw keys visible, no truncation or overflow.
- [ ] Accessibility checked: keyboard reachable, visible focus, accessible names on controls, axe clean.
- [ ] Offline behavior considered and stated in the PR ("not applicable" is an acceptable answer, silence is not).
- [ ] No console errors or unhandled rejections in the happy path.
- [ ] No new third-party network request; no new persisted personal data field.
- [ ] Docs updated when behavior, rules, or architecture changed.
- [ ] Reviewed by another role; QA verified for feature PRs.

---

## 8. Bug workflow

1. **Report** using the bug issue template. A report without steps, expected/actual, and environment (device, browser, language, online/offline) is sent back.
2. **Triage** (QA + PM) within one working day: assign `severity:`, `role:`, `priority:`, and a milestone. Remove `needs: triage`.
3. **Fix** on a `fix/…` branch with a regression test that fails before the fix.
4. **Verify** — QA reproduces the original steps on the merged build and comments the result. Only QA closes a bug.
5. **Regression** — if a fixed bug returns, it is reopened with the `regression` label and the missing test is treated as the real defect.

### Severity

| Severity | Definition | Examples | Response |
|---|---|---|---|
| **S1 — Blocker** | Traveler loses money or data, or a critical flow is unusable | Wrong refund total, wrong deadline, receipts disappear, airport mode fails offline, app does not load on the live site | Stop the line. Fix or revert before the next merge. |
| **S2 — Major** | Core flow broken with no reasonable workaround | Cannot save a receipt on iOS, locale switch crashes, import silently drops data, serious axe violation on a main route | Fix within the current milestone; blocks release. |
| **S3 — Minor** | Works, but with a workaround or visible defect | Text truncation at 320 px, a missing translation in a rarely-seen state, a moderate axe violation | Scheduled; may ship if the PM agrees. |
| **S4 — Cosmetic** | Trivial | Spacing, a wording nit, a non-blocking console warning | Backlog. |

Severity is set by QA and describes impact. Priority is set by the PM and describes order of work. They are allowed to disagree.

Labels in use: `bug`, `regression`, `needs: triage`, `severity: S1`–`severity: S4`, plus the standard `role:`, `type:`, `priority:` sets.

---

## 9. Traceability

Requirements carry stable IDs; tests cite them. Nothing is tested because it is easy, and nothing is forgotten because nobody owned it.

| Source | ID format | Example |
|---|---|---|
| `docs/product/domain-rules.md` — rules | `DR-0nn` | `DR-010` the ¥5,000 tax-excluded threshold |
| `docs/product/domain-rules.md` §9 — uncertainties | `UR-nn` | `UR-08` the 1% food rate from 2027-04-01 |
| `docs/product/user-journey.md` | `UJ-0nn` | `UJ-026` do customs before check-in |
| `docs/research/traveler-pain-points.md` | `PP-nn` | `PP-01` goods checked in before customs |
| `docs/qa/test-cases.md` | `TC-<AREA>-nnn` | `TC-DOM-011` |

Areas: `DOM` domain rules and arithmetic · `AIR` airport and offline · `DATA` storage, export/import, migration · `I18N` localization and parity · `A11Y` accessibility · `PWA` install, service worker, update · `UX` flows and layout · `SEC` privacy.

Rules:

- Every test case in `test-cases.md` names the requirement ID(s) it covers.
- Every automated test's title starts with its `TC-` ID, so a CI failure maps straight back to a requirement.
- Coverage of requirements is reviewed at each milestone exit: a requirement with no test is either tested or explicitly accepted as untested by the PM, in writing. Every `DR-`, `UR-` and `UJ-` ID in the v1.0 documents is currently cited by at least one case.
- A rule whose status in `domain-rules.md` is not `confirmed-official` (`pending-legislation`, `reported-media`, `unconfirmed`, or any `UR-nn` entry) gets a test tagged `@unconfirmed`. It runs but does not block a merge, and it must assert behavior driven by **rules data** rather than a hard-coded constant, so that settling the uncertainty changes data and not code. The tag is removed when the source is confirmed.

---

## 10. Release checklist

Run before every release to `main` that users will see. Matrix: **2 languages × 3 device classes × online/offline**.

**Build and deploy**
- [ ] CI green on `main`: typecheck, lint, unit + coverage gates, build, full E2E matrix, axe.
- [ ] Deployed to GitHub Pages; the production smoke suite is green against `https://sean1093.github.io/kaeru/`.
- [ ] Asset hashes changed; a previously-installed client receives the update after one reload.

**Per language (zh-TW, en)**
- [ ] No raw i18n keys, no missing strings, no English leaking into zh-TW (or the reverse).
- [ ] Taiwanese terminology correct (退稅, 收據, 護照, 託運, 海關, 手續費).
- [ ] No truncation or overflow at 320 px and at 200% text size.
- [ ] Dates, currency, and numbers formatted correctly for the locale.

**Per device class (iPhone Safari, Android Chrome, desktop)**
- [ ] Core journey: create trip → log receipt → see pending refund → airport checklist → mark refunded.
- [ ] Install to home screen works; standalone launch keeps the data; safe areas respected.
- [ ] Photo/file input works, including HEIC on iOS, and failure is graceful.

**Offline**
- [ ] Airplane mode: cold start, airport checklist, logging a receipt, switching language — all work.
- [ ] Reconnecting does not duplicate or lose data.

**Accessibility**
- [ ] axe: zero serious/critical on every route.
- [ ] VoiceOver pass on the critical journey; TalkBack spot check.
- [ ] Keyboard-only traversal; visible focus everywhere; target size ≥ 24 px.
- [ ] Contrast verified against the final palette, including disabled and error states.

**Data and privacy**
- [ ] Export → fresh profile → import restores everything exactly.
- [ ] Upgrading from the previous released version keeps existing data (migration run on a real previous-version profile).
- [ ] Network panel shows no third-party requests; storage contains no full passport number.

**Content**
- [ ] Tax rules data `lastReviewed` date is current (the weekly freshness check has no open issue) and sources resolve.
- [ ] Guide content matches `docs/research/` and the live rules.

Sign-off: QA comments the completed checklist on the release issue. No sign-off, no release.
