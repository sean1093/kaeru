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
| G5 | **Accessible (WCAG 2.2 AA)** | Usable with a screen reader, keyboard, 200% text, and in bright sunlight | `@axe-core/playwright` gate; accessibility-tree snapshots of every screen in both locales; keyboard-only traversal. **No screen reader has been run** — see §3.1 |
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
| R21 | **The reassuring default** — a figure or state whose only purpose is to inform a decision, rendered with a stand-in value when the real one is unknown or does not apply, so the traveler is biased toward the worse decision and has no way to tell. Four instances in one week, in four modules: `feeNote: null` shown as `¥0`; `risk: 'none'` on an old-system receipt shown as a checked, comfortable deadline; an export estimate floored at "about 1 MB" on an empty device; and a tab badge selector that cannot yet compute returning `0`. Never crashes, never blanks, never errors — every existing assertion passes | 4 | 4 | 16 | **For every value that can be unknown or inapplicable, assert the unknown case specifically, and assert it renders distinguishably from a real value** — not that it renders without error. `undefined` means "no badge to show", never "nothing to show a badge about". See section 3.2 | QA + whoever owns the value |

### Top by score

R01 wrong refund estimate (20) · R02 wrong threshold verdict (20) · R03 wrong deadline (20) · **R21 the reassuring default (16)** · then a five-way tie at 15: R04 IndexedDB data loss, R05 offline failure at the airport, R06 stale app served by the service worker, R07 iOS Safari storage eviction, R08 failed import.

These define the non-negotiable automated coverage for M1 and M2.

R21 entered above the tie on evidence rather than estimate: four instances in one week, none caught by a test, three caught by someone looking at a screenshot. Its likelihood is 4 because the shape is a *habit* — a default written to avoid showing a blank — not a mistake, so it recurs wherever a new value can be unknown.

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
| **Accessibility tree** | Playwright a11y snapshot | What a screen reader is handed, per screen, per locale: roles, names, states, reading order | Every PR |
| **Exploratory** | Emulated devices, charter-based | Visual review, odd paths, anything a scripted test would not think to try | Per milestone |

### Unit test conventions

- Domain code is **pure**: no `new Date()`, no `Intl` defaults, no direct storage access. Time and locale are injected. This is a testability requirement, not a style preference — R03 and R12 depend on it.
- **Boundary cases are mandatory** for every numeric or date rule: `x−1`, `x`, `x+1` on both sides of the documented basis (tax-excluded vs tax-included matters — see `domain-rules.md`).
- **Property-style cases** using seeded pseudo-random input (`fast-check` if the Architect approves the dependency, otherwise a seeded loop helper in `src/test-support/`) for invariants such as:
  - `extractTax(price, rate)` + net == gross, for all integer prices in range;
  - export → import → export round-trips: the parsed documents are deep-equal ignoring volatile envelope fields (`exportedAt`, `appVersion`), which is the real invariant — byte equality would fail on every run;
  - aggregation of a receipt set equals the sum of its per-traveler partitions;
  - a deadline is always ≥ the purchase date and independent of the device timezone.
- **An atomicity claim is falsifiable, so ask for the test.** Patching `IDBObjectStore.prototype.put` to throw for one named store drives the abort path precisely, without needing a real `QuotaExceededError` — #93 uses it to prove a replace import rolls back. So "this write path is all-or-nothing" is a property a test can state, and a review that accepts control-flow reasoning instead is accepting less than is available. That includes reviews by QA: if a reviewer raises an atomicity concern they could not demonstrate, they say so.
- **No floats for yen.** Yen is an integer. Any test that would need `toBeCloseTo` on a money value is a bug report, not a test.
- File naming: `*.test.ts` / `*.test.tsx` next to the source. Playwright specs live in `e2e/*.spec.ts` and are excluded from the Vitest `include`.

### Component test conventions

- Query by role and accessible name first (`getByRole('button', { name: … })`). `data-testid` is the fallback for non-semantic containers only. This keeps accessibility load-bearing: if the test can't find it, a screen reader can't either.
- Every component test renders in **both locales**, with a "longest realistic string" fixture per locale.
- Assert observable output, never internal state or props plumbing.
- **Any surface that holds a user-facing string in state gets a locale-switch test**: mount it holding the string — an error, a toast, a pending confirmation — switch locale, assert the text changed. `architecture/overview.md` requires state to store the **key** and translate at render, and that rule deliberately has no static guardrail: `setState(t('x'))` is catchable but a local, a helper, a reducer or a rejected promise two frames away is not, so a check would be loudest exactly where the risk is lowest and silent where it is highest. This test fails for every spelling, because it asserts the property (the traveler's language) rather than a syntax correlated with it.
- **A live region needs the action done twice.** Writing the same string again is not a mutation, so nothing is announced the second time — and the correct text, the correct politeness and the correct position in the tree are all true in the broken version. Doing the thing twice is the only thing that separates them, and it is exactly what a confused person does. Assert that a second press produces a fresh announcement, not merely the right text.

### Guardrail test conventions

Some domain rules are prohibitions rather than features. `DR-013` says the general-goods / consumables split must not exist; `DR-040`, `DR-044` and `DR-052` say the app must not talk to a network it does not own; `DR-041` caps a stored field at four characters; `DR-075` and `DR-078` say a validation finding must never block a save. There is nothing to build for any of them, so there is nothing a behavioural test can observe — and nothing stopping a later pull request from quietly violating one.

These get **guardrail tests**: a small suite that reads the source tree and the bundled content instead of running the app (`src/guardrails/`, owned by `M1-5d` / issue #59).

- This is the **one** exception to "assert observable output, never implementation". The rule above exists to stop tests pinning wording or internal structure in place of behaviour. A prohibition has no behaviour to pin: static assertion is the only mechanism available, and the thing being protected is a published contract in `domain-rules.md`, not an implementation detail. Nobody may cite the general rule to delete this suite.
- Every guardrail names the rule id it protects in its test title, so a failure explains itself to someone who has never read this document.
- A guardrail asserts a **prohibition or an equality**, never a quality judgement. "No `fetch` outside the outbound-link helper" is a guardrail. "The code is clean" is not.
- **No wall-clock assertions.** A guardrail that fails because a CI runner was busy is a flaky test, and under R20 a flaky test gets quarantined — which is exactly what must not happen to a guardrail. Keep the suite fast; do not assert that it is fast.
- Where a guardrail needs exceptions, they live in an **explicit, documented allowlist** in the test file. Adding to the allowlist must be a visible diff that a reviewer can argue with. A guardrail with an implicit escape hatch protects nothing.
- **When a guardrail fires, check whether something else already claims the opposite.** If it does, the allowlist is the wrong tool: one of the two claims is wrong, and the guardrail has found a **disagreement**, not a false positive. The gallery registered with `screenIds: []` so a development tool would stay out of the published inventory, then wrote `data-screen="DEV-GALLERY"` into the DOM. Allowlisting would have preserved the contradiction permanently, and it would have been an exception for exactly the case the rule describes. The attribute was deleted instead. Contrast the same file's `href` exemption, which is a genuine false positive: a specimen's link is fixture data for a component under glass, and nothing else claims the gallery has no links.
- **Narrowing the scanned input is not loosening the pattern.** Stripping SVG path data before scanning for rule constants is legitimate, because markup geometry can never be a rule constant — but only as a *closed class*, never as a per-file exemption. An exemption list that grows each time a new icon appears becomes the escape hatch, because every entry arrives as the fix for a failing guardrail.
- **Every matcher needs a positive control**: assert it fires on a known violation, using the **same pattern object** the rule uses rather than a copy beside the fixture. A pattern that matches nothing is indistinguishable from a codebase that is clean, and a control that re-declares the pattern proves only that the copy works. This is R21 turned on our own instruments (section 3.2).
- **A gate that watches one spelling of a thing teaches people the other spellings.** `test.fixme` has `describe.fixme` and `skip(true)` beside it; ban the family, not the member. The same argument favours closed unions over strings, and asserting a mechanism over one of its consequences.
- Prefer the **real enforcement** where one exists. A guardrail duplicating a check the application already performs at boot is weaker than the check and will drift from it: delete the guardrail. One was deleted this way during #59 — the feature registry already validates every route pattern against the published inventory, in the running app.
- Record what the suite **cannot** cover, in two lists: not machine-checkable (checked in review, say where), and checkable-but-unwritten. Collapsed into one list, the un-checkable rules make the gap look permanent and the gap makes the un-checkable rules look like laziness. Membership of the first list is a claim about our imagination, not a property of the rule.

### 3.1 What the suite cannot prove

Written down because a known limit is cheaper than rediscovering it under pressure, and because both of these have already produced a defect.

- **No real device has run this app, and no screen reader has read it.** This team has no iPhone, no Android handset, no VoiceOver and no TalkBack. Emulation reproduces a viewport, a user agent and an engine; it does not reproduce iOS Safari's storage eviction, PWA install behaviour, camera and HEIC file input, safe-area insets on real hardware, or memory pressure. An accessibility-tree snapshot shows what a screen reader is *handed* — it cannot show what it announces, how gestures navigate, or whether a live region is heard at the moment it matters. `setOffline` is a network emulation, not a radio. `R07` (genuine quota and eviction) and `R14` (iOS install quirks) are therefore **open residual risks carried into launch**, and `R06` has no automated coverage on WebKit at all because Playwright's WebKit does not expose the worker lifecycle. None of this is a reason to withhold the release; it is a reason the release report must say so rather than let a green suite imply otherwise.
- **A conditional branch is unverified until it has run in the condition it exists for.** Green tests are evidence about the paths those tests take. A branch that exists for a rare case — a filter, a fallback, an error path — is exercised by nothing in a normal run, so an always-false predicate and a working one are indistinguishable in every build we have ever seen. This is not hypothetical: the axe obstruction filter shipped in #91 matched nothing, passed every build, and protected nothing, because `main` produces no `target-size` finding. A rare branch needs a test that **manufactures** the rare case, not a green suite around it.
- **We cannot reproduce a genuine quota or eviction failure.** `fake-indexeddb` has no quota, so `TC-DATA-006` and `TC-DATA-007` exercise our handling of a simulated error rather than the browser's behaviour when a device actually fills up. `R07` therefore still depends on a real device, and no green suite is evidence about what happens at a real storage ceiling.
- **`TC-A11Y-016` and `TC-A11Y-017` did not bind between M0 and #141, and `R11` is less covered than a green suite implies.** Both `E2E_ROUTES` entries are shorter than a viewport and a sticky bar stays *in flow*, so at full scroll the content already clears it — with or without the padding either case exists to check. Restoring the original M0 content-padding defect left the whole smoke suite green. This matters more than one gap because `TC-A11Y-017` is the **compensating control** that justified filtering axe's `target-size` finding in #91, argued there as *strictly stronger than the scan it replaces*: a real finding was suppressed and its replacement could never fail. **A new variant of the fixture problem** — the test did not construct the arrangement, the *route inventory* did, and nobody edits route data thinking about an accessibility assertion three files away. Until #141 closes, no release report may present the accessibility suite as evidence about obscured targets.

#### What reads this back?

Six mechanisms this week were **present, correct-looking, commented, green — and inert or false.** Not untested: every one sat inside a passing suite.

| Mechanism | What it was | What read it back |
|---|---|---|
| `cancel-in-progress: false` on `main` | a flag stating an intent | nothing — runs on `main` were cancelled for seven weeks |
| The axe obstruction filter (#91) | a filter over findings | nothing — `main` produces no `target-size` finding, so it matched an empty set |
| `BottomSheet`'s `inert` loop (#121) | a loop over background nodes | nothing — the sheet rendered inside `#app`, so the filter removed the only candidate |
| The global `testIgnore` | a config key | nothing — a project-level sibling **replaces** it rather than extending it |
| `BottomSheet`'s own inert test | an assertion | nothing real — the fixture appended a div to `<body>`, constructing the one DOM shape where the broken code works |
| #113's blocker-uniqueness assertion | an assertion with teeth | nothing — it was **false**: a high-value receipt in a checked bag belongs under two blockers, and the fixture could not reach the case |

**The question to ask in review is "what reads this back?"** Each of the six answers "nothing", and each answer was available when the code was written rather than after the incident. That is cheap enough to apply every time, which is the only property that matters.

Five things follow, each paid for:

- **A correct comment is evidence about intent and none at all about effect.** Three of the six had comments that accurately described what the code was *for*. A reader checks that the code matches the comment, agrees that it does, and never asks whether the code does anything. The comment is what made them invisible.
- **When two mechanisms produce the same observable, a test of the observable is not a test of either of them.** The keyboard focus-trap and `inert` both yield "focus stays in the sheet"; writing and re-writing a live region both yield "the region contains the right text". In both cases the broken one was the one serving the population we cannot test — which is not a coincidence, because the mechanism that is easy to observe is the one that exists for the users we can see. **Assert the mechanism**: `expect(document.getElementById('app')?.hasAttribute('inert')).toBe(true)`, not "focus stayed inside".
- **Mutation proves an assertion has teeth; it says nothing about whether the assertion is true.** These are two independent checks and we have been treating one as sufficient. *Break the code, does the test fail?* establishes that the test catches **this** bug. *Construct the case the assertion forbids but the product should allow, does the test fail?* establishes that the assertion is **right**. #113's uniqueness assertion passed the first and failed the second: reverting the predicate turned it red, and it was still a false claim about the function — a high-value receipt in a checked bag belongs under two blockers, because taking it out of the bag and finding its certificate are different jobs. **A false assertion with teeth is worse than no assertion**, because it is load-bearing and nobody will touch it. Note which of the two needs imagination: mutation is mechanical, the counterexample is the case the author could not see from inside their own fixture — so it is the check that needs **another person**. Both of this week's instances were caught by a reviewer constructing a case the author had not conceived, and both authors had written the warning about it hours earlier. That is the strongest argument available against anything that reduces independent eyes on a change, and it is worth having written down before throughput is the pressure rather than during.
- **Does this test construct the thing it is testing?** A fixture that manufactures the production condition is worse than no test, and it is a **third** check — it survives both of the others. `BottomSheet`'s inert test asserted `behind.inert === true` on a `<div>` the test itself appended to `document.body`; in production the sheet rendered inside `#app`, body's only element child, so the code marked nothing, ever, in any app, on any route. **Mutation passes it**: break the implementation and it goes red, because it is a faithful test of the code — just not of the situation. **The counterexample finds nothing**: there is no input the assertion forbids and the product allows, because the assertion was true, of its own fixture. The failure is upstream of both, and the harm is not that the test was weak — *its existence is why nobody looked.* A green assertion on a mechanism with no visible output converts an open question into a closed one.
  - **When to ask it:** a test that passes first time against a mechanism you cannot see — `inert`, focus, a live region, a service worker, an `aria` relationship. If the test had to construct the arrangement, it has tested the arrangement.
  - **Assert the mechanism, not a specific element**, because which element carries it differs between production and the test environment: `document.querySelectorAll('[inert]').length` rather than `#app.inert`.
  - **Sometimes the implementation must accommodate the instrument.** `inert` as an attribute rather than a property, because the property does not reflect in jsdom — otherwise the correct fix makes the correct test red, and the natural reaction is to weaken the test, which lands everyone back believing it was checked.

And one convention for the other direction: **a defensive branch that looks redundant must say what breaks when it is removed** — in the imperative, at the line where the removal would happen. Four instances already: the `IGNORED` constant each Playwright project spreads, `playwright.config.ts`'s per-project `testIgnore`, the registry's `undefined` filter, and `BottomSheet` restoring only the nodes it marked. All four read as tidy-up bait, and the comment is the only thing standing between them and a simplification. The `testIgnore` one is the sharpest, because the tidy-up **reintroduces the bug** rather than merely losing a protection: a project-level `testIgnore` *replaces* the global one, so deleting the repetition as redundant is what caused the production smoke to run on pull requests in the first place.

### 3.2 The reassuring default (R21)

The failure class our assertions are worst at, because the wrong value is **inside the range of plausible right values**.

> A figure or state whose only purpose is to inform a decision is rendered with a stand-in value when the real one is unknown or does not apply — so the traveler is biased toward the worse decision and has no way to tell.

Four instances in one week, in four modules:

| Where | Shown | Reads as | Why it is invisible |
|---|---|---|---|
| `Operator.feeNote: null` | `¥0` | "no fee will be deducted" | some operators genuinely might not charge |
| `DeadlineStatus.risk: 'none'` on an old-system receipt | a comfortable deadline | "we checked, you are fine" | most receipts do have comfortable deadlines |
| Export size estimate floored at 1 MB on an empty device | "about 1 MB" | "photos cost a megabyte" | backups with photos are large |
| A tab badge selector that cannot yet compute returning `0` | `0 need action` | "nothing is outstanding" | most of the time nothing is |

What makes it one class rather than four bugs:

1. **It never crashes, never blanks, never errors.** Every existing assertion passes. There is nothing for "does it render" or "is it non-empty" to catch.
2. **The traveler cannot detect it.** `¥0` is a number a fee could be; "about 1 MB" is a size a backup could be.
3. **It is always a shortcut that looks like politeness** — a default, a floor, a coalesce. Nobody writes it carelessly; they write it to avoid showing a blank.
4. **The harm direction is consistent**: it biases the traveler toward the action we were trying to inform them about. The reassuring answer is the wrong one, so nothing prompts them to question it.

**The convention.** For every value that can be unknown or inapplicable, assert the unknown case **specifically**, and assert that it renders **distinguishably** from a real value. Not "renders without error" — distinguishable. That is the assertion all four would have failed.

Corollaries, each from a real instance:

- A sentinel means one thing. `undefined` means "no badge to show"; it never also means "nothing to show a badge about". A selector that cannot answer returns `undefined`, never `0`.
- A floor on an estimate is a lie at the bottom of its range. If the honest answer is "nearly nothing", say nearly nothing.
- "Does not apply" and "is fine" are different states and must render differently. An old-system receipt has no deadline to be comfortable about.
- A field that means two things is the same defect wearing a type. So is an inherited setting a child can silently *replace* rather than extend — it reads as additive at every call site and is not.
- **The structural half, from `architecture/overview.md`:** a value that can be unknown says so in its **type**, and nothing downstream may substitute a plausible one. `DeadlineRisk` carries `not_applicable` as a member distinct from `none`; `fees: []` means unknown, never zero. A type that cannot express "unknown" guarantees someone will encode it as a real value. And the absence is the rendering, not a slot to fill: the correct rendering of a count that cannot be computed is **no badge at all** — not zero, not a dash, not a skeleton that resolves to zero. A dash reads as "none" to every traveler who sees it.
- **It applies to our own instruments too, and that is the instance most likely to survive.** A guardrail whose pattern matches nothing is indistinguishable from a clean codebase; a smoke test that matched zero cases exits 0. Every other instance of R21 misleads a traveler about money or time; this one misleads *us* about whether we are protected — and it is the one nobody is downstream of, so nothing surprises anyone into checking. The answer is a positive control: assert the matcher fires on a known violation, using the same pattern object the rule uses, never a copy.

**The badge case is the one still preventable, and it is the most severe.** The other three mislead about money; that one can mislead about the airport. A false `0` at first paint on departure day hides `DR-077` (goods still in checked baggage) and `DR-030` (unconfirmed items) — the two failures that are silent and irreversible, because once the bag is handed over the airline will not retrieve it and nothing afterwards recovers the refund. One paint cycle, on the one screen read while walking into a terminal.

**Why a convention and not three test cases.** Three of the four were caught by a person looking at a 390 px capture. That is luck with good people attached, and it does not scale to the fourth. The point of writing the class down is that the next instance is caught by a habit.

### E2E conventions

- **Projects:** `iphone-webkit` (iPhone 14, WebKit), `pixel-chromium` (Pixel 7, Chromium), `desktop-chromium`. Locale is a parameter; critical journeys run in both `zh-TW` and `en`.
- E2E runs against the **production build** (`npm run build` + `npm run preview`), never the dev server — the service worker is part of the system under test. **One carve-out, and only one:** the development-only UI kit gallery (`M1-3e`, issue #27) is gated behind `import.meta.env.DEV` and is absent from the production bundle by design, so it cannot be reached from a preview server at all. Its project (`gallery-dev`, `testMatch` scoped to `e2e/gallery/**`, excluded from the three production projects) runs against `npm run dev` on its own port. What that project may be used for is narrow: component conformance and the capture matrix. It is **not evidence for any accessibility claim about a real screen** — axe on the production routes in the three real projects remains the only gate that counts — and it asserts nothing about offline, the service worker or caching, because `devOptions.enabled` is false and there is no worker to test. Any *other* dev-server project needs a reason as good as "the thing under test does not exist in the production bundle", and that reason goes in the pull request. Nobody may cite this carve-out to move a real screen's tests off the production build.
- **Offline:** the worker is registered with `registerType: 'prompt'` and `clientsClaim: false` (ADR 0007), so **the first page load is deliberately uncontrolled**. Every offline test must therefore let the worker install, reload once so the page is controlled, and only then `await context.setOffline(true)`. Going offline on the first load tests nothing and will fail for the wrong reason. We cover: cold start offline, deep link offline, data entry offline, the full airport sequence offline, and recovery when the network returns.
- **Service-worker update:** load build A, swap the served build to B, reload, assert the new asset hash, that the update prompt appeared, and that stored data survived.
- Default `timezoneId: 'Asia/Tokyo'`; a dedicated project/test group overrides it to `Asia/Taipei`, `UTC`, and `Pacific/Kiritimati`.
- No `waitForTimeout`. Wait for a state, not for a duration.
- **Artifacts:** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`. CI uploads `playwright-report/` and `test-results/`. Reporters: `list` + `html` locally; `junit` + `github` added in CI.
- **Screenshots on PRs:** every UI-affecting PR attaches screenshots in **both** zh-TW and en at a 390 px-wide viewport. Playwright writes them to `test-results/screenshots/`; the author drags them into the PR body.
- **And the author looks at them before requesting review.** Attaching is not reading. In one week three defects were found this way and by nothing else: an export estimate reading "about 1 MB" on an empty device, a clipped tagline that claimed we *are* the refund service, and a sticky footer covering the "not sure yet" option in the operator list — the one a traveler who cannot find their operator needs most. All three were a value that was **wrong rather than absent**, which is the class an assertion is worst at, because you must already suspect the value to check it (R21, section 3.2). All three were visible in one glance at a capture the PR already had.
- **Capture the smallest supported width too when a surface is scrollable or has sticky chrome.** 320 px is where a sticky footer eats proportionally the most of a short list, and where font-driven relayout is largest. If a control is reachable there, it is reachable everywhere.

### Accessibility conventions

- `@axe-core/playwright` on every route and on open dialogs/sheets. **Gate: zero `serious` or `critical` violations.** `moderate`/`minor` are filed as issues with a deadline, not merged away by suppression.
- Suppressions require a comment with a reason and a linked issue. A naked `.disableRules()` fails review.
- **Obscured-target findings are measured where the user can be.** A sticky bottom navigation covers whatever is beneath it at a given scroll offset — that is what sticky positioning is for, and what every mobile tab bar does. An axe scan evaluates at one scroll position, so it reports a true statement (*this target is obscured at scroll 0*) about a state the user is never stuck in. The property WCAG 2.5.8 protects is **operability**, so that is what we assert: `TC-A11Y-017` scrolls **every** interactive control on every route into view and requires it to land completely clear of the persistent chrome. That is strictly stronger than the axe scan it replaces for this one rule — it checks every control rather than only those visible at one offset — and it still fails the build, on the real 390 px viewport, when a control genuinely cannot be cleared.
- **What that is not.** It is not a suppression: no rule is disabled and no selector is scoped out. It is also not "scan at a taller viewport" — inflating the viewport until a finding disappears is a suppression wearing a costume, and it would leave the scan structurally blind to every scroll-dependent problem on the only viewport the product ships to. Nor is it "scan after scrolling to the bottom", which is as arbitrary a single position as scroll 0. Same reasoning as the offline rule above: a test run in a state the user cannot reach tests nothing and fails for the wrong reason.
- **And the claim above was wrong when it was written, which is why it is still here rather than deleted.** "Strictly stronger than the axe scan it replaces" was argued on #91 and was false: both routes in `E2E_ROUTES` are shorter than a viewport and a sticky bar stays in flow, so `TC-A11Y-017` could not fail on any route the product had. The filter suppressed a real class of finding and its replacement was a tautology — **a compensating control is not a control until it has been watched failing.** Tracked as #141. Before a filter, a suppression or a replacement is accepted anywhere in this suite, restore the defect it is meant to catch and watch the replacement go red; if it cannot be made to, the filter is suppression and must be removed rather than justified.
- Automated checks catch roughly a third of real barriers. We cover as much of the rest as emulation allows: accessibility-tree snapshots per screen per locale, keyboard-only traversal, visible focus, 200% text and 320 px reflow, and target size ≥ 24 px (WCAG 2.2 AA, 2.5.8). What that leaves uncovered is in §3.1 and it is not small.

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
| **Real devices (NOT AVAILABLE)** | — | iOS/Android hardware, VoiceOver, TalkBack, airplane mode with a real radio | **Not performed.** This team has no physical device and no screen reader. Recorded as an open gap in the release report, not as a pass — see §3.1 |

Minimum device/browser support matrix: iOS Safari (latest and latest−1), Android Chrome (latest), desktop Chrome/Edge, desktop Safari, desktop Firefox (best effort — not an E2E project, covered by exploratory checks).

---

## 6. Entry and exit criteria

**Entry criteria (any milestone):** scope is written in issues with acceptance criteria; the relevant domain rules or design are merged; the test strategy covers the new risk (or is amended first).

| Milestone | Exit criteria |
|---|---|
| **M0 — Discovery & Design** | Research, UX, architecture, and this strategy merged. Risk register reviewed by the team. Tooling agreed with the Architect (#4). Issue and PR templates live. Initial test cases drafted and traced to requirement IDs. |
| **M1 — Foundation** | Domain rules implemented as pure functions with **≥ 90% line and branch coverage on `src/domain`**, every boundary in `domain-rules.md` covered by a test, storage migrations tested with `fake-indexeddb`, i18n key-parity test green, CI running all levels, E2E skeleton green on all three projects, axe green on the app shell. Zero open S1/S2. |
| **M2 — MVP Features** | Every MVP journey has an E2E test in both locales; offline suite green (cold start, deep link, airport checklist, recovery); SW update test green; export/import round-trip green; axe zero serious/critical on every route; screenshots in both locales attached to every UI PR. Zero open S1/S2; S3 count agreed with the PM. |
| **M3 — Launch** | **Zero `test.fixme` remain anywhere in the suite** — a case written ahead of its screen and never turned on reads as coverage in a report while asserting nothing, so the release pass counts them and a non-zero count blocks. Full release checklist (§10) passed on the live site; the release report states plainly that the real-device and real-screen-reader passes were **not performed**, and names them as the first work a human tester should do; production smoke green; QA sign-off comment on the release issue. Zero open S1/S2, no unresolved S3 in a critical journey. |

**Stop-the-line rule:** any defect that can cause a traveler to lose a refund (wrong amount, wrong eligibility, wrong deadline, lost data, airport mode unusable offline) is S1 by definition and blocks the next merge to `main` until fixed or reverted.

---

## 7. Definition of Done — QA additions

Extends the DoD in [team-workflow.md](../process/team-workflow.md). A PR is done when, in addition:

- [ ] Tests added or updated at the right level (domain logic → unit; UI state → component; journey → E2E). A bug fix includes a test that fails without the fix.
- [ ] New or changed numeric/date rules have boundary tests on both sides of the boundary.
- [ ] **The green check ran after the last thing that landed under you.** A check is a claim about the merge base it ran against, not about `main`. Four times in one day a branch was green against a base that `main` had moved past, and one of them squashed green and landed `main` red. Confirm the branch is current — `git merge-base --is-ancestor origin/main HEAD` — and state the SHA you verified at when you stamp.
- [ ] **Every value that can be unknown or inapplicable has a test for that case, asserting it renders distinguishably from a real value** (R21, section 3.2). "It renders without error" does not satisfy this. If a value can only ever be known, say so in the PR.
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

**Infrastructure failures are not defects and must never be filed as one.** A saturated runner queue produces a red check with no logs — `"The job was not acquired by Runner of type hosted"` — which presents as an ordinary failure, and a `cancelled` beside a `success` on `main` is a run dropped from its concurrency group rather than anything breaking. **The one-look test: a real failure has logs.** If `gh run view --log-failed` is empty and no step ran, it is the runner. Re-run a *completed, failed* run; never dispatch a second run on a commit whose run is pending or in flight, because the newer run drops the older and you get a `cancelled` that looks like a failure. Filing one of these as a product bug even once starts the register filling with noise, and a register people stop reading is worse than no register.

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

**Per emulated device class (`iphone-webkit`, `pixel-chromium`, `desktop-chromium`)**

Emulation, not hardware. These three are Playwright projects: a viewport, a user agent and an engine. Read every box below as "passes under emulation".

- [ ] Core journey: create trip → log receipt → see pending refund → airport checklist → mark refunded.
- [ ] Install to home screen works; standalone launch keeps the data; safe areas respected. **Emulated only** — real iOS install behaviour is `R14` and is unverified.
- [ ] Photo/file input works and failure is graceful. **HEIC on real iOS is not covered** (`R15`); the fixture is a file, not a camera.

**Offline**
- [ ] Airplane mode: cold start, airport checklist, logging a receipt, switching language — all work.
- [ ] Reconnecting does not duplicate or lose data.

**Accessibility**
- [ ] axe: zero serious/critical on every route.
- [ ] Accessibility-tree snapshot reviewed for every screen in both locales.
- [ ] Keyboard-only traversal; visible focus everywhere; target size ≥ 24 px.
- [ ] Contrast verified against the final palette, including disabled and error states.

**Not performed by this team, and not to be implied**

Every ticked box above is evidence about emulation. These are the gaps, and they are the first work a human tester should do, in this order:

- [ ] **Real iPhone (Safari) and real Android (Chrome).** Nobody here has a device. Emulation does not reproduce iOS Safari storage eviction, PWA install behaviour, the camera and HEIC file input, safe-area insets on hardware, or memory pressure.
- [ ] **VoiceOver and TalkBack.** An accessibility-tree snapshot shows what a screen reader is *handed*; it cannot show what it announces, how gestures navigate, or whether a live region is heard at the moment it matters.
- [ ] **Airplane mode on hardware.** `setOffline` is a network emulation, not a radio.
- [ ] **A real storage ceiling.** `fake-indexeddb` has no quota (`R07`); we exercise our handling of a simulated error, never the browser's behaviour at a real limit.
- [ ] **Service-worker update on WebKit** (`R06`). Playwright's WebKit does not expose the worker lifecycle, so the update suite is Chromium-only. iOS is unverified.

**The release report repeats this list rather than citing it.** A reader who sees only the ticked boxes would conclude a device pass happened, and nobody would know to look. That is the one failure this document exists to prevent: an honest gap is recoverable by whoever picks it up, a false claim is not.

**Data and privacy**
- [ ] Export → fresh profile → import restores everything exactly.
- [ ] Upgrading from the previous released version keeps existing data (migration run on a real previous-version profile).
- [ ] Network panel shows no third-party requests; storage contains no full passport number.

**Content**
- [ ] Tax rules data `lastReviewed` date is current (the weekly freshness check has no open issue) and sources resolve.
- [ ] Guide content matches `docs/research/` and the live rules.

Sign-off: QA comments the completed checklist on the release issue. No sign-off, no release.
