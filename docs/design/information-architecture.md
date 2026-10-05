# Information Architecture

| | |
|---|---|
| Status | v1.1 (M0) |
| Date | 2026-10-05 |
| Owner | UX designer |
| Tracking | Issue #3 |
| Inputs | `docs/product/brief.md`, `docs/product/user-journey.md` (`UJ-0nn`), `docs/product/domain-rules.md` (`DR-0nn`, `UR-nn`) |

---

## 1. The shape of the problem

The journey has six stages. Kaeru's structure maps one-to-one onto them, because a traveler should never have to work out *where in the app* a stage lives.

| Journey stage | Where the user is | Primary Kaeru surface |
|---|---|---|
| 1. Before the trip | Home, planning | Explainer, trip setup, guide |
| 2. Shopping | In a shop, 30 seconds, bags in hand | Add receipt (one screen) |
| 3. Hotel evening | Sitting down, catching up | Home dashboard, tonight's list, receipt detail |
| 4. Last day | Packing | Packing plan, integrity check, departure time |
| 5. Airport | Queue, offline, time pressure | Airport Mode |
| 6. Back home | Weeks later, checking money | Refund tracker, trip summary |

Two structural consequences:

- **Home is phase-aware.** The same tab shows a different primary card before the trip, during the trip, on the last day, on departure day, and after the trip. The user never has to find the right mode; the app already knows the departure date.
- **Airport Mode is a mode, not a screen.** It takes over the viewport, hides the bottom nav, and runs a linear sequence. Entering and leaving it are explicit.

---

## 2. Navigation model

**Bottom tab bar with four items. Settings is not a tab.**

```
┌──────────────────────────────────────────────┐
│   首頁      收據       機場      指南        │
│   Home    Receipts   Airport    Guide        │
│    ▔▔                                        │
└──────────────────────────────────────────────┘
```

| Tab | zh-TW | en | Icon | Badge |
|---|---|---|---|---|
| Home | 首頁 | Home | `home` | none |
| Receipts | 收據 | Receipts | `receipt` | count of receipts needing action |
| Airport | 機場 | Airport | `plane-takeoff` | dot from the day before departure |
| Guide | 指南 | Guide | `book-open` | none |

Rationale:

- Four is the maximum that keeps every target >= 64 px wide and every English label un-truncated on a 320 px viewport ("Receipts" is the longest at 8 characters).
- Settings is visited a handful of times per trip, so it is a `settings` icon in the Home app bar, not a permanent fifth of the screen. This is the "at most 4 plus settings" rule from the brief.
- **Airport is a permanent tab, not a date-triggered reveal** (answer to the journey's open question 1). A panicking traveler must find it where they already know it is, and a curious one should be able to rehearse the procedure on day 1. On departure day it additionally takes over the Home hero, so it is unmissable without being intrusive on day 2.
- The bar is fixed to the bottom with `padding-bottom: var(--safe-bottom)`, within thumb reach. It hides in Airport Mode and inside full-screen flows (add receipt, onboarding), which have their own close affordance.

**Depth.** At most three levels: tab → list → detail. Choosers (operator, traveler, packing location, rate, date) are bottom sheets, not pushed screens, so they never add depth and always return to the exact field.

**Back behaviour.** Every pushed screen has a `chevron-left` back in the app bar and honours the hardware or browser back gesture. Bottom sheets close on back, on scrim tap, and on swipe-down. Add receipt is a full-screen flow whose close is an `x` with an unsaved-changes guard.

**Routing.** One route per screen in the inventory under the Pages base path, so every screen is linkable, restorable after a reload, and testable in isolation. Sheet state is a route too (`/receipts/new#operator`) so browser back closes the sheet rather than leaving the screen. Airport Mode step is a route, so a backgrounded app resumes exactly where it was (`UJ-023`).

---

## 3. Screen inventory

MVP screens. Every screen is drawn in `wireframes.md`.

### Onboarding and explainer

| ID | Screen | Journey |
|---|---|---|
| S01 | Welcome | `UJ-001` |
| S05 | Explainer, 5 steps | `UJ-001` |
| S02 | Trip setup — date, airport, flight time, connection | `UJ-002`, `DR-037` |
| S03 | Travelers | `UJ-002`, `DR-004`, `DR-041` |
| S04 | Ready + airport buffer | `UJ-003`, `UJ-004` |

### Home

| ID | Screen | Journey |
|---|---|---|
| S10 | Home — during trip | `UJ-011`, `UJ-016` |
| S11 | Home — empty | — |
| S12 | Home — before trip | `UJ-001`, `UJ-004` |
| S13 | Home — departure day | `UJ-022`, `UJ-023` |
| S14 | Home — after trip | `UJ-033` |
| S15 | Tonight's list | `UJ-011` |
| S16 | Trip summary | `UJ-036` |
| S17 | Packing plan (last day) | `UJ-017`–`UJ-022` |

### Receipts

| ID | Screen | Journey |
|---|---|---|
| S20 | Receipt list, grouped by date, with same-shop-same-day subtotal | `UJ-005`, `DR-012` |
| S21 | Add receipt — the 20-second screen | `UJ-005`–`UJ-010` |
| S22 | Receipt detail + status timeline | `UJ-012`–`UJ-015` |
| S23 | Edit receipt | — |
| S24 | Operator chooser (sheet) | `UJ-010`, `UJ-012` |
| S25 | Traveler chooser (sheet) | `DR-004` |
| S26 | Packing location (sheet) | `UJ-015` |
| S27 | Photo view | `UJ-009` |
| S28 | Receipt list — empty | — |
| S29 | Old-system receipt | `UJ-038`, `DR-003`, `DR-064` |
| S2A | Not claiming (sheet) | `UJ-018`, `DR-060h` |
| S2B | Fee warning state on detail | `DR-025`, `DR-027` |

### Airport Mode

| ID | Screen | Journey |
|---|---|---|
| S30 | Start — readiness, blockers, time | `UJ-023`, `UJ-032` |
| S31 | Step 1 — gather goods (hard gate) | `UJ-024` |
| S32 | Step 2 — go landside, before check-in | `UJ-025`, `UJ-026`, `DR-033` |
| S33 | Step 3 — at the terminal | `UJ-028` |
| S34 | Step 3 — green | `UJ-029`, `DR-034` |
| S35 | Step 3 — red | `UJ-029`, `DR-030` |
| S36 | Already-used goods → customs desk | `UJ-030`, `DR-035` |
| S37 | Step 4 — customs done, release the gate | `UJ-031` |
| S38 | Step 5 — done, what happens next | `UJ-031`, `DR-039` |
| S39 | Something's wrong (6 branches) | `UJ-032` |

### Refunds

| ID | Screen | Journey |
|---|---|---|
| S40 | Refund tracker, grouped by operator | `UJ-033`, `UJ-035` |
| S41 | Operator refund detail | `UJ-034`, `DR-051` |

### Guide

| ID | Screen |
|---|---|
| S50 | Guide index |
| S51 | Guide article with sources and access dates |
| S52 | Operator directory |
| S53 | Operator detail |
| S54 | FAQ |

### Settings

| ID | Screen | Journey |
|---|---|---|
| S60 | Settings index | — |
| S61 | Trip, travelers, airport buffer, overdue threshold | `UJ-003`, `DR-036` |
| S62 | Data — export, import, delete all | `UJ-037` |
| S63 | Privacy and about | brief non-goals |

### Cross-cutting

Offline (only where it changes behaviour), form errors, storage write failure, install prompt, empty states.

---

## 4. Flows

### Flow A — First run (journey stage 1, `UJ-001`–`UJ-004`)

1. **S01 Welcome**: what changed, what Kaeru does, the privacy promise. Primary: *How it works* → S05. Quiet: *Set up my trip* → S02.
2. **S05 Explainer**, five steps, 60 seconds, skippable at every step and re-openable from the Guide tab. Order is deliberate — the three counter-intuitive facts first:
   1. You pay the full price now; the tax comes back later.
   2. Customs happens before bag drop, landside, at a terminal.
   3. One missing item voids a whole receipt.
   4. The shop picks the refund operator; you will meet several.
   5. You have 90 days from each purchase to leave Japan.
   Each step links to its `guide.steps.*` section rather than restating the rule.
3. **S02 Trip setup**: departure date (required), departure airport (searchable; the seven terminal-equipped airports marked), flight time (optional, powers the countdown). A quiet link opens the connection sheet, which explains that the procedure happens at the **final** airport you leave Japan from (`DR-037`) and asks for that airport.
4. **S03 Travelers**: display label (required) + passport last 4 (optional, max 4 characters, `DR-041`). An inline note says that a child's purchases on a parent's passport belong to the parent (`DR-004`).
5. **S04 Ready**: trip summary, plus the airport buffer control (30 / 60 / 90 minutes, default 60) labelled as Kaeru's recommendation because no official figure exists (`UJ-003`, `DR-032`). Primary: *Add my first receipt*.
6. State is written locally after each step; a closed tab resumes where it was. The install prompt is offered here or on S12 — **never at the airport** (`UJ-004`).

**Edge cases.** No departure date → S12 prompts for it and Airport Mode says it cannot compute readiness. With exactly one traveler, the traveler field is hidden everywhere.

### Flow B — Add a receipt (journey stage 2, `UJ-005`–`UJ-010`) — target under 20 seconds

Required: tax-excluded total, shop, traveler (`DR-010` judges the threshold on the tax-excluded figure, so it is never inferred silently).

1. Entry: the `+` FAB on Home or Receipts, or *Add another* from the save toast.
2. **S21 opens with the amount field focused and the numeric keypad raised.**
3. A quiet toggle switches to tax-included entry and shows the derived tax-excluded figure beneath, labelled as an estimate (`DR-021`, `DR-022`). The receipt records which figure the user actually entered.
4. Shop: text field with recent-shops suggestions from this trip (Yi-chun visits the same drugstore three times). Picking a recent shop pre-fills its known operator.
5. Traveler: segmented control for 2–3, select sheet for 4+, hidden for 1. Defaults to last used.
6. Smart defaults in one compact, tappable row: today's date (JST, `DR-002`), 10 % rate, operator *not sure*, packing *with me*.
7. A single checkbox for `UJ-008`: 這筆有東西會在日本吃掉或用掉 / "Some of this will be eaten or used in Japan", with the helper 這張收據就不能退稅。下次把這些東西分開結帳。 — advice, not scolding.
8. *Save* is enabled as soon as the three required values are valid; it is never disabled (`DR-080`). On failure it explains.
9. Below the fold, *More details*: rate split for a mixed-rate receipt (`DR-020`), operator, packing location, photo, note.

**Tax rate control (`DR-023`).** Options come from the dated rate table resolved by `purchaseDate`, not from a hard-coded pair. On 2026-11-01 it renders `10% · 大部分商品 / most goods` and `8% · 食品、飲料（不含酒類） / food and drink (not alcohol)`. From 2027-04-01 the food slot renders `1%` with no code change. The abolished categories 一般物品 and 消耗品 appear nowhere (`DR-013`).

**Threshold indicator (`UJ-007`, `DR-075`).** Inline, soft, non-blocking, in the logging flow (answer to open question 4 — it is only valuable while the user is still in the shop). Under ¥5,000 it gives **behavioural** advice: 這家店今天再加 ¥900 就到 ¥5,000。同一筆結帳買滿最保險。 / "¥900 more at this shop today reaches ¥5,000. Buying it in the same transaction is the sure way." It never predicts that a second receipt will merge, because whether separate transactions aggregate is `UR-02`, unconfirmed. On the list, same-shop same-day receipts carry a combined-subtotal footer that states the total **and the shop's discretion**, never qualification. A single receipt at or above ¥5,000 states qualification plainly (`DR-010`).

**High-value prompt (`DR-016`).** When a line's tax-excluded total reaches ¥1,000,000, and only then, the form asks for the most expensive single item on that line — because only then can a single item possibly qualify. Skipping is free; the flag remains user-settable from the receipt detail and a user-set flag always wins, since a ¥1,200,000 line could be two ¥600,000 items. Answering it is what makes the documents reminder fire in the packing plan (S17) and Airport Mode step 1 (S31).

**Shop grouping (`DR-012a`).** Grouping is best-effort and never authoritative. The UI carries both required mitigations: recent-shop suggestions in the form, so repeat visits reuse one spelling, and a manual merge/split on the group footer. A missed grouping weakens an advisory indicator and nothing else.

**The 20-second budget.** Open 1 s → amount 5 s → shop, mostly from suggestions 6 s → traveler 2 s → save 1 s = 15 s. Nothing in the required path needs scrolling or a second screen.

### Flow C — Receipt detail and status (journey stage 3, `UJ-012`–`UJ-015`)

1. S22 opens from any list row. The top is identity: shop, date, traveler, then the amount block.
2. **Three money numbers, distinguished by form, not by colour** (answer to open question 3):

| Number | Form | Example |
|---|---|---|
| Tax on the receipt | plain, no prefix, labelled 消費稅 / Consumption tax | `¥890` |
| Estimated net after fees | `~` prefix, labelled 預估淨退 / Estimated net, with the fee named | `~¥830` |
| Actually received | plain, labelled 實收 / Received, with a derived 手續費 / Fee line | `¥520`, fee `¥20` |

Only the estimate is ever hero-sized. Where the operator fee is unknown, Kaeru shows the gross and says the net is unknown — an honest "fee unknown" beats a confident wrong number (`DR-025`, `UJ-014`).

3. **Status timeline**, exactly the `DR-060` lifecycle, every state user-asserted and reversible (`DR-062`, `DR-063`):

| State | zh-TW | en |
|---|---|---|
| `logged` | 已記錄 | Logged |
| `registered` | 已向業者登錄 | Registered |
| `customs_confirmed` | 海關已確認 | Customs confirmed |
| `refund_pending` | 等待入帳 | Refund pending |
| `refunded` | 已入帳 | Received |
| `rejected` | 未通過 | Rejected |
| `refund_disputed` | 金額有問題 | Amount disputed |
| `not_claiming` | 不辦這張 | Not claiming |

4. **Registration is per operator, not per receipt** (`UJ-013`). The receipt shows its operator's registration state; marking it registered marks the operator, and every other receipt with that operator follows. Modelling it per receipt would make an 11-receipt trip an 11-times chore. Kaeru never registers on the user's behalf — it links out and records what the user says (`DR-050`, brief non-goal).
5. Packing location, three-way (`UJ-015`). Choosing **Checked** raises an inline attention block with a one-tap *Move to carry-on* correction (`DR-032`).
6. The already-used toggle (past tense, distinct from the logging-time one): 已經在日本吃掉或用掉了 / "Already eaten or used in Japan", with the official consequence inline, verbatim: 整張收據都不能退。請不要使用免稅手續機台，直接到海關人員櫃檯申報。 (`DR-035`, `DR-018`).
7. A quiet *I will not claim this* opens S2A. The reason is **optional** (answer to open question 5): the five reasons from `notClaimingReason` are offered as radios with "you do not have to pick one". Asking a tired traveler to justify giving up buys a better trip summary at the cost of a worse moment.
8. **Fee warning (S2B, `DR-027`).** Triggers when the estimated net falls below `fee.warnBelowJpy`, default **¥2,000**, held as rules data rather than code — not only when the net goes below zero, because a ¥30 refund is as bad as none and the user should see it coming. The figure covers a Taiwanese bank's NT$200–400 inbound-remittance charge, roughly ¥900–1,900 at recent rates; ¥1,000 would not have fired on the documented NT$77 case. It over-triggers in the safe direction: a shrugged-off warning costs a second of attention, a missing one costs the whole refund. The block offers alternatives — card or e-money instead of a bank transfer, or don't claim this one. The illustrating figure is locale-specific: the zh-TW string names NT$200–400 because that is a Taiwanese-bank fact; the English string carries the identical warning without a number, because quoting NT$ to a traveler from London would be wrong rather than merely unhelpful. This is a deliberate, documented exception to string-level parity — the *meaning* is at parity, the illustration is not. Both link to `guide.faq.q11`.
9. **Old-system receipts (S29, `UJ-038`, `DR-003`).** A receipt dated on or before 2026-10-31 shows a soft panel explaining the tax was already deducted at the shop, states that it is excluded from Airport Mode, and offers removal. It never appears in any checklist.

### Flow D — Home dashboard (journey stage 3, `UJ-011`, `UJ-016`)

1. **Hero**: estimated net refund, `~` prefixed, with the gross tax figure named beside it.
2. **Tonight's list** — at most three items with *See all*, ordered by cost of ignoring. Grouped so it is finishable (`UJ-011`): operator unknown, operator not registered (per operator), packing unknown, enrichment (no photo).
3. **Trip strip**: departure date, airport, days remaining, travelers.
4. **Receipts summary**: count, spend, tax paid, number of operators.
5. The `+` FAB sits above the bottom nav.

Phase logic:

| Condition | Screen |
|---|---|
| No trip, no receipts | S11 |
| Departure more than 1 day away | S12 header above S10 content |
| Departure is tomorrow | S17 packing plan is the hero |
| Departure is today | S13 — Airport Mode is the hero |
| Departure has passed | S14 — refund tracker is the hero |

**The deadline is deliberately quiet.** Each receipt has its own 90-day deadline (`DR-031`); there is no trip-level deadline. On a five-day trip nothing is close, so the deadline is muted body text. It becomes an attention item only when a receipt's deadline falls on or before the departure date (`DR-076`). A countdown that never fires is noise.

### Flow E — Last day (journey stage 4, `UJ-017`–`UJ-022`)

S17, reached from Home when departure is tomorrow, or any time from the Airport tab. Five blocks:

1. **Must be with you tomorrow** — every claimable receipt marked *checked bag* or *not sure*, grouped by traveler, each a checkbox. This is where the airport mistake is actually prevented (`DR-032`).
2. **Is everything still there?** — the integrity check (`UJ-018`). A *no* routes to S2A with the reason pre-selected, so a doomed receipt leaves the list the night before instead of at a terminal.
3. **Bring documents** — receipts with a line whose tax-excluded unit price is at or above ¥1,000,000 (`DR-016`, `UJ-020`). Alex sees this with his suitcase open, not at the counter.
4. **Deadline check** — reports its own emptiness in one calm line, so the user knows it was checked.
5. **When to leave** — flight time minus the airline check-in requirement minus the user's buffer, with the arithmetic shown and labelled as Kaeru's advice (`UJ-022`, `DR-032`).

### Flow F — Airport Mode (journey stage 5, `UJ-023`–`UJ-032`)

Full viewport, no bottom nav, no FAB, body text `--text-lg` minimum, 56 px primary buttons, a step indicator, and the countdown in the header from step 2. Fully offline: it reads only local data and makes no network call on any path. Leaving requires an explicit confirmation and keeps progress.

1. **S30 Start.** Readiness summary: claimable receipts, travelers, operators, and how many are not being claimed. Blockers listed before the start button. The governing rule stated once: customs first, bag drop second. A time line: flight time and the recommended finish-by time.
2. **S31 Step 1 — have your goods with you.** Checklist grouped by traveler, then by receipt (`UJ-019`, `UJ-027`) — never by item, because customs is all-or-nothing per receipt (`DR-030`), so an item-level checkbox would model the wrong thing. Per-traveler progress. Receipts flagged *already used* are excluded here and surfaced as a pointer to S36. High-value receipts show the documents reminder inline.
3. **S32 Step 2 — go landside, before check-in.** Where (international departure lobby, landside, before baggage drop), what to look for (免税手続用の端末), and the final-airport statement for connecting itineraries. The Visit Japan Web alternative is offered for the seven applicable airports with its constraint stated: inside the departure-lobby procedure Wi-Fi area, before security (`DR-033`).
4. **S33 Step 3 — at the terminal.** One traveler at a time. Shows that traveler's receipt count and tax-excluded total so the user can sanity-check the terminal display, with "if it differs, trust the terminal". Two large outcome buttons.
5. **S34 Green.** Marks that traveler's receipts `customs_confirmed` with a timestamp. Next traveler, or next step. The banner stays.
6. **S35 Red.** Its own calm screen (`UJ-029`). Red is a routing decision, not an accusation, and the copy says so first. Then what to do, then the per-receipt consequence (`DR-030`) stated once with a link to the guide, then a self-check list so the user finds a problem before the officer does. Outcomes: *Customs confirmed* or *One was rejected*.
7. **S36 Already-used goods.** The official instruction verbatim: do not use the terminal, declare at a customs officer's desk (`DR-035`).
8. **S37 Step 4 — customs done.** Per-traveler summary, then the release. The banner clears only here.
9. **S38 Step 5 — done.** What happens next, honestly: the shop or its operator pays, not the government and not the airport; there is no legal time limit (`DR-036`, `DR-039`).
10. **S39 Something's wrong**, reachable from every step: lost receipt, missing or already-checked item, broken or queued terminal, running out of time, used goods, can't find the terminals. The out-of-time branch lists receipts biggest-first and states the honest trade-off — abandoning an inspection counts as no confirmation, and nobody compensates a missed flight; the user decides what to drop (`UJ-032`).

**How hard is the hard gate** (answer to open question 2). Two different mechanisms:

- The **"do not check your bags yet" state** is rendered by the shell, persists across every step, is not dismissible, and clears only at S37 after the user confirms customs is done for every traveler. If the user tries to mark check-in done early, Kaeru explains what they are about to lose rather than silently allowing it.
- The **step-1 advance gate** blocks progress until every claimable receipt is ticked or explicitly moved out of the list. "Blocked" means the primary button explains: tapping it scrolls to the first unresolved receipt and names the count. It never greys out, and it never traps — the user can leave the mode at any time. Friction, never a cage: the person holding the phone is standing in a queue and may have a reason we cannot see.

### Flow G — After the trip (journey stage 6, `UJ-033`–`UJ-036`)

1. **S14** becomes Home once the departure date passes. Three numbers: received, still waiting, not refunded.
2. **S40** groups by operator, because that is how the money arrives and how the user will chase it. Each group shows receipts, estimated net, status, and days since customs confirmation.
3. Each receipt has one switch: *Money arrived*, with an optional actual amount. Entering it shows expected vs actual and the implied fee (`UJ-034`), which is how the operator fee data gets corrected by reality.
4. **Overdue nudge** (`UJ-035`, `DR-036`). Refund timing is undefined by law, so "late" is a **user preference**, not a fact. Settings holds the threshold (default 14 days) and the nudge says so: 超過你設定的 14 天 / "Past the 14 days you set". The nudge surfaces the operator's contact link and the four facts needed to chase: purchase date, shop, amount, confirmation date. Kaeru contacts nobody.
5. **S16 Trip summary** (`UJ-036`): spent, tax paid, confirmed, received, fees, not refunded — and *why* anything was lost, with the lesson for next time. This is the screen that changes behaviour on the next trip.
6. Archiving a trip keeps it readable and exportable.

### Flow H — Guide (`docs/content/`)

1. **S50** has four entries plus a link to replay the explainer. Content is bundled, so it works offline.
2. **S51** articles are short sections; every factual claim carries its source link and access date, and rules whose status is `pending-legislation` or `unconfirmed` carry an inline caveat. **The guide is the only place rule text lives** — app screens link here rather than paraphrasing, so a threshold can never drift between two namespaces.
3. **S52 / S53** operator directory and detail, with the four common operators first, registration and refund methods, and fee data marked with its observation date (`DR-026`: treat every fee figure as volatile).
4. **S54 FAQ** is an accordion. `guide.faq.q11` is the fee-eats-your-refund answer that the receipt detail links into.
5. Unfamiliar terms in the app (未稅價, 免稅手續機台, 綠燈／紅燈) are quiet links into the relevant guide section.

### Flow I — Settings and data (`UJ-003`, `UJ-037`)

1. **Language** — 繁體中文 / English as a radio list, each shown in its own script. Switching is instant, keeps the current screen, sets `<html lang>`.
2. **Appearance** — System / Light / Dark.
3. **Trip (S61)** — departure, airport, travelers, airport buffer (`UJ-003`), overdue threshold (`DR-036`). Deleting a traveler warns about their receipts and offers reassignment.
4. **Data (S62)** — export to one JSON file (photos optional, with a size warning); import with a preview and a merge-or-replace choice; delete all, the only destructive action, with *Export first* offered in the same sheet.
5. **Privacy (S63)** — the promise in full, plus the explicit statement that every status in Kaeru is user-asserted and Kaeru connects to no operator or government system (`DR-062`).

---

## 5. Coverage check

Every journey step has a surface.

| Journey | Flow | Screens |
|---|---|---|
| `UJ-001` explainer | A | S01, S05, S50 |
| `UJ-002` trip setup | A | S02, S03 |
| `UJ-003` airport buffer | A, I | S04, S61 |
| `UJ-004` install prompt | A | S04, S12 |
| `UJ-005` 20-second log | B | S21 |
| `UJ-006` mixed rate | B | S21 more-details |
| `UJ-007` threshold indicator | B | S21, S20 footer |
| `UJ-008` will-use marker | B | S21 |
| `UJ-009` photo | B | S21, S27 |
| `UJ-010` operator deferred | B | S21, S24 |
| `UJ-011` tonight's list | D | S10, S15 |
| `UJ-012` resolve operator | C | S22, S24 |
| `UJ-013` registration per operator | C | S22, S15 |
| `UJ-014` fee expectation | C | S22, S2B |
| `UJ-015` packing location | C | S22, S26 |
| `UJ-016` running total | D | S10 |
| `UJ-017` packing plan | E | S17 |
| `UJ-018` integrity check | E | S17, S2A |
| `UJ-019` grouping by traveler | E, F | S17, S31 |
| `UJ-020` documents reminder | E, F | S17, S31 |
| `UJ-021` deadline check | E | S17 |
| `UJ-022` departure time | E | S13, S17 |
| `UJ-023` Airport Mode | F | S30–S39 |
| `UJ-024` everything in hand | F | S31 |
| `UJ-025` find the terminals | F | S32 |
| `UJ-026` do not check bags | F | shell banner, S30–S37 |
| `UJ-027` per-traveler checklist | F | S31, S33 |
| `UJ-028` present the passport | F | S33 |
| `UJ-029` green / red | F | S34, S35 |
| `UJ-030` consumed or missing | F | S36, S2A |
| `UJ-031` release the gate | F | S37, S38 |
| `UJ-032` time awareness | F | S30 header, S39 |
| `UJ-033` refund tracker | G | S14, S40 |
| `UJ-034` record what arrived | G | S41 |
| `UJ-035` overdue nudge | G | S40, S41, S61 |
| `UJ-036` trip summary | G | S16 |
| `UJ-037` export / delete | I | S62 |
| `UJ-038` old-system receipts | C | S29 |

---

## 6. Design decisions on the journey's open questions

| # | Question | Decision |
|---|---|---|
| 1 | Where does Airport Mode live? | A permanent fourth tab, plus a departure-day takeover of the Home hero. Rehearsable on day 1, unmissable on departure day, not nagging in between. |
| 2 | How hard is the hard gate? | Two mechanisms. The bag-drop warning is a non-dismissible shell state cleared only by explicit confirmation at step 4. The step-1 advance gate blocks and explains, never greys out, and never prevents leaving the mode. |
| 3 | How do we show "estimated"? | By form, not colour: plain for actual tax, `~` prefix plus a permanent fee rider for estimates, plain with a derived fee line for amounts received. Only the estimate is hero-sized. |
| 4 | Threshold indicator placement | In the logging flow, where it can still change behaviour, as behavioural advice about the *same transaction*. On the list, a combined-subtotal footer that states the shop's discretion and never promises qualification (`UR-02`). |
| 5 | Does "will not claim" need a reason? | No. Optional radios plus "you do not have to pick one". |

---

## 7. Open questions for the team

| # | Question | For |
|---|---|---|
| 1 | Receipt photos in export: base64 can make the file tens of megabytes. Current design includes them behind an unchecked box with a size estimate. Acceptable? | Architect |
| 2 | Are archived trips included in export by default? Current design: yes. | Architect, QALead |
| 3 | ~~Fee warning trigger value~~ **Decided.** `fee.warnBelowJpy = 2000`, held as rules data, not code. The band to cover is a Taiwanese bank's inbound remittance charge of NT$200–400, which is roughly ¥900 at the bottom and ¥1,800–1,900 at the top; a ¥1,000 floor would not have fired on the NT$77 case that motivated the warning. ¥2,000 clears the band with headroom and over-triggers in the safe direction — a shrugged-off warning costs a second, a missing one costs the whole refund. Architect to hold it as data (`DR-027`). | JapanExpert (decided), Architect (implement) |
| 4 | Contrast ratios in `visual-language.md` should be asserted by an automated test over the token file rather than trusted from the doc. | QALead |
