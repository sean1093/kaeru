# Kaeru — Initial Test Cases

| | |
|---|---|
| Status | v1.0 (M0) |
| Date | 2026-10-05 |
| Owner | Senior QA |
| Tracking | Issue #5 |
| Derived from | [domain-rules.md](../product/domain-rules.md) (`DR-0nn`, `UR-nn`), [user-journey.md](../product/user-journey.md) (`UJ-0nn`) |
| Strategy | [test-strategy.md](./test-strategy.md) (risks `R0n`) |

High-level cases written at M0, before implementation. They are the contract for what M1 and M2 automation must cover, not the code itself. Every case cites the requirement it protects and the risk it mitigates.

**Level** — U: unit (pure domain) · S: unit (storage, `fake-indexeddb`) · C: component · E: Playwright E2E · M: manual.
**Pri** — P0: automated before the owning feature merges · P1: before the milestone exits · P2: best effort.
**`@unconfirmed`** — the case depends on a rule whose status is not `confirmed-official` (`pending-legislation`, `reported-media`, `unconfirmed`, or a `UR-nn` entry). These run but do not block a merge; they become blocking when the rule is confirmed. They are also the cases most likely to *change*, so each one asserts behavior **driven by rules data**, never a hard-coded constant.

**Automated test titles start with the case ID**, e.g. `TC-DOM-011 rejects a tax-excluded total of 4,999 yen`, so a CI failure maps straight back to a rule.

Counts are at the end of the document.

---

## 1. TC-DOM — Domain rules

Pure functions. No DOM, no storage, no network, injected `Clock`, explicit time zone. These are the cases that stop a traveler from losing money.

### 1.1 Which system applies (DR-001 – DR-003)

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-001 | `purchaseDate` 2026-10-31 | Old system: no kiosk step, excluded from Airport Mode, labelled as old-system | DR-001, DR-003 | R01 | U | P0 |
| TC-DOM-002 | `purchaseDate` 2026-11-01 | Refund method applies | DR-001 | R01 | U | P0 |
| TC-DOM-003 | One trip containing both a 2026-10-31 and a 2026-11-01 receipt | Each receipt is resolved independently; there is no transitional blend and no trip-level system flag | DR-001, DR-002 | R01 | U | P0 |
| TC-DOM-004 | Device timezone Asia/Taipei, local 2026-10-31 23:30 (= 2026-11-01 00:30 JST); user logs "today" | Default `purchaseDate` is the **JST** calendar date 2026-11-01, visibly shown and editable | DR-002, UR-07 | R12 | U | P0 `@unconfirmed` |
| TC-DOM-005 | System choice driven by departure date or by logging date | Must not happen: changing `trip.departureDate` or logging later never changes which system a receipt falls under | DR-002 | R01 | U | P0 |
| TC-DOM-006 | Eligibility rules encountered in the UI | Informational only — no eligibility input ever blocks a save | DR-005, DR-006, DR-007, DR-008 | — | C | P1 |

### 1.2 Threshold and eligible goods (DR-010 – DR-019)

Basis: tax-**excluded** total, same shop, same JST calendar day, one combined total (the general-goods / consumables split is abolished).

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-011 | Tax-excluded total ¥4,999 | Does not qualify; indicator says ¥1 more is needed | DR-010 | R02 | U | P0 |
| TC-DOM-012 | Tax-excluded total ¥5,000 | Qualifies — the boundary is inclusive | DR-010 | R02 | U | P0 |
| TC-DOM-013 | Tax-excluded total ¥5,001 | Qualifies | DR-010 | R02 | U | P0 |
| TC-DOM-014 | Tax-**included** ¥5,000 at 10% (tax-excluded ¥4,545) | Does **not** qualify — the common traveler misconception must not become a bug | DR-010, DR-011 | R02 | U | P0 |
| TC-DOM-015 | Tax-included ¥5,500 at 10% (tax-excluded ¥5,000) | Qualifies, and the result is marked as an **estimate** because the tax-excluded figure is derived | DR-011, DR-022 | R02 | U | P0 |
| TC-DOM-016 | Tax-included ¥5,400 at 8% (tax-excluded ¥5,000) | Qualifies, marked as an estimate | DR-011, DR-023 | R02 | U | P0 |
| TC-DOM-017 | Grouping key for the threshold indicator | Groups by `(shopName, purchaseDate, travelerId)`; two travelers at one shop on one day do not combine | DR-012, UR-01 | R02, R16 | U | P0 `@unconfirmed` |
| TC-DOM-018 | Two receipts, same shop, same day, same traveler: ¥3,000 + ¥2,500 tax-excluded | Aggregate ¥5,500 shown **and** the per-receipt figures shown; copy states that aggregation depends on the shop and never promises it | DR-012, UR-02, UJ-007 | R02 | U, C | P0 `@unconfirmed` |
| TC-DOM-019 | Two receipts, same shop, **different days** | No aggregation | DR-012 | R02 | U | P0 |
| TC-DOM-020 | Two receipts, **different shops**, same day | No aggregation | DR-012 | R02 | U | P0 |
| TC-DOM-021 | A post-reform receipt | No general-goods / consumables category exists on the model or in the UI | DR-013 | R01 | U, C | P0 |
| TC-DOM-022 | Tax-excluded total ¥700,000 | Qualifies — there is no upper limit and no ¥500,000 consumables cap | DR-014 | R01 | U | P0 |
| TC-DOM-023 | Any quantity of goods | No numeric quantity limit is implemented or displayed | DR-015 | R01 | U | P0 |
| TC-DOM-024 | Line with tax-excluded unit price ¥999,999 | No high-value flag | DR-016 | R01 | U | P0 |
| TC-DOM-025 | Line with tax-excluded unit price ¥1,000,000 | `hasHighValueItem` set — the boundary is inclusive — and the documents reminder appears | DR-016, UJ-020 | R01 | U, C | P0 |
| TC-DOM-026 | Alex's ¥1,280,000 watch at 10% | `hasHighValueItem` true; estimated tax ¥128,000; documents reminder raised the night before departure | DR-016, UJ-020 | R01 | U, E | P0 |
| TC-DOM-027 | Excluded goods: gold/platinum bullion, gold/platinum coins, goods not subject to consumption tax | Guide states the exclusion; marking a receipt as such routes it to `not_claiming`, never to a false refund estimate | DR-017 | R01 | U, C | P1 |
| TC-DOM-028 | Receipt marked "I will use this in Japan" | Warned at logging time that it will not be refundable; advice tone, never a block | DR-018, UJ-008 | R01 | C | P0 |
| TC-DOM-029 | Separate shipment (別送) / direct shipping (直送) | Not modelled anywhere in the app; no UI offers it | DR-019 | — | U | P2 |
| TC-DOM-030 | Two tenant shops inside one department store, same day, ¥3,000 + ¥2,500 | Each tenant is its own shop; no aggregation. The guide notes the uncertainty | DR-012, UR-09 | R02 | U | P1 `@unconfirmed` |

### 1.3 Tax arithmetic and refund estimation (DR-020 – DR-027)

Worked examples are taken verbatim from `domain-rules.md` §4 and are hard assertions.

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-031 | Tax-excluded ¥6,480 at 10% | tax ¥648; tax-included ¥7,128 | DR-021 | R01 | U | P0 |
| TC-DOM-032 | Tax-included ¥7,128 at 10% | tax-excluded ¥6,480; tax ¥648 | DR-021 | R01 | U | P0 |
| TC-DOM-033 | Tax-included ¥1,080 at 8% | tax-excluded ¥1,000; tax ¥80 | DR-021 | R01 | U | P0 |
| TC-DOM-034 | Tax-included ¥1,000 at 8% | tax-excluded ¥925 (floor of 925.925…); tax ¥75; `amountsAreDerived == true` | DR-021, DR-022, DR-024 | R01, R13 | U | P0 |
| TC-DOM-035 | Rounding direction on every non-divisible amount | `DR-024` is a **direction, not an operation**: round so the figure understates what reaches the traveller. Amounts paid to the user are floored; **deductions are ceiled**, because flooring a fee inflates the net. An implementation that floors everything fails this case just as surely as one that ceils everything | DR-024 | R01 | U | P0 |
| TC-DOM-036 | **Property:** for all integer tax-included amounts 1…2,000,000 at each configured rate | `taxExcluded + tax == taxIncluded`, both non-negative integers, `taxExcluded == floor(incl × 100/(100+r))` | DR-021, DR-024 | R01 | U | P0 |
| TC-DOM-037 | Mixed receipt ¥3,000 @ 8% + ¥2,500 @ 10%, tax-excluded | tax ¥240 + ¥250 = ¥490; threshold total ¥5,500 qualifies. A single blended rate applied to ¥5,500 fails this case | DR-020, DR-010 | R01 | U | P0 |
| TC-DOM-038 | A receipt holding two lines at the same rate | Rejected by **form validation**, not by the arithmetic: summing two 10% lines is not wrong, it is a model the form should not produce. Owned by #40, not by the money module | DR-020 | R01 | C | P1 |
| TC-DOM-039 | Receipt prints its own tax amount and the user enters it | The printed figure wins over Kaeru's calculation; `amountsAreDerived == false` | DR-022 | R01 | U | P0 |
| TC-DOM-040 | `lineAmountsOf` sets `derived` | True on every path where Kaeru computed a figure, false when the receipt's own printed amounts are present. This is the signal the label is computed from, so it is the half that has to be right | DR-022 | R01 | U | P0 |
| TC-DOM-040a | Any derived figure shown in the UI | Labelled as an estimate wherever it appears — total, receipt, threshold indicator. Rendering, owned by #41; the domain supplies `derived` (`TC-DOM-040`) and the screen supplies the word | DR-022 | R01 | C, E | P0 |
| TC-DOM-041 | Food line, tax-included ¥1,010, `purchaseDate` 2027-04-02 | Rate **1%** → tax-excluded ¥1,000, tax ¥10. Not ¥75 | DR-023, UR-08 | R01 | U | P0 `@unconfirmed` |
| TC-DOM-042 | Food line dated 2027-03-31 vs 2027-04-01 | 8% on 2027-03-31, 1% on 2027-04-01 — rate resolution is by `purchaseDate`, inclusive on the effective-from day | DR-023, UR-08 | R01, R03 | U | P0 `@unconfirmed` |
| TC-DOM-043 | Food line dated 2029-03-31 vs 2029-04-01 | 1% then back to 8% at the end of the window | DR-023, UR-08 | R01 | U | P0 `@unconfirmed` |
| TC-DOM-044 | Newspaper-on-subscription line during 2027-04-01…2029-03-31 | Stays at 8% while food drops to 1% | DR-023 | R01 | U | P1 `@unconfirmed` |
| TC-DOM-045 | Rate table is data, not code | Adding, retiring or re-dating a rate requires no change under `src/domain` beyond the data file; a test drives the resolver from a fixture rate table | DR-023, DR-022 | R19 | U | P0 |
| TC-DOM-046 | Gross refund for a trip | `grossRefund = Σ tax(line)` across all claimable receipts, per traveler and in total | DR-025 | R01, R16 | U | P0 |
| TC-DOM-047 | Operator fee known (e.g. Tourego 1.5%) | `estimatedNet = gross − operatorFee − receivingSideCharges`; fee shown separately with its observation date. Every percentage fee carries an explicit **basis** (`DR-026a`) — 1.5% of the refund and 1.5% of the tax-excluded sale are different numbers, and a percentage with no basis is not a fee we can compute | DR-025, DR-026, DR-026a, DR-051, UJ-014 | R01 | U | P0 `@unconfirmed` |
| TC-DOM-047a | Operator catalog entry whose fee basis is unknown | Stored as `fees: []`, not as a percentage with a guessed basis. The payout then reports an unknown net rather than a confident wrong one (`TC-DOM-048`) | DR-026a, DR-051 | R01, R19 | U | P0 |
| TC-DOM-048 | Operator unknown or fee unknown | Gross shown **and** net stated as unknown. Gross is never presented as the amount that will arrive, and an unknown fee is never treated as zero | DR-025, DR-051, UJ-014 | R01 | U, C | P0 |
| TC-DOM-049 | `estimatedNet` at or below zero (¥1,100 tax, NT$40 operator fee, NT$400 inbound FX fee) | Warning that the refund may be worth less than the cost of receiving it | DR-027, UJ-014 | R01 | U, C | P0 `@unconfirmed` |
| TC-DOM-050 | **Property:** trip totals equal the sum of per-traveler partitions, for 100 seeded receipt sets | Aggregation is partition-stable; no cross-traveler leakage | DR-004, DR-025 | R16 | U | P0 |
| TC-DOM-051 | Dashboard segmentation | Tax paid / expecting refund / confirmed / received / lost are distinct figures. No single blended number that mixes states | DR-025, UJ-016, UJ-036 | R01 | U, C | P0 |
| TC-DOM-052 | Rules data `lastReviewed` older than 180 days | A **weekly scheduled** workflow reports it and opens an issue. It is deliberately not part of the pull-request pipeline, so a stale review date never reds a PR on a day nobody pushed | DR-022, DR-051 | R19 | U | P1 |
| TC-DOM-053 | The ¥5,000 threshold, the 90-day window or the 2026-11-01 start changed in the rules data without the guide prose changing | Guardrail suite fails and names both files. The guide keeps literal prose in both languages — the numbers are asserted against the resolved rules behind an explicit allowlist, not interpolated into two grammars | DR-010, DR-023, DR-031 | R19 | U | P0 |

### 1.4 Deadline, dates, timezone (DR-031, UR-07)

Formula: `deadline = purchaseDate + 90 calendar days`, deadline day inclusive. Official vector: 2026-11-01 → 2027-01-30.

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-055 | Purchase 2026-11-01 | Deadline **2027-01-30** (the National Tax Agency's own worked example) | DR-031 | R03 | U | P0 |
| TC-DOM-056 | Purchase 2026-11-01, customs on 2027-01-30 | Within the window — the deadline day itself is valid | DR-031 | R03 | U | P0 |
| TC-DOM-057 | Purchase 2026-11-01, customs on 2027-01-31 | Expired by one day; receipt flagged and excluded from the expected refund | DR-031 | R03 | U | P0 |
| TC-DOM-058 | Purchase 2026-11-01, customs on 2026-11-02 | Within the window | DR-031 | R03 | U | P0 |
| TC-DOM-059 | Purchases on 2026-12-31, 2027-02-27, 2028-02-28 (leap year), 2028-12-02 | Calendar-correct across month lengths, year boundaries and a leap day | DR-031 | R03 | U | P0 |
| TC-DOM-060 | **Property:** 500 seeded purchase dates | Deadline is always exactly `purchaseDate + 90` days, always ≥ the purchase date, and identical under `TZ=UTC`, `TZ=Asia/Taipei`, `TZ=Asia/Tokyo`, `TZ=Pacific/Kiritimati` | DR-031, UR-07 | R03, R12 | U | P0 |
| TC-DOM-061 | Each receipt in a trip has its own deadline | No trip-level deadline exists; the earliest is surfaced, not substituted | DR-031 | R03 | U | P0 |
| TC-DOM-062 | `exportDeadline` **strictly before** `trip.departureDate` | `DR-076`: prominent warning. The receipt cannot be confirmed — the refund is already lost | DR-076, UJ-021 | R03 | U, C | P0 |
| TC-DOM-062a | `exportDeadline` falls **exactly on** `trip.departureDate` | `DR-076a`, **not** `DR-076` and **not** silent: the window is inclusive so the receipt is valid, but it has zero margin. Quiet warning, worded as "this receipt's deadline is your departure day", never "this will expire". Not an exotic input: Taiwan passport holders get 90 days visa-free and 短期滞在 caps at 90 days, so buying on arrival day and leaving on the last permitted day hits this exactly | DR-076a, DR-031 | R03 | U, C | P0 |
| TC-DOM-062b | Deadline 1, 2, 3 and 4 days after departure, `deadlineSlackWarnDays` at its default of 3 | Quiet at +1, +2 and +3; **silent** at +4. The boundary is read from the deadline rules data, never from a literal | DR-076a | R03, R19 | U | P0 |
| TC-DOM-062c | A screen rendering a deadline finding, across every member of `DeadlineRisk` | `missed` and `no_margin` read as **different sentences**, not one sentence at a different severity — one says the refund is already lost, the other says there is no room if the plan changes. The domain does **not** emit copy keys: `ui/contracts.ts` takes translated strings, and a domain with opinions about keys reaches into a layer it cannot see. The guarantee comes from the union instead — the screen switches **exhaustively** on `risk`, so a shared sentence is something someone has to write on purpose rather than something that happens by default. Owned by #35 and #43, where the copy lives | DR-076, DR-076a | R03, R09 | C | P0 |
| TC-DOM-062d | Old-system receipt (`purchaseDate <= 2026-10-31`), any departure date | The deadline finding is `not_applicable`, **never `'none'`**. `'none'` is a claim about a deadline and this receipt does not have one: `DR-031`'s window is a refund-method rule that does not apply to it at all. A screen must not render a reassuring "deadline fine" state for a receipt that was never in the game — that is the one thing S29 exists to deny. Same family as `fees: []` meaning unknown rather than zero: *"we checked and it is fine"* and *"there is nothing to check"* look identical on a screen and license opposite conclusions | DR-003, DR-064, DR-031, UJ-038 | R01, R03 | U, C | P0 |
| TC-DOM-063 | Ordinary five-day trip, roughly 85 days of slack | Silent. `DR-076a` can only fire on a near-maximum stay, which is exactly when it is informative; a warning that fires on every trip is noise | UJ-021, DR-076a | — | E | P1 |
| TC-DOM-064 | Days-remaining computed at 23:59 and 00:01 device-local | Changes by exactly one at the calendar-day boundary, never by zero or two | DR-031, UR-07 | R12 | U | P0 |
| TC-DOM-065 | A stored date reloaded with the device timezone changed from Asia/Taipei to Asia/Tokyo | Calendar date unchanged — dates persist as calendar dates, never as UTC instants | DR-002, UR-07 | R12, R04 | S | P0 |
| TC-DOM-066 | E2E with Playwright `timezoneId` Asia/Taipei, Asia/Tokyo, UTC, Pacific/Kiritimati | Deadline, countdown and default purchase date render identically in all four | UR-07 | R12 | E | P0 |

### 1.5 Customs, departure, airport rules (DR-030, DR-032 – DR-039)

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-070 | A receipt with one item missing, consumed or given away | The **whole receipt** is unrefundable — no partial refund of a receipt, including the items still present | DR-030 | R01 | U | P0 |
| TC-DOM-071 | Partial-refund arithmetic attempted on a receipt | Must not exist: no code path produces a per-item refund for a partially present receipt | DR-030 | R01 | U | P0 |
| TC-DOM-072 | Receipt with `packingLocation == checked_bag` on departure day | Prominent warning; raised in the packing plan and as the hard gate in Airport Mode | DR-032, DR-077, UJ-017, UJ-024 | R05 | U, E | P0 |
| TC-DOM-073 | Receipt with `packingLocation == unknown` | Treated as at risk, same as `checked_bag`, not as safe | DR-032, UJ-017 | R05 | U | P0 |
| TC-DOM-074 | Departure time recommendation and the buffer setting | `flightTime − airline check-in requirement − buffer`; buffer defaults to 60 minutes, is user-adjustable in settings, and is always labelled as Kaeru's recommendation, never an official figure | DR-032, UR-03, UJ-003, UJ-022 | — | U, C | P0 `@unconfirmed` |
| TC-DOM-075 | Alex: 07:45 flight, 60-min check-in, 60-min buffer | **05:45**, asserted exactly. `UJ-022`'s walkthrough says 04:50, which silently folds in his hotel-to-airport journey — Kaeru does not know where the traveller is sleeping, and a number with an invented travel estimate inside it is unauditable in exactly the way `DR-032` warns against. A screen may add travel time the user supplies; the domain returns `flightTime − checkInMinutes − airportBufferMinutes` and nothing else | UJ-022, DR-032 | — | U | P0 |
| TC-DOM-076 | Connecting itinerary with a domestic leg | The procedure airport is the **final** airport of departure from Japan, named explicitly | DR-037, UJ-025 | R05 | U, C | P0 |
| TC-DOM-077 | Guidance on terminal location | States international departure lobby, landside, **before** baggage drop — not after security, not at the gate | DR-033, UJ-025 | R05 | C | P0 |
| TC-DOM-078 | Trip departing from Narita, Haneda, Kansai, Chubu, Fukuoka, New Chitose or Naha vs any other airport | Visit Japan Web is mentioned as an alternative only for those seven, with the before-security Wi-Fi-area constraint; never shown elsewhere | DR-033, UJ-028 | — | U, C | P0 |
| TC-DOM-079 | Red kiosk result | Presented as a routing decision with instructions, never as an error or a failure state; no probability is stated or implied anywhere | DR-034, UR-04, UJ-029 | — | C | P0 |
| TC-DOM-080 | Receipt whose consumables were consumed in Japan | Routed to a **customs officer at the counter**, never to the kiosk | DR-035, UJ-030 | R01 | U, C | P0 |
| TC-DOM-081 | Refund timing | No "overdue" figure is presented as a fact; the threshold is a user preference and is labelled as one | DR-036, UJ-035 | — | U, C | P1 |
| TC-DOM-082 | Copy about who pays | Never states or implies that the Japanese government pays, or that Kaeru or the state vouches for any operator | DR-039, DR-053 | — | M | P0 |
| TC-DOM-083 | Copy about confirmed goods | Never suggests keeping customs-confirmed goods in Japan | DR-038 | — | M | P1 |
| TC-DOM-084 | Traveler with no claimable receipt | Airport Mode shows "nothing to do", not an empty list | DR-079 | — | C, E | P1 |

### 1.6 Status lifecycle and validation (DR-060 – DR-080)

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DOM-090 | `logged → registered` without an `operatorId` | Rejected; registration requires an operator | DR-060b | — | U | P0 |
| TC-DOM-091 | `customs_confirmed` attempted while `allItemsPresent == false` | Rejected; the receipt must go to `rejected` or `not_claiming` first | DR-061, DR-030 | R01 | U | P0 |
| TC-DOM-092 | `customs_confirmed` reached | `refund_pending` is entered automatically | DR-060d | — | U | P0 |
| TC-DOM-093 | `amountReceived` recorded | `refunded`; expected vs actual and the implied fee are shown | DR-060e, UJ-034 | R01 | U, C | P0 |
| TC-DOM-094 | Every state transition in the diagram, and every transition **not** in it | Permitted set matches §6 exactly; an undefined transition is refused | DR-060a–h | — | U | P0 |
| TC-DOM-095 | Any state reversed (the user mis-taps in an airport queue) | Every state is reversible with no data loss | DR-063 | R04 | U, E | P0 |
| TC-DOM-096 | Any status displayed | Never presented as independently verified; always "you said" framing | DR-062 | — | C | P0 |
| TC-DOM-097 | Old-system receipt | May go `logged → not_claiming` with reason `old_system`; never enters `customs_confirmed` | DR-064, DR-003 | R01 | U | P0 |
| TC-DOM-098 | `not_claiming` from each pre-refund state, with a reason | Allowed from any pre-refund state, with no nagging and no assertion that skipping the kiosk is permitted; reason recorded and surfaced in the trip summary | DR-060h, UR-10, UJ-036 | — | U | P1 `@unconfirmed` |
| TC-DOM-099 | Line with neither `taxExcludedAmount` nor `taxIncludedAmount` | Save blocked | DR-070 | R01 | U, C | P0 |
| TC-DOM-100 | Negative amount, or a non-integer amount such as 1000.5 | Save blocked; yen is an integer and no float arithmetic exists in the money path | DR-071 | R01, R13 | U | P0 |
| TC-DOM-101 | 1% line dated 2027-03-31 | Save blocked — the rate does not exist in the rate table for that purchase date | DR-072, DR-023 | R01 | U | P0 `@unconfirmed` |
| TC-DOM-102 | `purchaseDate` in the future relative to JST today | Warn, allow | DR-073 | — | U, C | P1 |
| TC-DOM-103 | `purchaseDate` after `trip.departureDate` | Warn, allow | DR-074 | — | U, C | P1 |
| TC-DOM-104 | Shop/day group below ¥5,000 | Informs, **never blocks** the save | DR-075, DR-010 | R02 | U, C | P0 |
| TC-DOM-105 | High-value receipt with no documents acknowledgement on departure day | Warn | DR-078, UJ-020 | — | U | P1 |
| TC-DOM-106 | Any validation rule across the app | No validation rule blocks something the law permits; only DR-070/071/072 block a save | DR-080 | — | U | P0 |

---

## 2. TC-DATA — Storage, migration, export and import

`fake-indexeddb` at unit level; real IndexedDB in E2E.

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-DATA-001 | Save a receipt, reload | Present and identical, including derived flags and status | UJ-005 | R04 | S, E | P0 |
| TC-DATA-002 | Yi-chun's data shape: 14 receipts, 4 operators, 2 travelers, mixed rates | All persisted; per-traveler and trip totals correct | UJ-016 | R04 | S | P0 |
| TC-DATA-003 | 300 receipts | All persisted; list and totals render within budget | — | R04 | S | P1 |
| TC-DATA-004 | Schema migration v1 → v2 on a populated database | Every record migrated, no field lost, version bumped once, idempotent on re-run | — | R04 | S | P0 |
| TC-DATA-005 | Opening a **newer** database with an older build | Refuses to downgrade-migrate, shows a recoverable message, deletes nothing | — | R04 | S | P0 |
| TC-DATA-006 | Transaction aborts mid-write | No partial record; prior state intact; the user sees a save failure, not a silent success | — | R04 | S | P0 |
| TC-DATA-007 | `QuotaExceededError` on write | Clear error; data uncorrupted; user prompted to export or drop photos | DR-042 | R04, R07 | S, C | P0 |
| TC-DATA-008 | Two tabs writing concurrently | Deterministic resolution or a surfaced conflict; never a corrupt record | — | R04 | S | P1 |
| TC-DATA-009 | IndexedDB unavailable (Private Browsing / blocked) | Explicit message, no blank screen, no unhandled rejection | — | R07 | C, E | P0 |
| TC-DATA-010 | `navigator.storage.persist()` requested | Request made at a sensible moment; outcome reflected on the data/privacy screen | — | R07 | E | P1 |
| TC-DATA-011 | Export | Valid versioned JSON containing travelers, receipts, lines, operators, settings | UJ-037, DR-043 | R08 | U, E | P0 |
| TC-DATA-012 | Export with photos not opted in, and with photos opted in | Photos included **only** on explicit opt-in | DR-042 | R17 | U, E | P0 |
| TC-DATA-013 | **Property:** export → import into an empty profile → export, for 100 seeded data sets | The two parsed documents are **deep-equal ignoring the volatile envelope fields** `exportedAt` and `appVersion`. Byte equality is explicitly not the assertion — it would fail on every run | UJ-037 | R08 | U | P0 |
| TC-DATA-014 | Import a previous-schema export | Migrated and imported; nothing lost | DR-043 | R08 | U | P0 |
| TC-DATA-015 | Import a truncated or syntactically invalid file | Rejected with a specific error; **existing data untouched** | DR-043 | R08 | U, E | P0 |
| TC-DATA-016 | Import a well-formed file with an unknown future version | Rejected clearly; existing data untouched | DR-043 | R08 | U | P0 |
| TC-DATA-017 | Import a file that violates §7 validation (negative amount, 1% line dated 2026-12-01, unknown status) | Rejected or quarantined per record with a report; no invalid record is persisted | DR-043, DR-070–072 | R08 | U | P0 |
| TC-DATA-018 | **Adversarial import:** a record carrying a full 9-character passport number in any field, including an unknown extra field | Rejected or stripped; no full passport number is ever persisted | DR-041, DR-043 | R17 | U | P0 |
| TC-DATA-019 | `passportRef` longer than 4 characters, by input or by import | Truncated or rejected; at most the last 4 characters are stored | DR-041 | R17 | U, C | P0 |
| TC-DATA-020 | Import into a non-empty profile | Merge or replace is an explicit choice; replace requires confirmation and is never the default | UJ-037 | R08 | E | P0 |
| TC-DATA-021 | Delete all data | Requires confirmation; storage afterwards is genuinely empty, verified by inspection rather than by the UI | UJ-037 | R04 | E | P1 |
| TC-DATA-022 | Storage cleared out of band (iOS 7-day eviction simulation) | App starts clean without an error loop; the user has been warned that local-only data can be evicted and prompted to export | DR-040 | R07 | E, M | P0 |
| TC-DATA-023 | Any network request to a server for user data | Must not exist — all data is on-device | DR-040 | R17 | E | P0 |

---

## 3. TC-AIR — Airport Mode, offline, service worker

Run against the production build with the service worker active. Airport Mode has **no network call on its critical path**.

**Shared precondition for every offline case below:** the worker is registered with `registerType: 'prompt'` and `clientsClaim: false` (ADR 0007), so the first load is uncontrolled by design. Each test installs the worker, reloads once so the page is controlled, and only then goes offline.

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-AIR-001 | Installed, offline (`context.setOffline(true)`), cold start | App shell loads fully; no network error screen | UJ-023 | R05 | E | P0 |
| TC-AIR-002 | Offline cold start on a **deep link** to Airport Mode | Route resolves from cache; no 404, no redirect to home | UJ-023 | R05 | E | P0 |
| TC-AIR-003 | Complete the whole airport sequence offline, UJ-024 → UJ-031 | Every step reachable and completable; progress survives an offline reload and backgrounding the app | UJ-023–UJ-031 | R05 | E | P0 |
| TC-AIR-004 | Log a new receipt offline | Saved locally, counted in totals, survives reload | UJ-005 | R05 | E | P0 |
| TC-AIR-005 | Switch language offline | Full UI switches; no catalog fetched over the network | — | R05, R09 | E | P0 |
| TC-AIR-006 | View a receipt photo offline | Renders from local storage | UJ-009 | R05 | E | P1 |
| TC-AIR-007 | Back online after offline edits | No duplication, no loss, no refetch overwriting local data | — | R05 | E | P0 |
| TC-AIR-008 | Guide and operator directory offline | Content available; external operator links shown as unavailable rather than failing silently | UJ-012, DR-052 | R05 | E | P1 |
| TC-AIR-009 | **The hard gate.** A receipt is still `checked_bag` or `unknown` | Airport Mode refuses to advance past UJ-024 until each is resolved; the override is friction-ful, never a silent dismissal | UJ-024, DR-032 | R05 | E | P0 |
| TC-AIR-010 | "Do not check your bags yet" state | Persists across every Airport Mode screen; cleared **only** when every traveler is marked done at UJ-031 | UJ-026, UJ-031 | R05 | E | P0 |
| TC-AIR-011 | User attempts to mark check-in done before customs is complete | Kaeru explains exactly what they are about to lose, in both languages | UJ-026 | R05 | E | P0 |
| TC-AIR-012 | Two travelers with separate checklists | Independent lists and independent completion; no cross-attribution; each can be handed over separately | UJ-019, UJ-027, DR-004 | R16 | E | P0 |
| TC-AIR-013 | A receipt that cannot be ticked during UJ-027 | Moves to `not_claiming` with a reason **before** the kiosk, and disappears from the kiosk list | UJ-027, DR-061 | R01 | E | P0 |
| TC-AIR-014 | Green result | Traveler marked done | UJ-029 | — | E | P0 |
| TC-AIR-015 | Red result | Calm, specific instructions; the per-receipt rule restated; no error styling, no probability claim | UJ-029, DR-034 | — | E | P0 |
| TC-AIR-016 | Consumed-goods receipt in Airport Mode | Routed to the customs counter, never to the kiosk | UJ-030, DR-035 | R01 | E | P0 |
| TC-AIR-017 | Old-system receipt (purchased ≤ 2026-10-31) | Absent from every Airport Mode checklist, labelled as old-system elsewhere | DR-003 | R01 | E | P0 |
| TC-AIR-018 | Expired receipt in Airport Mode | Marked expired and excluded from the amount the traveler expects | DR-031 | R03 | E | P0 |
| TC-AIR-019 | Countdown to the "leave for check-in" time | Updates offline; when short, states honestly that abandoning an inspection counts as no confirmation and that a missed flight is not compensated. The app never decides what to drop | UJ-032, DR-032 | — | E | P0 |
| TC-AIR-020 | Service worker update: load build A, serve build B, reload | New build active (asset hash changed); stored data intact | — | R06 | E | P0 |
| TC-AIR-021 | Update available while the app is open | Non-intrusive affordance; accepting reloads into the new build; declining does not break the session | — | R06 | E | P0 |
| TC-AIR-022 | A rules-data change shipped in a new build (e.g. the 1% rate) | Reaches an already-installed client after one update cycle; no stale rate is applied to a new purchase date | DR-023, UR-08 | R06, R19 | E | P0 `@unconfirmed` |
| TC-AIR-023 | Offline on `iphone-webkit` specifically | Full offline suite passes on WebKit, not only on Chromium | — | R05 | E | P0 |

---

## 4. TC-I18N — Localization and parity

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-I18N-001 | Compare the zh-TW and en catalogs | Identical key sets in both directions; no missing, no extra | — | R09 | U | P0 |
| TC-I18N-002 | Every catalog value | No empty string, no placeholder, no value identical to its key | — | R09 | U | P0 |
| TC-I18N-003 | Interpolation placeholders per key | Same placeholder set in both locales | — | R09 | U | P0 |
| TC-I18N-004 | Crawl every route in both locales | No raw i18n key visible anywhere | — | R09 | E | P0 |
| TC-I18N-005 | Language switch on every main route | Entire page switches including dates, numbers and `<html lang>`; the choice persists across reload and works offline | — | R09 | E | P0 |
| TC-I18N-006 | First visit with browser language zh-TW, zh-Hant, zh-Hans, ja, en | zh-Hant family → zh-TW, everything else → en; never a half-translated mix | — | R09 | U, E | P1 |
| TC-I18N-007 | Terminology spot check on key screens | 退稅, 收據, 護照, 託運, 海關, 手續費 — Taiwan usage, not mainland or Japanese-loanword variants | — | R09 | M | P0 |
| TC-I18N-008 | Operator names rendered | Uses the `name.zh-TW` / `name.en` values from the operator catalog, never the Japanese legal name as a fallback | DR-051 §8 | R09 | C | P1 |
| TC-I18N-009 | Longest-string fixture per locale at 320 px | No truncation, no overflow, no overlapping controls in either locale | — | R10 | C, E | P0 |
| TC-I18N-010 | Long unbroken CJK shop name ("松本清薬粧店新宿東口駅前店") and long English shop name | Correct CJK line breaking and English `overflow-wrap`; the container grows, never clips | — | R10 | C | P0 |
| TC-I18N-011 | Yen formatting in both locales | Integer yen, correct grouping and symbol placement, **no decimals**; expected strings pinned per locale | DR-071 | R13 | U | P0 |
| TC-I18N-012 | ¥1,280,000 rendered in WebKit and in Chromium | Identical string — guards against `Intl` engine differences | — | R13 | E | P0 |
| TC-I18N-013 | Dates rendered in both locales | Unambiguous in both; the 2027-01-30 deadline is never rendered in a format a reader could misread as 2027-30-01 | DR-031 | R03, R12 | C | P0 |
| TC-I18N-014 | Warning and "estimate" copy | The hedge survives translation — the zh-TW string is as explicitly non-committal as the en one, reviewed by the travel expert | DR-022, DR-053 | R19 | M | P0 |
| TC-I18N-015 | Any confirmation, warning or leave prompt the product shows | Rendered by the app in the active locale. **No native `confirm`, `alert`, `prompt` or `beforeunload` dialog exists anywhere**, because a native dialog renders its buttons in the OS language — a zh-TW user would see "Leave site? / OK / Cancel" in English regardless of the app locale, on the one surface i18n cannot reach | — | R09 | U | P0 |

---

## 5. TC-A11Y — Accessibility (WCAG 2.2 AA)

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-A11Y-001 | axe on every route, both locales | Zero serious or critical violations | — | R11 | E | P0 |
| TC-A11Y-002 | axe with a dialog, sheet or menu open | Zero serious or critical violations in the open state | — | R11 | E | P0 |
| TC-A11Y-003 | Keyboard-only traversal of the core journey and of Airport Mode | Every control reachable and operable, logical order, no keyboard trap | — | R11 | E | P0 |
| TC-A11Y-004 | Focus visibility on the Japanese-minimal light palette | Visible indicator meeting 2.4.11 and 2.4.13 | — | R11 | E, M | P0 |
| TC-A11Y-005 | Open and close a modal | Focus moves in, is trapped, returns to the trigger on close | — | R11 | C, E | P0 |
| TC-A11Y-006 | Icon-only controls (add receipt, camera, delete, language, traveler switch) | Each has an accessible name in both locales | — | R11 | C | P0 |
| TC-A11Y-007 | Validation messages (DR-070 – DR-078) | Programmatically associated with the field, announced, never conveyed by color alone | DR-070–078 | R11 | C | P0 |
| TC-A11Y-008 | Totals update after adding a receipt | Announced via a live region, not silently repainted | UJ-016 | R11 | C | P1 |
| TC-A11Y-009 | Airport Mode checklist state changes | Each tick is announced; the hard-gate block states *why* it is blocked, not just that it is | UJ-024, UJ-027 | R11 | C, E | P0 |
| TC-A11Y-010 | 200% text size, 320 px reflow, text-spacing override | No loss of content or function; no horizontal page scrolling | — | R11, R10 | E, M | P0 |
| TC-A11Y-011 | Contrast of text, icons, disabled and error states against the final palette | Meets 1.4.3 and 1.4.11 | — | R11 | M | P0 |
| TC-A11Y-012 | Target size of controls | ≥ 24×24 CSS px (2.5.8); Airport Mode and the shopping log use large targets for one-handed use | UJ-005, UJ-023 | R11 | E | P0 |
| TC-A11Y-013 | VoiceOver (iOS) and TalkBack pass on the core journey and Airport Mode | Sensible reading order, meaningful names, checklist state announced, no unlabeled images | — | R11 | M | P0 |
| TC-A11Y-014 | Red-result screen under a screen reader | Reads as guidance, not as an error; no `role="alert"` panic framing | UJ-029 | R11 | M | P1 |
| TC-A11Y-015 | **Every route, both locales, 320 px viewport:** measure `document.documentElement.scrollWidth <= clientWidth` | No horizontal overflow anywhere (WCAG 1.4.10). Asserted per route **per locale**, never as a spot check: the longest label decides and zh-TW and en wrap differently, so a route can pass in one language and fail in the other. One `evaluate` per route per locale | — | R11, R10 | E | P0 |
| TC-A11Y-016 | A page taller than the viewport, scrolled to the bottom | Content ends clear of the sticky bottom navigation rather than flush against or beneath it: the nav reserves its own height from content rather than a guessed constant, and isolates its stacking context. This is about the **end** of the scroll — a sticky bar covering content mid-scroll is what sticky positioning is for, and is not a defect | — | R11 | E | P0 |
| TC-A11Y-017 | **Every interactive control, every route, both locales, 390 px viewport:** `scrollIntoView`, then measure | The control is completely clear of the persistent chrome. This is the authoritative check for WCAG 2.5.8 obscuring, and it is strictly stronger than an axe scan at one scroll offset — which sees only the controls visible at that offset and reports a true statement about a state the user is never stuck in. The property that matters is operability: a control the user can bring into the clear is operable. A control that **cannot** be cleared at any scroll position, typically on a page too short to scroll past the bar, fails — and that is the defect this replaces the noise with | — | R11 | E | P0 |
| TC-A11Y-018 | **Tab through every control, every route, both locales, 390 px viewport** | Focus never lands underneath the persistent chrome (WCAG 2.2 SC 2.4.11, Focus Not Obscured). Separate from `TC-A11Y-017` and not implied by it: `scrollIntoView` and tabbing scroll by **different machinery**, so a control that can be scrolled clear may still receive focus underneath the bar. The keyboard path is made correct by `scroll-padding-block-end` on the scrolling root, which is one declaration and therefore one deletion away from regressing | — | R11 | E | P0 |

---

## 6. TC-PWA — Install, manifest, platform quirks

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-PWA-001 | Manifest: name, icons, `start_url`, `scope`, `display`, theme | Valid under the `/kaeru/` base path | — | R18 | E | P0 |
| TC-PWA-002 | Install prompt offered before the trip, not at the airport | Offered at UJ-004; Airport Mode is installed and cached before it is needed | UJ-004 | R05 | E | P0 |
| TC-PWA-003 | Install to home screen on iOS, launch standalone | Launches at the right route; data visible; safe-area insets respected | — | R14 | M | P0 |
| TC-PWA-004 | Install on Android Chrome | Install works; standalone launch retains data | — | R14 | M | P1 |
| TC-PWA-005 | Load `https://sean1093.github.io/kaeru/` | Loads, SW registers under the right scope, no 404 assets, deep links work after a hard reload | — | R18 | E | P0 |
| TC-PWA-006 | Photo capture / file input on iOS Safari with a HEIC image | Accepted and rendered, or rejected with a clear message; never a silent failure | UJ-009 | R15 | M | P0 |
| TC-PWA-007 | Oversized photo (> 10 MB) | Downscaled or rejected clearly; quota not blown | UJ-009 | R15, R04 | C, M | P0 |
| TC-PWA-008 | Camera permission denied | The receipt still saves without a photo — a photo is never required | UJ-005, UJ-009 | R15 | C, E | P0 |

---

## 7. TC-SEC — Privacy

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-SEC-001 | Network monitoring across the whole E2E suite | Zero requests to any origin other than the app's own — no fonts, analytics, beacons or telemetry | DR-040 | R17 | E | P0 |
| TC-SEC-002 | Inspect stored data after a full two-traveler journey | No field holds a full passport number; `passportRef` is at most 4 characters | DR-041 | R17 | E | P0 |
| TC-SEC-003 | URLs and history during the journey | No personal data in query strings or hashes | DR-040 | R17 | E | P1 |
| TC-SEC-004 | Operator links | Open outward only; Kaeru submits nothing, scrapes nothing, stores no operator or bank credential | DR-052, DR-044 | R17 | E | P0 |
| TC-SEC-005 | Export file contents | Only what the user entered; readable and documented; no hidden identifier | UJ-037 | R17 | U | P1 |

### 7.1 Prohibitions discharged by the guardrail suite

Some cases above protect a rule that says something must **not** exist. A prohibition has no runtime surface, so there is often nothing a behavioural test can observe. Those are covered by `src/guardrails.test.ts` (issue #59) under the carve-out in [test-strategy.md](./test-strategy.md) section 3.

Each case below says **who owns it**, because a case with two owners is a case nobody notices is missing. Two modes:

- **Discharged** — the guardrail is the whole test. The owning issue's pinned range excludes the case.
- **Backstopped** — the behavioural test is authoritative and stays in its owning issue; the guardrail is a static floor that catches a violation the behavioural test cannot see.

(Case ids are in backticks here so this table is not a case row: each id still appears exactly once as a definition and the count check stays honest.)

| Case | Rule | Mode | Guardrail | Behavioural owner |
|---|---|---|---|---|
| `TC-DOM-021` | `DR-013` | **Discharged** | 一般物品 and 消耗品 appear nowhere in `src/` or the message bundles except where the content says they are abolished | none — #15's range excludes it. There is no behaviour to observe: the assertion is that a field and a vocabulary do not exist |
| `TC-DOM-053` | `DR-010`, `DR-023`, `DR-031` | **Discharged** | the three linked numbers in the guide match the resolved rules, behind an explicit allowlist | none |
| `TC-DOM-106` | `DR-080`; guardrail covers `DR-075`, `DR-078` | **Backstopped** | no validation finding for those two rules carries severity `block` | **#17** — `ValidateReceipt` returns `block` for `DR-070` and `DR-071` only. That is the real assertion and it stays; the guardrail covers only two of the rules the case spans |
| `TC-DATA-019` | `DR-041` | **Backstopped** | no stored entity field can hold more than four characters of a passport reference | **#22** — truncation or rejection on import is runtime behaviour over hostile input, which a shape check cannot see |
| `TC-SEC-001` | `DR-040` | **Backstopped** | no `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or `EventSource` outside the outbound-link helper and the service-worker registration | **E2E shell suite** — a static check cannot see a request made by a dependency |
| `TC-SEC-004` | `DR-044`, `DR-052` | **Backstopped** | no credential field in any entity | **E2E** — that links open outward and nothing is submitted is observable, and worth observing |
| `TC-I18N-015` | bilingual parity (`DR-053` tone, brief constraint) | **Discharged** | no `window.confirm`, `window.alert`, `window.prompt` or `beforeunload` handler anywhere in `src/` | none — a native dialog renders its buttons in the **OS** language, so a zh-TW user sees "Leave site? / OK / Cancel" in English whatever the app locale. That is the one surface our i18n layer cannot reach, so the only enforceable rule is that it never appears. `ScreenRoute.guard` stays in the contract as an escape hatch; a screen that wants one comes back to UXDesigner as a specific case |

The rule of thumb: **discharge only when the assertion is "this does not exist"**. The moment a rule has an input, a user, or a hostile file involved, the behavioural test is authoritative and the guardrail is a floor underneath it.

---

## 8. TC-UX — Flow-level checks

| ID | Scenario | Expected | Req | Risk | Level | Pri |
|---|---|---|---|---|---|---|
| TC-UX-001 | First run, no data | The five-step explainer leads to trip setup; the three counter-intuitive facts appear; skippable and re-openable from the guide | UJ-001 | — | E | P0 |
| TC-UX-002 | Trip setup | Completes in under two minutes with departure date, airport and one traveler; flight time optional | UJ-002 | — | E | P0 |
| TC-UX-003 | Log a receipt from the dashboard | Three required inputs, smart defaults, completed in under 20 seconds on `pixel-chromium` | UJ-005 | — | E | P0 |
| TC-UX-004 | Shop name autocomplete after three visits to the same shop | Suggests the previously entered shop within the trip | UJ-005 | — | C | P1 |
| TC-UX-005 | Mixed-rate line | Collapsed by default, one tap to open | UJ-006 | — | C | P1 |
| TC-UX-006 | Threshold indicator in the logging flow at ¥4,100 | Shows "¥900 more today at this shop" with the exact figure | UJ-007, DR-010 | R02 | C, E | P0 |
| TC-UX-007 | Operator left as "not sure" | Never an error state; a quiet "resolve tonight" item appears instead. No pre-purchase operator lookup is offered | UJ-010, DR-050, UR-05 | — | C, E | P0 |
| TC-UX-008 | Tonight's list | Finite, finishable, reaches a genuine zero state | UJ-011 | — | E | P0 |
| TC-UX-009 | Registration recorded per operator | Later receipts from the same operator attach automatically; the user does not repeat the action per receipt | UJ-013 | — | U, E | P0 |
| TC-UX-010 | Packing plan the day before, from the packing location set at the hotel | Every `checked_bag` / `unknown` receipt raised to the top with its reason | UJ-015, UJ-017 | R05 | E | P0 |
| TC-UX-011 | Receipt integrity check the night before | A "no" moves the receipt to `not_claiming` with a reason, before the airport | UJ-018 | R01 | E | P0 |
| TC-UX-012 | Refund tracker grouped by operator | Status, expected net, days since confirmation, grouped as the money actually arrives. The refund destination is recorded per operator; Kaeru never asserts that a card refund must return to the purchase card | UJ-033, UR-12 | — | E | P1 |
| TC-UX-013 | Overdue nudge after the user's configured period | Surfaces the operator contact link plus purchase date, shop, amount and confirmation date; Kaeru contacts nobody and promises no outcome | UJ-035, DR-036, UR-11 | — | E | P1 |
| TC-UX-014 | Trip summary | Tax paid, confirmed, received, lost — and why anything was lost | UJ-036 | — | E | P1 |
| TC-UX-015 | Full P1 walkthrough (Yi-chun, Narita, two travelers, 14 receipts, one red result) | End-to-end journey passes in zh-TW on `pixel-chromium` | UJ-001–UJ-036 | R05 | E | P0 |
| TC-UX-016 | Full P2 walkthrough (Alex, Kansai, high-value watch, single traveler, red result) | End-to-end journey passes in en on `iphone-webkit`, including the documents reminder and the leave-by recommendation shown with its arithmetic visible rather than as a bare time (`TC-DOM-075`) | UJ-001–UJ-036, DR-016 | R05 | E | P0 |
| TC-UX-017 | Operator refund methods listed, including cash at the departure port | Cash is listed as a possible method and never promised; methods come from the operator catalog, not from code | DR-039, UR-06 | R19 | C | P1 `@unconfirmed` |
| TC-UX-018 | Typing into the add-receipt form, then leaving by `x`, by browser back, or by following a link | No prompt of any kind. The draft is autosaved as it is typed and restored silently on reopening the screen — a prompt asking permission to restore is the same dialog wearing a different hat | UJ-005 | R09 | E | P0 |
| TC-UX-019 | A draft that is never completed | Counted **nowhere** a `Receipt` is counted: not in a shop-day threshold group, not in trip totals or the pending-refund figure, not in any deadline check, and above all not in an Airport Mode checklist. A half-typed amount is not a claim about anything | DR-012, DR-030, DR-031, DR-076, UJ-016 | R01, R05 | U, E | P0 |
| TC-UX-020 | An abandoned draft, that evening | Surfaces in tonight's list as an ordinary action item — "an unfinished receipt from 松本清" — not as an alert. Removing the leave prompt removed the only thing telling the user they had not finished; the recovery has to happen at 22:00 with the receipt still in the bag, not at the kiosk | UJ-005, UJ-011 | R01 | E | P0 |
| TC-UX-021 | A photo attached to a draft that is then discarded | Nothing was ever written to the photo store, so there is no orphan blob counting against quota and invisible to both cascade deletes | DR-042, UJ-009 | R04 | U, E | P0 |
| TC-UX-022 | Editing `trip.departureDate` — the hotel at 23:00, deciding whether to stay two more days | Every deadline check re-runs and the cost is shown **before** the change is committed: which receipts move into `DR-076` or `DR-076a`, by name. This is the only moment the deadline warning is actionable — customs confirmation happens at departure, so "do customs early" does not exist, and a warning shown at logging time points at a screen where nothing can be done about it | DR-076, DR-076a, UJ-021 | R03 | E | P0 |
| TC-UX-023 | Eight receipts ticked on the packing checklist at 22:00, reopened at 06:00 | Every tick is still there. The checklist persists, never resets and never expires. A silent reset is indistinguishable from a tick never made, and is worse than a stale one: a stale tick costs a moment of re-verification, a vanished one costs trust in every other tick on the screen | UJ-017, DR-077 | R04, R05 | E | P0 |
| TC-UX-024 | A receipt with a high-value item, ticked on S17's documents block | That persisted tick **is** `DR-078`'s acknowledgement. No separate `Receipt.documentsAcknowledged` field exists — a stored field would be a second source of truth for the same fact, and the two would drift | DR-078, DR-016, UJ-020 | R01 | U, E | P0 |

---

## 9. Counts

| Area | Cases | Of which `@unconfirmed` |
|---|---|---|
| TC-DOM — domain rules | 99 | 13 |
| TC-DATA — storage and backup | 23 | 0 |
| TC-AIR — airport, offline, service worker | 23 | 1 |
| TC-I18N — localization | 15 | 0 |
| TC-A11Y — accessibility | 18 | 0 |
| TC-PWA — install and platform | 8 | 0 |
| TC-SEC — privacy | 5 | 0 |
| TC-UX — flows | 24 | 1 |
| **Total** | **215** | **15** |

**Requirement coverage.** Every `DR-0nn`, `UR-nn` and `UJ-0nn` ID published in `domain-rules.md` v1.0 and `user-journey.md` v1.0 is cited by at least one case above. This was checked mechanically against both documents on 2026-10-05 and is re-checked at each milestone exit.

---

## 10. Maintenance

- Every new feature issue adds or updates cases here **before** implementation starts; the implementing PR references the case IDs.
- A production bug that no case covered adds a case here as part of the fix, and the issue carries the `regression` label.
- When a `UR-nn` uncertainty is settled, the related `@unconfirmed` tag is removed and the case becomes blocking. `UR-08` (the 1% food rate) is the one most likely to move: it affects TC-DOM-041 to TC-DOM-045, TC-DOM-101 and TC-AIR-022.
- Coverage of requirements is reviewed at each milestone exit. A `DR-` or `UJ-` ID with no case is either covered or explicitly accepted as untested by the PM, in writing.
