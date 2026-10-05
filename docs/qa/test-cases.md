# Kaeru — Initial Test Cases

| | |
|---|---|
| Status | v0.1 (M0 draft) |
| Date | 2026-10-05 |
| Owner | Senior QA |
| Tracking | Issue #5 |
| Derived from | [domain-rules.md](../product/domain-rules.md), [user-journey.md](../product/user-journey.md), [brief.md](../product/brief.md) |
| Strategy | [test-strategy.md](./test-strategy.md) |

High-level cases written at M0, before implementation. They are the contract for what M1/M2 automation must cover, not the code itself. Each case cites the requirement it protects (`DR-0NN` domain rule, `UJ-0NN` journey step) and the risk from the strategy's register (`R0N`).

**Columns.** *Level*: U = unit (domain), S = unit (storage), C = component, E = E2E, M = manual. *Pri*: P0 must be automated before the owning feature merges, P1 before the milestone exits, P2 best effort. Cases marked **[unconfirmed]** depend on a rule whose status in `domain-rules.md` is not `confirmed-official`; they run tagged `@unconfirmed` and do not block merges until the rule is confirmed.

**Automated test titles** start with the case ID, e.g. `TC-DOM-001 rejects a tax-excluded total of 4,999 yen`.

Counts: **106 cases** — DOM 36, DATA 18, AIR 14, I18N 11, A11Y 12, PWA 7, SEC 4, UX 4.

---

## 1. TC-DOM — Domain rules, money, dates

Pure functions. No DOM, no storage, no network, injected `Clock`, explicit time zone. These are the cases that stop a traveler from losing money (strategy risks R01, R02, R03, R13).

### 1.1 Minimum purchase threshold

Basis: tax-**excluded** total, same shop, same calendar day, combined across all goods (the general-goods / consumables split is abolished from 2026-11-01).

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-001 | Tax-excluded total ¥4,999 at one shop on one day | Not eligible; UI states how much more is needed (¥1) | DR-threshold | R02 | U | P0 |
| TC-DOM-002 | Tax-excluded total ¥5,000 | Eligible (boundary is inclusive) | DR-threshold | R02 | U | P0 |
| TC-DOM-003 | Tax-excluded total ¥5,001 | Eligible | DR-threshold | R02 | U | P0 |
| TC-DOM-004 | Tax-**included** ¥5,000 at 10% (tax-excluded ¥4,546) | Not eligible — the common user misconception must not become a bug | DR-threshold | R02 | U | P0 |
| TC-DOM-005 | Tax-included ¥5,500 at 10% (tax-excluded ¥5,000) | Eligible | DR-threshold | R02 | U | P0 |
| TC-DOM-006 | Tax-included ¥5,400 at 8% reduced rate (tax-excluded ¥5,000) | Eligible | DR-threshold, DR-rates | R02 | U | P0 |
| TC-DOM-007 | Two receipts, same shop, same day, ¥3,000 + ¥2,500 tax-excluded | Combined ¥5,500 meets the threshold; app shows them as one qualifying day | DR-threshold | R02 | U | P0 |
| TC-DOM-008 | Two receipts, same shop, **different days**, ¥3,000 + ¥2,500 | Neither day qualifies; no false "eligible" | DR-threshold | R02 | U | P0 |
| TC-DOM-009 | Two receipts, **different shops**, same day, ¥3,000 + ¥2,500 | Neither qualifies | DR-threshold | R02 | U | P0 |
| TC-DOM-010 | Single receipt mixing 10% and 8% lines, tax-excluded ¥2,600 + ¥2,400 | Combined ¥5,000 qualifies; tax computed per rate | DR-threshold, DR-rates | R01 | U | P0 |
| TC-DOM-011 | Zero-amount and negative (returned item) lines | Negative input rejected with a validation error, never silently coerced | DR-threshold | R01 | U | P1 |

### 1.2 Tax extraction and refund estimate

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-012 | ¥5,500 tax-included at 10% | Net ¥5,000, tax ¥500 | DR-rates | R01 | U | P0 |
| TC-DOM-013 | ¥5,400 tax-included at 8% | Net ¥5,000, tax ¥400 | DR-rates | R01 | U | P0 |
| TC-DOM-014 | Non-divisible amount, e.g. ¥9,999 at 10% | Net and tax are integers, net + tax == gross exactly; rounding direction matches the rule in `domain-rules.md` and is asserted explicitly | DR-rates | R01, R13 | U | P0 |
| TC-DOM-015 | **Property:** for every integer gross 1…1,000,000 at 10% and 8%, `net + tax == gross` and both are non-negative integers | Invariant holds for all inputs | DR-rates | R01 | U | P0 |
| TC-DOM-016 | Mixed-rate receipt: tax is the sum of per-rate extractions, not a blended rate applied to the total | Exact per-rate sum; a blended-rate implementation fails this case | DR-rates | R01 | U | P0 |
| TC-DOM-017 | Operator handling fee reduces the expected payout | Displayed refund = tax − fee, with fee shown separately; gross tax never presented as the payout | DR-operators | R01 | U | P0 |
| TC-DOM-018 | **Property:** refund estimate for a set of receipts equals the sum of per-traveler partitions | Aggregation is partition-stable | DR-threshold | R16 | U | P1 |
| TC-DOM-019 | No float arithmetic: an amount of ¥0.5 or `0.1 + 0.2` style input | Non-integer yen rejected at the boundary; internal math is integer only | DR-rates | R01, R13 | U | P0 |
| TC-DOM-020 | Very large total (¥9,999,999) | Formatted with grouping, no overflow, no scientific notation | DR-rates | R13 | U | P1 |

### 1.3 Export deadline and date handling

Basis: the window runs from the day **following** the purchase date to the 90th day. Canonical official vector: purchase 2026-11-01 → deadline 2027-01-30.

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-021 | Purchase 2026-11-01 | Customs deadline 2027-01-30 (official worked example) | DR-deadline | R03 | U | P0 |
| TC-DOM-022 | Purchase 2026-11-01, departure 2027-01-30 | Within the window (deadline day itself is valid) | DR-deadline | R03 | U | P0 |
| TC-DOM-023 | Purchase 2026-11-01, departure 2027-01-31 | Expired by one day; the receipt is flagged, not silently counted in the pending total | DR-deadline | R03 | U | P0 |
| TC-DOM-024 | Purchase 2026-11-01, departure 2026-11-02 | Within the window (day 1) | DR-deadline | R03 | U | P0 |
| TC-DOM-025 | Purchase on 2027-02-28 and on a leap-adjacent date; also a purchase crossing a year boundary | Day counting is calendar-correct across month lengths and years | DR-deadline | R03 | U | P0 |
| TC-DOM-026 | **Property:** deadline is always exactly 90 calendar days after the day following purchase, for 500 seeded purchase dates, and is independent of the process time zone | Invariant holds; running the suite with `TZ=UTC`, `TZ=Asia/Taipei`, `TZ=Pacific/Kiritimati` gives identical results | DR-deadline | R03, R12 | U | P0 |

### 1.4 Timezone and "today"

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-027 | Device clock Asia/Taipei 2026-11-01 23:30 (= 2026-11-02 00:30 JST); user logs a purchase made in Japan | The purchase date defaults to the Japan calendar date while the traveler is on the trip, and the choice is visible and editable | DR-deadline, UJ-receipt | R12 | U | P0 |
| TC-DOM-028 | Days-remaining countdown computed at 23:59 and at 00:01 local time | Countdown changes by exactly one at the local calendar-day boundary, never by zero or two | DR-deadline | R12 | U | P0 |
| TC-DOM-029 | A stored date round-trips through persistence and reload under a changed device timezone | Calendar date is unchanged (dates are stored as calendar dates, not UTC instants) | DR-deadline | R12, R04 | S | P0 |
| TC-DOM-030 | E2E with Playwright `timezoneId` set to Asia/Taipei, Asia/Tokyo, UTC, Pacific/Kiritimati | Deadline and countdown rendered identically in all four | DR-deadline | R12 | E | P0 |

### 1.5 Customs and departure rules

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-031 | A receipt with one item marked as missing / consumed / gifted away | The **whole receipt** is marked at risk — rejection is per purchase transaction, not per item | DR-customs | R01 | U | P0 |
| TC-DOM-032 | A receipt whose goods are recorded as packed in checked luggage | Flagged before departure with the instruction to clear customs before check-in; the airport checklist orders it accordingly | DR-customs, UJ-airport | R05 | U, E | P0 |
| TC-DOM-033 | Dashboard pending total excludes expired and already-refunded receipts | Totals are segmented: pending customs / awaiting payment / received / expired. No single misleading number | DR-deadline | R01 | U | P0 |
| TC-DOM-034 | Receipts for multiple travelers with separate passports | Totals and checklists are per traveler; no cross-attribution | DR-eligibility | R16 | U, E | P0 |
| TC-DOM-035 | **[unconfirmed]** Any rule whose status is not `confirmed-official` | The app's behavior is configurable from rules data, the UI labels it as subject to change, and the test is tagged `@unconfirmed` | Uncertain rules section | R19 | U | P1 |
| TC-DOM-036 | Rules data `lastReviewed` older than 180 days at build time | Build-time test fails, forcing a content review | DR-meta | R19 | U | P1 |

---

## 2. TC-DATA — Storage, migration, export and import

`fake-indexeddb` for unit level; real IndexedDB in E2E (strategy risks R04, R07, R08).

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DATA-001 | Save a receipt, reload the app | Receipt is present and byte-identical | UJ-receipt | R04 | S, E | P0 |
| TC-DATA-002 | Save 300 receipts across 4 travelers | All persisted; dashboard totals correct; list renders within budget | UJ-dashboard | R04 | S | P1 |
| TC-DATA-003 | Schema migration v1 → v2 on a populated database | All records migrated, no field lost, version bumped once | — | R04 | S | P0 |
| TC-DATA-004 | Opening a **newer** database with an older app build | App refuses to downgrade-migrate and shows a recoverable message; it never deletes data | — | R04 | S | P0 |
| TC-DATA-005 | Transaction aborts mid-write (simulated failure) | No partial record; previous state intact; user sees a save failure, not a silent success | — | R04 | S | P0 |
| TC-DATA-006 | `QuotaExceededError` on write (simulated) | Clear error, data not corrupted, user is prompted to export or remove photos | — | R04, R07 | S, C | P0 |
| TC-DATA-007 | Two tabs of the app writing concurrently | Last write wins deterministically or a conflict is surfaced; no corrupt record | — | R04 | S | P1 |
| TC-DATA-008 | IndexedDB unavailable (Private Browsing / blocked) | App degrades with an explicit message instead of a blank screen or an unhandled rejection | — | R07 | C, E | P0 |
| TC-DATA-009 | `navigator.storage.persist()` requested at a sensible moment | Request is made; the outcome is reflected in the privacy/data screen | — | R07 | E | P1 |
| TC-DATA-010 | Export produces a file | Valid JSON, versioned, contains every traveler, receipt, and setting | UJ-backup | R08 | U, E | P0 |
| TC-DATA-011 | **Property:** export → import into an empty profile → export | Second export is identical to the first, for 100 seeded data sets | UJ-backup | R08 | U | P0 |
| TC-DATA-012 | Import a file from a previous schema version | Migrated and imported; nothing lost | UJ-backup | R08 | U | P0 |
| TC-DATA-013 | Import a truncated or syntactically invalid file | Rejected with a specific error; **existing data untouched** | UJ-backup | R08 | U, E | P0 |
| TC-DATA-014 | Import a well-formed file with an unknown future version | Rejected clearly; existing data untouched | UJ-backup | R08 | U | P0 |
| TC-DATA-015 | Import into a non-empty profile | User must choose merge or replace; replace requires explicit confirmation and is never the default | UJ-backup | R08 | E | P0 |
| TC-DATA-016 | Import a file containing a field that looks like a full passport number | Field is rejected or stripped; it is never persisted | — | R17 | U | P0 |
| TC-DATA-017 | Delete all data from the privacy screen | Requires confirmation; afterwards storage is genuinely empty (verified by inspection, not by the UI) | UJ-privacy | R04 | E | P1 |
| TC-DATA-018 | iOS Safari 7-day eviction simulation (storage cleared out of band) | App starts clean without an error loop; the user is warned that local-only data can be evicted and is prompted to export | — | R07 | E, M | P0 |

---

## 3. TC-AIR — Airport mode, offline, service worker

Run against the production build with the service worker active (strategy risks R05, R06).

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-AIR-001 | Install the app, go offline (`context.setOffline(true)`), cold start | App shell loads fully; no network error screen | UJ-airport | R05 | E | P0 |
| TC-AIR-002 | Offline cold start on a **deep link** to the airport checklist | Route resolves from the cache; no 404 and no redirect to home | UJ-airport | R05 | E | P0 |
| TC-AIR-003 | Complete the whole airport checklist offline | Every step is reachable and completable; progress persists across an offline reload | UJ-airport | R05 | E | P0 |
| TC-AIR-004 | Log a new receipt while offline | Saved locally; appears in totals; survives reload | UJ-receipt | R05 | E | P0 |
| TC-AIR-005 | Switch language while offline | Full UI switches; no missing strings fetched over the network | UJ-airport | R05, R09 | E | P0 |
| TC-AIR-006 | View a receipt photo while offline | Photo renders from local storage | UJ-receipt | R05 | E | P1 |
| TC-AIR-007 | Go back online after offline edits | No duplication, no loss, no unexpected refetch overwriting local data | UJ-airport | R05 | E | P0 |
| TC-AIR-008 | Guide and operator directory opened offline | Content available offline; external operator links are shown as unavailable rather than failing silently | UJ-guide | R05 | E | P1 |
| TC-AIR-009 | Checklist ordering | Customs confirmation appears **before** baggage check-in, with an explicit warning that checked bags cannot be retrieved | DR-customs, UJ-airport | R05 | E | P0 |
| TC-AIR-010 | Receipts grouped by what customs needs to see | Checklist groups by shop/day/traveler and flags items packed in checked luggage | DR-customs | R05 | E | P0 |
| TC-AIR-011 | A receipt whose deadline has passed appears in airport mode | Clearly marked expired and excluded from the amount the traveler expects to receive | DR-deadline | R03 | E | P0 |
| TC-AIR-012 | Service worker update: load build A, serve build B, reload | New build is active (asset hash changed), stored data intact | — | R06 | E | P0 |
| TC-AIR-013 | Update available while the app is open | A non-intrusive update affordance appears; accepting it reloads into the new build; declining does not break the session | — | R06 | E | P0 |
| TC-AIR-014 | Offline with a cold HTTP cache but a warm service-worker cache, on WebKit | Works on `iphone-webkit` specifically, not only on Chromium | — | R05 | E | P0 |

---

## 4. TC-I18N — Localization and parity

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-I18N-001 | Compare the zh-TW and en catalogs | Identical key sets, both directions; no missing, no extra | — | R09 | U | P0 |
| TC-I18N-002 | Every catalog value | No empty strings, no untranslated placeholder, no value equal to its key | — | R09 | U | P0 |
| TC-I18N-003 | Interpolation placeholders per key | The same placeholder set in both locales (a missing `{count}` in one locale is a defect) | — | R09 | U | P0 |
| TC-I18N-004 | Crawl every route in both locales | No raw i18n key is visible anywhere in the rendered text | — | R09 | E | P0 |
| TC-I18N-005 | Language switch on every main route | Entire page switches, including dates, numbers, and `<html lang>`; the choice persists across reload | UJ-settings | R09 | E | P0 |
| TC-I18N-006 | First visit with browser language `zh-TW`, `zh-Hant`, `zh-Hans`, `ja`, `en` | zh-Hant family → zh-TW; anything else → en; never a half-translated mix | UJ-settings | R09 | U, E | P1 |
| TC-I18N-007 | Taiwanese terminology spot check on key screens | 退稅, 收據, 護照, 託運, 海關, 手續費 used — not mainland or Japanese-loanword variants | — | R09 | M | P0 |
| TC-I18N-008 | Longest-string fixture per locale at 320 px | No truncation, no overflow, no overlapping controls in either locale | — | R10 | C, E | P0 |
| TC-I18N-009 | Long unbroken CJK shop name and long English shop name | Wraps correctly (CJK line breaking, English `overflow-wrap`); the container grows rather than clipping | — | R10 | C | P0 |
| TC-I18N-010 | Yen formatting in both locales | Integer yen, correct grouping and symbol placement, **no decimals**; identical expected strings pinned per locale | — | R13 | U | P0 |
| TC-I18N-011 | The same total rendered in WebKit and Chromium | Identical string — guards against `Intl` engine differences | — | R13 | E | P0 |

---

## 5. TC-A11Y — Accessibility (WCAG 2.2 AA)

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-A11Y-001 | axe scan on every route, both locales | Zero serious or critical violations | — | R11 | E | P0 |
| TC-A11Y-002 | axe scan with a dialog, sheet, or menu open | Zero serious or critical violations in the open state | — | R11 | E | P0 |
| TC-A11Y-003 | Keyboard-only traversal of the core journey | Every control reachable and operable; logical order; no keyboard trap | — | R11 | E | P0 |
| TC-A11Y-004 | Focus visibility on every interactive element, including on the Japanese-minimal light palette | Visible focus indicator meeting 2.4.11/2.4.13 contrast and size | — | R11 | E, M | P0 |
| TC-A11Y-005 | Open and close a modal | Focus moves in, is trapped, and returns to the trigger on close | — | R11 | C, E | P0 |
| TC-A11Y-006 | Icon-only buttons (add receipt, camera, delete, language) | Each has an accessible name in both locales | — | R11 | C | P0 |
| TC-A11Y-007 | Form validation errors | Programmatically associated with the field, announced, and not conveyed by color alone | — | R11 | C | P0 |
| TC-A11Y-008 | Refund total updates after adding a receipt | Change announced via a live region, not silently repainted | — | R11 | C | P1 |
| TC-A11Y-009 | 200% text size and 320 px width reflow; text-spacing override | No loss of content or function; no horizontal scrolling of the page | — | R11, R10 | E, M | P0 |
| TC-A11Y-010 | Contrast of text, icons, disabled and error states against the final palette | Meets 1.4.3 and 1.4.11 | — | R11 | M | P0 |
| TC-A11Y-011 | Target size of primary controls | ≥ 24×24 CSS px (2.5.8); primary actions comfortably larger for one-handed use with shopping bags | — | R11 | E | P0 |
| TC-A11Y-012 | VoiceOver (iOS) and TalkBack pass on the core journey | Sensible reading order, meaningful names, checklist state announced, no unlabeled images | — | R11 | M | P0 |

---

## 6. TC-PWA — Install, manifest, platform quirks

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-PWA-001 | Manifest validity: name, icons, `start_url`, `scope`, `display`, theme | Valid under the `/kaeru/` base path | — | R18 | E | P0 |
| TC-PWA-002 | Install to home screen on iOS and launch standalone | Launches at the correct route; existing data visible; safe-area insets respected | — | R14 | M | P0 |
| TC-PWA-003 | Install on Android Chrome | Install prompt works; standalone launch retains data | — | R14 | M | P1 |
| TC-PWA-004 | Load the deployed site at `https://sean1093.github.io/kaeru/` | Loads, SW registers under the right scope, no 404 assets, deep links work after a hard reload | — | R18 | E | P0 |
| TC-PWA-005 | Photo capture / file input on iOS Safari with a HEIC image | Accepted and rendered, or rejected with a clear message; never a silent failure | — | R15 | M | P0 |
| TC-PWA-006 | Oversized photo (> 10 MB) | Downscaled or rejected with a clear message; storage quota is not blown | — | R15, R04 | C, M | P0 |
| TC-PWA-007 | Camera permission denied | Receipt can still be saved without a photo; a photo is never required | UJ-receipt | R15 | C, E | P0 |

---

## 7. TC-SEC — Privacy

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-SEC-001 | Network monitoring across the whole E2E suite | Zero requests to any origin other than the app's own; no fonts, analytics, or beacons | — | R17 | E | P0 |
| TC-SEC-002 | Inspect stored data after a full journey | No field contains a full passport number; only the permitted partial identifier, if any | — | R17 | E | P0 |
| TC-SEC-003 | URLs and history during the journey | No personal data in query strings or hashes | — | R17 | E | P1 |
| TC-SEC-004 | Export file contents | Contains only what the user entered; documented and readable; no hidden identifiers | UJ-backup | R17 | U | P1 |

---

## 8. TC-UX — Flow-level checks

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-UX-001 | First run with no data | Onboarding explains the 2026-11-01 change and leads to trip setup; no empty dashboard with no way forward | UJ-onboarding | — | E | P0 |
| TC-UX-002 | Log a receipt from the dashboard | Completed in under 20 seconds with default values, measured on the `pixel-chromium` project | UJ-receipt | — | E | P0 |
| TC-UX-003 | Deadline approaching (receipt expiring within 7 days) | Surfaced prominently on the dashboard with the exact date, not only "soon" | DR-deadline | R03 | C, E | P0 |
| TC-UX-004 | Mark a refund as received after returning home | State changes, totals update, history retained | UJ-tracking | — | E | P1 |

---

## 9. Maintenance

- Requirement IDs (`DR-0NN`, `UJ-0NN`) are filled in exactly once `domain-rules.md` and `user-journey.md` are merged; the placeholder names above (`DR-threshold`, `UJ-airport`) map one-to-one to them.
- Every new feature issue adds or updates cases here before implementation starts; the PR that implements it references the case IDs.
- A production bug that no case covered adds a case here as part of the fix, with the `regression` label on the issue.
