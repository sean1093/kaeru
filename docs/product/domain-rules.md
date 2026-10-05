# Domain Rules — Kaeru

| | |
|---|---|
| Status | v1.0 |
| Author | Japan travel expert |
| Date | 2026-10-05 |
| Tracking | Issue #2 |
| Facts and sources | `docs/research/tax-free-system-2026.md` (source IDs `[S1]`–`[S25]`) |
| Journey steps | `docs/product/user-journey.md` (`UJ-0nn`) |
| Audience | Engineers, QA, architecture |

Engineer-facing specification. Every rule has an ID (`DR-0nn`), an exact statement with explicit boundaries, and a status.

| Status | Meaning | Consequence for implementation |
|---|---|---|
| `confirmed-official` | Stated by Japan Tourism Agency, National Tax Agency, Japan Customs or Digital Agency | Implement as specified. Still store as data, not as a literal in code. |
| `pending-legislation` | Officially announced, bill not yet passed | Implement as dated data with an effective-from date; must be switchable. |
| `reported-media` | Media / association / operator publication only | Implement with a visible caveat. Do not assert it as fact in UI copy. |
| `unconfirmed` | Our inference; no published source answers it | Must be configurable; QA may tag related tests non-blocking. See §9. |

**Every constant in this document is data.** Rates change (`DR-023`), thresholds could change, operator fees change without notice (`DR-051`), and the whole system changed once already. Nothing here belongs in a conditional in application code.

---

## 1. Entities

### 1.1 Trip

| Field | Type | Notes |
|---|---|---|
| `id` | id | |
| `departureDate` | date (JST) | The date the traveler leaves Japan |
| `departureAirport` | code | The **final** airport they leave Japan from (`DR-037`) |
| `flightTime` | time, optional | Drives the airport countdown (`DR-032`) |
| `travelers` | Traveler[] | At least one |
| `airportBufferMinutes` | int | Default 60 (`DR-032`) |
| `checkInMinutes` | int | The airline's check-in / bag-drop cut-off before departure, in minutes. Default 60. Needed as the middle term of the `UJ-022` arithmetic (`DR-032`); airlines and airports differ, so it is a per-trip value the user can correct |

### 1.2 Traveler

| Field | Type | Notes |
|---|---|---|
| `id` | id | |
| `displayName` | string | User-chosen. Not a legal name. |
| `passportRef` | string, optional | **Maximum last 4 characters** of the passport number, for disambiguation only (`DR-041`) |

### 1.3 Receipt

The central entity. One Receipt models **one purchase transaction (one receipt)**, because that is the unit customs confirms (`DR-030`).

| Field | Type | Notes |
|---|---|---|
| `id` | id | |
| `tripId` | id | |
| `travelerId` | id | The eligible purchaser whose passport the purchase is under (`DR-004`) |
| `shopName` | string | Required. Free text as entered |
| `shopKey` | string | Normalised grouping identity derived from `shopName` (`DR-012a`). Two receipts group only when their `shopKey` matches |
| `purchaseDate` | date (JST) | Defaults to today in JST (`DR-002`) |
| `lines` | ReceiptLine[] | One per tax rate present (`DR-020`) |
| `operatorId` | id, nullable | Null = "not sure", a valid persistent state (`DR-050`) |
| `status` | enum | See §6 |
| `packingLocation` | enum | `with_me` \| `checked_bag` \| `unknown`. Default `with_me`. |
| `allItemsPresent` | bool, nullable | Null until asked. Past-tense fact, set on the last day or at the airport (`UJ-018`) |
| `willUseInJapan` | bool, nullable | Null until asked. **Future intent**, set at logging time (`UJ-008`). Distinct from `allItemsPresent`: this one is a prediction made in the shop that drives advice ("buy these separately next time"), the other is a fact established before the kiosk. Setting it does not change `status` |
| `hasHighValueItem` | bool | Derived from `max(lines[].maxUnitPriceTaxExcluded) >= 1000000` where that figure is present; user-settable otherwise, and user-set always wins (`DR-016`) |
| `amountReceived` | int (JPY), nullable | What actually arrived (`UJ-034`) |
| `notClaimingReason` | enum, nullable | `consumed` \| `missing` \| `fee_not_worth_it` \| `old_system` \| `other` |
| `photoRef` | local ref, optional | On-device only |

### 1.4 ReceiptLine

| Field | Type | Notes |
|---|---|---|
| `taxRate` | decimal | `0.10`, `0.08`, `0.01` (`DR-023`) |
| `taxExcludedAmount` | int (JPY), nullable | Line total. Authoritative for the threshold (`DR-011`) |
| `taxIncludedAmount` | int (JPY), nullable | Line total |
| `maxUnitPriceTaxExcluded` | int (JPY), nullable | Tax-excluded unit price of the most expensive **single item** on this line. Null when unknown, which is the normal case — Kaeru does not model individual items. Exists solely so `DR-016` can fire without an item breakdown: the user enters it only when prompted, and the prompt only appears for a line whose total already reaches ¥1,000,000 |
| `amountsAreDerived` | bool | True when one amount was computed from the other (`DR-022`) |

At least one of `taxExcludedAmount` / `taxIncludedAmount` must be present (`DR-061`).

Kaeru deliberately does **not** model individual items. Customs confirms whole receipts (`DR-030`), so an item list would add entry cost at the worst moment and buy nothing. `maxUnitPriceTaxExcluded` is the single concession to `DR-016`, and it is asked for only when a line total makes it possible.

### 1.5 Operator

See §8 for the catalog and §7 for the data shape.

---

## 2. Scope and applicability

| ID | Rule | Status | Source |
|---|---|---|---|
| **DR-001** | The refund method (リファンド方式) applies to tax-free goods **sold on or after 2026-11-01**. Goods purchased on or before **2026-10-31** fall under the old system. There is **no transitional period** in which both apply. | `confirmed-official` | `[S7]`, `[S14]` |
| **DR-002** | The applicable system is decided by the **purchase date**, not the departure date, and not the date the receipt is logged. Purchase dates are **Japan local dates (JST, UTC+9)**; a purchase at 23:30 JST on 2026-10-31 is an old-system purchase even where the user's phone is set to another timezone. | `confirmed-official` | `[S7]`, `[S14]`; JST handling `unconfirmed` (see UR-07) |
| **DR-003** | A receipt with `purchaseDate <= 2026-10-31` requires **no kiosk step** and must be excluded from Airport Mode checklists, labelled as old-system. | `confirmed-official` | `[S7]` |
| **DR-004** | Eligibility and customs confirmation attach to the **eligible purchaser (免税購入対象者)**, i.e. one passport. Receipts belong to exactly one traveler. Items bought for a child on a parent's passport belong to the **parent's** traveler record. | `confirmed-official` | `[S4]` |
| **DR-005** | Eligible foreign-national purchasers: non-residents verifiable as **less than 6 months since entry** into Japan (excluding diplomatic, official and US-forces status). Typical tourist status is 短期滞在. Document: passport. | `confirmed-official` | `[S4]` |
| **DR-006** | Eligible Japanese-national purchasers: lived abroad **continuously 2 years or more** and **less than 6 months** since the temporary return. Documents: passport plus one of a copy of 戸籍の附票, 在留証明, or a **My Number Card** marked as moved abroad (smartphone My Number Card included). Permanent domicile (本籍) is no longer required on these documents. | `confirmed-official` | `[S4]`, `[S5]` |
| **DR-007** | Holders of cruise-ship tourism, crew, emergency or shipwreck landing permits must present a **passport in addition to** the permit. For cruise-ship tourism landing permits a **copy** of the passport is acceptable. | `confirmed-official` | `[S4]`, `[S5]` |
| **DR-008** | Kaeru does **not** verify eligibility. It informs; the shop decides. No rule in this section may be implemented as a blocking validation. | n/a (product decision) | Brief, non-goals |

---

## 3. Eligible goods and the threshold

| ID | Rule | Status | Source |
|---|---|---|---|
| **DR-010** | A purchase qualifies when the **tax-excluded total is ¥5,000 or more** — i.e. `total >= 5000`, inclusive. ¥5,000 exactly qualifies; ¥4,999 does not. | `confirmed-official` | `[S1]`, `[S5]`, `[S7]` |
| **DR-011** | The threshold is judged on the **tax-excluded** amount, never the tax-inclusive amount. Where Kaeru only holds a derived tax-excluded figure (`DR-022`), the threshold result must be marked as an estimate. | `confirmed-official` | `[S7]` |
| **DR-012** | Scope of the threshold: **same shop, same calendar day (JST)**. Receipts are grouped by `(shopKey, purchaseDate, travelerId)` for the indicator. | `confirmed-official` for shop+day; `unconfirmed` for per-traveler (UR-01) and for whether multiple receipts actually aggregate (UR-02) | `[S1]`, `[S5]` |
| **DR-012a** | `shopKey` is derived from `shopName` by: trimming, collapsing internal whitespace, NFKC normalisation (so full-width and half-width forms collapse), and case folding for Latin text. It does **not** attempt to equate different scripts or branch names — 松本清, マツキヨ and 松本清 新宿東口店 remain three distinct keys. **Grouping is therefore best-effort and nothing downstream may treat it as authoritative.** Two mitigations are required: the receipt form offers recent shops from the current trip so repeat visits reuse one spelling, and the user can merge two shop groups manually. A missed grouping only weakens an advisory indicator (`UJ-007`); it can never cause a wrong refund figure, because the threshold indicator is advice and `DR-075` never blocks. | n/a (product decision) | — |
| **DR-013** | From 2026-11-01 the **general goods / consumables distinction is abolished**. There is one combined total. Kaeru must not model the two categories for post-reform receipts. | `confirmed-official` | `[S1]`, `[S5]`, `[S7]` |
| **DR-014** | There is **no upper limit**. The ¥500,000 consumables cap is abolished, as is the special sealed packaging requirement and the "not for business use" check. | `confirmed-official` | `[S5]`, `[S7]` |
| **DR-015** | Quantity is limited to what the purchaser **can personally carry out of Japan at departure**. This is not a number and must never be implemented as one. | `confirmed-official` | `[S1]`, `[S2]`, `[S5]` |
| **DR-016** | A line item with **tax-excluded unit price ¥1,000,000 or more** (`>= 1000000`, inclusive) causes the shop to transmit product details including serial numbers, and customs **may** ask for a certificate of authenticity or warranty. Kaeru flags the receipt and adds a documents reminder (`UJ-020`). Detection: when a line's tax-excluded **total** reaches ¥1,000,000 the form asks for `maxUnitPriceTaxExcluded`, since only then can a single item possibly qualify; the flag is derived from that answer. The user may also set the flag directly, and a user-set flag always wins — a ¥1,200,000 line could be two ¥600,000 items, and only the user knows. Below a ¥1,000,000 line total the flag is unreachable and is not prompted for. | `confirmed-official` | `[S2]`, `[S5]`, `[S7]` |
| **DR-017** | Excluded from tax-free goods: ① gold and platinum **bullion**; ② gold **coins** and platinum **coins** (newly excluded from 2026-11-01); ③ goods not subject to consumption tax. | `confirmed-official` | `[S1]`, `[S5]` |
| **DR-018** | Abolishing the sealed packaging does **not** permit use in Japan. Food, drink and cosmetics **consumed in Japan** cannot receive customs confirmation. | `confirmed-official` | `[S1]`, `[S2]` |
| **DR-019** | Self-posted separate shipment (別送) was abolished on **2025-03-31** and does not exist under the refund method. Shop-operated direct shipping (直送) is handled under Consumption Tax Act Article 7 and involves **no** tax-free sales procedure and no purchase record — so such goods are outside Kaeru's model entirely. | `confirmed-official` | `[S2]`, `[S5]`, `[S7]` |

---

## 4. Tax arithmetic and refund estimation

| ID | Rule | Status | Source |
|---|---|---|---|
| **DR-020** | A single receipt **may mix tax rates** (a drugstore basket of 8% food and 10% cosmetics is the normal case). Receipts therefore hold one line per rate, not a single rate. | `confirmed-official` | `[S6]`, `[S8]` |
| **DR-021** | Tax-excluded from tax-inclusive, per rate: `taxExcluded = taxIncluded × 100 / (100 + ratePercent)` — i.e. `× 100/110` at 10%, `× 100/108` at 8%, `× 100/101` at 1%. Then `tax = taxIncluded − taxExcluded`. | `confirmed-official` | `[S6]` |
| **DR-022** | **Any amount Kaeru derives is an estimate and must be labelled as one.** Japanese rounding of sub-¥1 fractions on a qualified invoice is performed **once per tax rate per invoice**, and the method — round up, round down, or round half up — is the **issuer's free choice**. Per-item rounding then summed is explicitly not permitted. Because we do not know a given shop's choice, we cannot reproduce its printed figure to the yen. Where the receipt prints a tax amount, prefer the printed figure over our calculation. | `confirmed-official` | `[S6]` |
| **DR-023** | Consumption tax rates, as **dated data** resolved by `purchaseDate`: <br>• **10%** standard — current.<br>• **8%** reduced — food and drink (excluding alcohol and eat-in), newspapers on subscription — current.<br>• **1%** — food and drink, same scope as the current 8% category — **2027-04-01 to 2029-03-31**.<br>• **8%** — newspapers on subscription — continues through that period. | 10% / 8% `confirmed-official`; 1% `pending-legislation` (cabinet decision 2026-09-15, bill not yet passed) | `[S6]`, `[S8]`, `[S10]` |
| **DR-024** | Kaeru's own rounding for **estimates**, stated as a direction rather than an operation: **always round so that the figure understates what reaches the traveller.** Concretely — amounts paid **to** the user (tax on a line, gross refund) are computed per line in integer yen and **rounded down** (`floor`), then summed; amounts **deducted from** the user (operator fees, receiving-side charges) are **rounded up** (`ceil`). Flooring a deduction would inflate the net, which is the very thing this rule exists to prevent, so "floor everywhere" is the wrong reading. Both halves bias the same way and the worst-case error is a yen or two, in the direction that cannot disappoint. This is a product choice, not a legal rule, and must be documented wherever a figure is shown. | n/a (product decision) | — |
| **DR-025** | Estimated refund: <br>`grossRefund = Σ tax(line)` <br>`estimatedNet = grossRefund − operatorFee − receivingSideCharges` <br>where `operatorFee` comes from the operator catalog (`DR-051`) when known, and `receivingSideCharges` is user-supplied because it depends on their own bank. When either is unknown, show the gross **and** say the net is unknown. Never present gross as what will arrive. | `confirmed-official` that no legal rule governs refund amounts beyond "the amount equivalent to consumption tax" and that fees are unregulated | `[S1]`, `[S3]`, `[S7]` |
| **DR-026** | Operator fees are **not capped, not standardised and not required to be disclosed** by law. Treat every fee figure as volatile data with a recorded date. | `confirmed-official` | `[S3]` |
| **DR-026a** | An operator's percentage fee is meaningless without its **basis**: a percentage may be charged on the **refund** or on the **tax-excluded purchase**, and because the refund is roughly a tenth of the purchase, choosing wrong is a tenfold error in the user's money. Every stored percentage therefore carries an explicit basis. **A percentage whose basis we cannot establish from the operator's own wording is an unknown fee, not a guess**: store no fee rather than a number that may be ten times wrong. Confirmed bases today: **Tourego 1.5% of the tax-free sales amount** (purchase basis, operator-published); **Ocean credit-card route 0.5% of the tax-excluded price with a ¥180 minimum** (purchase basis, traveller-reported from the operator's own interface). Ocean's PayPal route (0.33% + from ¥40) and the earlier 2.2% figure have **no determinable basis** and must not be shipped as numbers. | `confirmed-official` that fees are unregulated and undisclosed `[S3]`; individual figures `C-operator` `[S23]` or `reported-media` `[S19][S20]` | `[S3]`, `[S19]`, `[S20]`, `[S23]` |
| **DR-027** | Receiving-side charges can exceed the refund. Documented real case: ¥19,805 purchase (≈¥1,980 tax) refunded via a bank transfer netted **NT$77**; a ¥1,100 tax case netted **zero** after NT$40 operator fee and NT$400 inbound FX fee. Taiwanese banks commonly charge **NT$200–400+** to receive a foreign remittance, and refusing a transfer also incurs a fee. Kaeru must warn when `estimatedNet` falls below `fee.warnBelowJpy`, **default ¥2,000**, not merely when it reaches zero — a ¥30 refund is as bad as none. The default is sized to the top of the NT$200–400 band (roughly ¥900–1,900 at recent rates), so that the warning would have fired on the ¥1,980 case that motivated it; a ¥1,000 floor would not have. Configurable, because the rate and bank practice both move. | `reported-media` (first-hand traveler accounts) | `[S18]`, `[S19]`, `[S20]` |

**Worked examples** (QA may use these directly):

| Input | Expected |
|---|---|
| Tax-excluded ¥6,480 @ 10% | tax ¥648; tax-included ¥7,128 |
| Tax-included ¥7,128 @ 10% | tax-excluded ¥6,480; tax ¥648 |
| Tax-included ¥1,080 @ 8% | tax-excluded ¥1,000; tax ¥80 |
| Tax-included ¥1,000 @ 8% | tax-excluded ¥925 (floor of 925.925…); tax ¥75. Marked derived. |
| Mixed receipt: ¥3,000 @ 8% + ¥2,500 @ 10%, tax-excluded | tax ¥240 + ¥250 = ¥490; threshold total ¥5,500 → qualifies (`DR-010`) |
| Tax-excluded ¥4,999 | Does not qualify |
| Tax-excluded ¥5,000 | Qualifies |
| Food line, tax-included ¥1,010, `purchaseDate` 2027-04-02 | Rate 1% → tax-excluded ¥1,000, tax ¥10. **Not** ¥75. (`DR-023`) |

---

## 5. Departure, customs confirmation and deadlines

| ID | Rule | Status | Source |
|---|---|---|---|
| **DR-030** | Customs confirmation is performed **per single purchase transaction (one receipt)**. If **any one** tax-free item on that receipt is not in the purchaser's possession, **no** item on that receipt can be confirmed and that receipt's consumption tax is not refunded. **There is no partial refund of a receipt.** | `confirmed-official` | `[S1]`, `[S2]` |
| **DR-031** | The customs-confirmation deadline is **90 days from the purchase date**, counted as "the day following the date of purchase to the 90th day". Implementation: `deadline = purchaseDate + 90 calendar days`, and the deadline day is **inclusive**. Official worked example: purchase **2026-11-01** → deadline **2027-01-30**. Each receipt has its own deadline; there is no trip-level deadline. | `confirmed-official` | `[S1]`, `[S7]` |
| **DR-032** | Customs confirmation, **including any inspection**, must be completed **before baggage check-in**. Checked baggage **cannot** be retrieved for a tax-free procedure. Abandoning an inspection for personal reasons such as a closing check-in counts as **not having received confirmation**, and neither the airline nor customs compensates a missed departure. Kaeru's departure-time recommendation is `flightTime − trip.checkInMinutes − trip.airportBufferMinutes`, where `airportBufferMinutes` defaults to **60** and `checkInMinutes` defaults to **60**. Both are per-trip and user-correctable, and the arithmetic must be shown rather than just its result: a recommendation the user cannot audit is one they will ignore. The whole figure must be labelled as Kaeru's advice — **no official figure exists**. | Rule `confirmed-official`; the buffer figure `unconfirmed` (UR-03) | `[S1]`, `[S2]`, `[S24]`; 45–60 min media guidance `[S21]` |
| **DR-033** | The procedure happens at a **tax-free procedure terminal (免税手続用の端末 — kiosk or electronic terminal)** in the **international departure lobby, landside, before baggage drop**. Passport read to result takes a few seconds. At **Narita, Haneda, Kansai, Chubu, Fukuoka, New Chitose and Naha**, **Visit Japan Web** may be used instead, but only inside the dedicated procedure Wi-Fi area of the international departure lobby, **before the security checkpoint**. | `confirmed-official` | `[S1]`, `[S2]` |
| **DR-034** | Kiosk result values: **green** (グリーン判定) = no inspection, confirmation complete; **red** (レッド判定) = present the goods at the customs inspection point. Red is a routing decision, not a failure. No inspection probability is published. | Result semantics `confirmed-official`; probability `unconfirmed` (UR-04) | `[S1]` |
| **DR-035** | If all or part of a consumable has been **consumed** in Japan, the purchaser must **not** use the kiosk for that receipt and must instead **declare it to a customs officer at the counter**. Kaeru routes to the counter, never to the machine.<br><br>**Scope is consumption, not absence.** The official wording is 飲食等して — eaten, drunk or otherwise used up, with 等 covering cosmetics and the like. **Nothing instructs a traveller to present a lost, returned or given-away item to an officer.** `allItemsPresent === false` is therefore not sufficient to route: it has at least two causes, and only one of them is this rule.<br><br>**The counter is compliance, not salvage.** Under the refund method the traveller has **already paid the tax**, so a missing item means they forgo the refund — there is no tax to collect and no penalty. This is the whole difference from the old system, where an unexported tax-free item meant tax was owed and collectible at departure. Routing therefore recovers nothing in either branch, which inverts the usual "when in doubt, route" instinct: over-routing spends queue time in the scarcest minutes of the trip, and `DR-032` makes that time expensive, because abandoning the procedure for lack of time counts as no confirmation at all.<br><br>**Where the distinction lives:** `Receipt.notClaimingReason`, which already separates `consumed` from `missing`. Route on `notClaimingReason === 'consumed'`, independent of `willUseInJapan` in **both** directions — that field is a prediction made in a shop and is advisory either way (`UJ-008`). Ask for the reason at `UJ-018`, on the last day with the suitcase open, not at the airport. An unexplained `allItemsPresent === false` at the airport is a **question, not a routing**, the same shape as the unanswered-prediction case.<br><br>**Copy constraint:** no wording on any of these paths may imply legal jeopardy. The instruction is unambiguous; the consequence of skipping it is **not published**. Someone holding a boarding pass must not be led to believe they have a legal problem when what they have is a lost ¥280. | Instruction and scope `confirmed-official`; consequence of skipping it `unconfirmed` | `[S1]`, `[S2]` |
| **DR-036** | Refund timing is **undefined by law**. Officially: "in principle after the tax-free sale is established by customs confirmation; ask the tax-free shop." Any "overdue" threshold in Kaeru is a user preference, not a fact. | `confirmed-official` | `[S2]`, `[S3]` |
| **DR-037** | For a domestic-to-international connection the procedure must be done at the **final airport of departure from Japan**. For a Japan-departing cruise that calls abroad and returns, followed by a flight home ("Fly & Cruise"), the procedure is done **at the airport when finally leaving Japan** — nothing is done at the cruise departure. For a cruise originating/terminating outside Japan, it is done at the **last domestic port**, before baggage handover. | `confirmed-official` | `[S1]`, `[S2]` |
| **DR-038** | Goods confirmed by customs must be exported **without delay**. Failure means collection of the consumption-tax amount **and** exposure to penalty provisions. Kaeru must never suggest keeping confirmed goods in Japan. | `confirmed-official` | `[S1]`, `[S2]`, `[S7]` |
| **DR-039** | The refund is paid by the **tax-free shop or a refund operator it has delegated to**, never by the Japanese government. Possible methods per the agencies: bank transfer, credit-card transfer, app transfer, and cash inside the departure port after customs confirmation. Which are offered is shop-dependent. | `confirmed-official` | `[S1]`, `[S2]`, `[S3]` |

---

## 6. Status lifecycle

```
                 ┌────────────────────────── not_claiming ◄─────────────┐
                 │                                                      │
  logged ──► registered ──► customs_confirmed ──► refund_pending ──► refunded
     │             │                │                    │
     │             │                │                    └──► refund_disputed
     │             │                └──► rejected
     └─────────────┴──────────────────────────────────────────────────► not_claiming
```

| ID | State | Meaning | Entry condition |
|---|---|---|---|
| **DR-060a** | `logged` | Receipt captured. Operator may be unknown. | Created (`UJ-005`) |
| **DR-060b** | `registered` | The user says they completed the operator's refund-destination registration. **Registration is a property of the operator, not of the receipt** (`UJ-013`): a receipt in this state is reflecting its operator's registration, not its own. Marking one receipt registered marks the operator, and every other receipt sharing that operator follows automatically — including receipts added later. Implementing this per receipt would make an 11-receipt trip an 11-times chore and is explicitly wrong. | User action (`UJ-012`); requires `operatorId`, since an unknown operator cannot have been registered with |
| **DR-060c** | `customs_confirmed` | The user says the kiosk gave a green result, or an inspection passed. | User action in Airport Mode (`UJ-029`) |
| **DR-060d** | `refund_pending` | Confirmed, money not yet recorded as received. | Automatic on `customs_confirmed` |
| **DR-060e** | `refunded` | `amountReceived` recorded. | User action (`UJ-034`) |
| **DR-060f** | `rejected` | Customs confirmation failed — missing item, consumed goods, past deadline, goods already checked in. | User action, with a reason |
| **DR-060g** | `refund_disputed` | Confirmed and overdue past the user's threshold, or an amount arrived that the user disputes. | User action or `DR-036` nudge |
| **DR-060h** | `not_claiming` | The user has knowingly decided not to pursue this receipt. Reachable from any pre-refund state. | User action, with `notClaimingReason` |

Transition rules:

| ID | Rule | Status |
|---|---|---|
| **DR-061** | A receipt may not enter `customs_confirmed` while `allItemsPresent == false` (`DR-030`). It must be routed to `rejected` or `not_claiming` first. | derived from `confirmed-official` |
| **DR-062** | All states are **user-asserted**. Kaeru has no connection to any operator or government system and must never display a status as if independently verified. | n/a (brief non-goal) |
| **DR-063** | Any state is reversible. The user is standing in an airport and will mis-tap. | n/a (product decision) |
| **DR-064** | Old-system receipts (`DR-003`) skip `customs_confirmed` entirely and may go `logged → not_claiming` with reason `old_system`, or be tracked only for trip cost. | derived from `confirmed-official` |

---

## 7. Validation rules

| ID | Rule | Severity |
|---|---|---|
| **DR-070** | At least one of `taxExcludedAmount` / `taxIncludedAmount` per line. | Block save |
| **DR-070a** | **Cross-field, not per-field:** when a line carries both amounts, `taxIncludedAmount >= taxExcludedAmount`. A strictly inverted pair is contradictory — both numbers are well-formed, so `DR-071` does not catch it, and unguarded it makes a receipt *subtract* from the trip's pending refund. Blocking is declining to invent a tax figure from a contradiction, not preventing something the law permits (`DR-080`), which is the same reasoning as `DR-072`.<br><br>**Equality is valid and must not be blocked.** The comparison is `>=`, not `>`. A line's amounts are the receipt's **per-rate subtotal**, not an item, and Japanese rounding happens once per rate per invoice (`DR-022`), so a small subtotal can legitimately carry zero tax: at 1% (from 2027-04-01, `DR-023`) any subtotal under ¥100 rounds to ¥0, at 8% under ¥13, at 10% under ¥10. Rare, but a real receipt, and refusing to save it would be refusing a correct one. Note that zero tax via non-taxable goods is **not** the justification — `DR-072` already excludes a 0% line, because no 0% entry exists in the rate table.<br><br>A floor-at-zero backstop in the engine stays regardless: `DR-043` import can introduce pairs that never passed this form. | Block save when strictly inverted |
| **DR-071** | Amounts are non-negative integers in JPY. The yen has no minor unit; never use floats for money. | Block save |
| **DR-072** | `taxRate` must exist in the rate table for `purchaseDate` (`DR-023`). A 1% line dated before 2027-04-01 is invalid. | Block save |
| **DR-073** | `purchaseDate` must not be in the future relative to JST today. | Warn, allow |
| **DR-074** | `purchaseDate` after `trip.departureDate` is contradictory. | Warn, allow (dates get changed) |
| **DR-075** | Tax-excluded total below ¥5,000 for the shop/day group: inform that it does not yet qualify (`DR-010`). | Inform, never block |
| **DR-076** | `exportDeadline < trip.departureDate`, i.e. the deadline passes **before** departure (`DR-031`). The receipt cannot be confirmed. Strictly `<`: the window is inclusive, so a deadline falling **on** the departure date is valid and is `DR-076a`, not this. | Warn prominently |
| **DR-076a** | `0 <= exportDeadline − trip.departureDate <= deadlineSlackWarnDays` (default **3**, configurable, held in the deadline rules data beside `exportWindowDays`): the receipt is valid but has little or no margin. **Worded differently from `DR-076`** — "this receipt's deadline is your departure day", never "this will expire". Two genuinely different states must not look the same: one says the refund is already lost, the other says there is no room if the plan changes.<br><br>Why this is not noise: equality is structural, not coincidental. Taiwan passport holders have **90 days visa-free** and 短期滞在 is capped at 90 days, so a traveller who buys on arrival day and departs on the last day their status allows lands on `deadline == departureDate` exactly — and is by definition someone who cannot extend. On an ordinary 5-day trip the slack is about 85 days and this never fires.<br><br>Slack rather than equality because the hazard is a flight moving later, and that hazard is identical at 0 or 1 day of margin.<br><br>**There is no action at logging time** — customs confirmation happens only at departure, so "do customs early" does not exist. This finding is information for a later decision, which means the deadline checks **must re-run when `trip.departureDate` changes** and show what a later departure would cost **before** it is committed (`UJ-021`, `UJ-022`). | Warn, quieter than `DR-076` |
| **DR-077** | `packingLocation == checked_bag` on a claimable receipt on departure day: raise (`DR-032`). | Warn prominently |
| **DR-078** | A receipt with `hasHighValueItem` carries a "bring the certificate or warranty" item on the **packing plan and the Airport Mode step-1 checklist** (`DR-016`, `UJ-020`). The acknowledgement **is the persisted tick on that checklist row** — there is no `Receipt.documentsAcknowledged` field, because a stored flag would be a second source of truth for the same fact. An unticked row *is* the finding; it is not a separate validation over the receipt.<br><br>Consequence for implementation: this is **not** produced by `ValidateReceipt`, which sees only a receipt and cannot know what the user has ticked. It belongs with airport readiness, alongside the other checklist state. The tick persists and never silently resets (see `UJ-017`): someone who ticks eight receipts at 22:00 must find them ticked at 06:00, because a vanished tick is indistinguishable from one never made and costs trust in every other tick on the screen. | Warn |
| **DR-079** | Every traveler on the trip must have at least one claimable receipt before their Airport Mode checklist is shown; otherwise show "nothing to do" rather than an empty list. | Inform |
| **DR-080** | Kaeru never blocks a user from doing something the law permits. Validation informs; the user decides. | Principle |

---

## 8. Operator catalog (data)

Shape:

```ts
type Operator = {
  id: string;
  name: { ja: string; en: string; "zh-TW": string };
  url: string;
  registrationMethod: ("receipt_qr" | "app" | "web" | "counter" | "pos_terminal")[];
  refundMethods: ("credit_card" | "bank_transfer" | "qr_payment" | "cash" | "paypal" | "points")[];
  feeNote: { en: string; "zh-TW": string } | null;   // null = unknown, must render as unknown
  feeSourceDate: string | null;                       // ISO date the fee was observed
  status: "confirmed-official" | "reported-media" | "unconfirmed";
};
```

The ten operators below appear on the National Tax-Free Shop Association's list of approved transmitting operators **expected to support refunds** `[S9]`. The association states the list reflects operators' own declarations and is **not** an endorsement, approval or guarantee — that caveat must be carried into the UI. A separate figure of **12** tax-free system operators overall is reported in Taiwanese media `[S16]`; the two counts measure different things.

| id | ja | en | zh-TW | URL | Registration | Refund methods | Fee (observed) |
|---|---|---|---|---|---|---|---|
| `jj-taxfree` | 株式会社J&J Tax Free | J&J Tax Free (J-TaxRefund) | J&J Tax Free（J-TaxRefund） | <https://j-taxfree.jp/> | Receipt QR / in-store QR → web (J-TaxRefund); register once | Credit card, QR payment, bank account, cash | Unknown |
| `pie-vat` | 株式会社Pie Systems Japan | PIE VAT | PIE VAT | <https://pievat.com/japan> | App, staffed tax-free counters at 28 malls | Credit card, 135 currencies supported, Alipay planned | ~3% reported by travelers `[S18]` |
| `smart-detax` | スマートテクノロジーズ＆リソーシーズ株式会社 | Smart Detax (JPrefund) | Smart Detax（JP Refund） | <https://smartdetax.com/> | App at the till; cash-refund hardware integration | Cash via change machine, Alipay, WeChat Pay, UnionPay, credit card | Merchant-side plans include a customer-pays option `[S22]` |
| `global-blue` | Global Blue TFS Japan 株式会社 | Global Blue | 環球藍聯 Global Blue | <https://www.globalblue.com/ja> | Counter and app; long-standing international operator | Credit card, cash | Unknown; travelers praise its tracking app `[S18]` |
| `tourego` | Tourego Japan 株式会社 | Tourego | Tourego | <https://tourego.com/> | Smartphone, scan passport or QR, ~30 s | Per operator | **1.5%** of tax-free sales, "in principle paid by the tourist" `[S23]` |
| `jptaxfree` | 株式会社日本免税 | Japan Tax Free | 日本免稅 | <https://jptaxfree.com/> | POS / tablet / dedicated terminal | Unknown | Unknown |
| `wamazing` | WAmazing 株式会社 | WAmazing | WAmazing | <https://corp.wamazing.com/> | App / dedicated terminal | Unknown | Unknown |
| `global-tax-free` | Global Tax Free 株式会社 | Global Tax Free | Global Tax Free | <https://www.global-taxfree.jp/> | POS / tablet / PC | Unknown | Unknown |
| `intasect` | Intasect Communications 株式会社 | Intasect (InTaxFree Refund) | Intasect（InTaxFree） | <https://intapay-payment.intasect.com/intaxfree-refund> | POS / tablet / PC | Unknown | Unknown |
| `ocean` | 株式会社Ocean | Ocean | Ocean | <https://ocean.inc/> | Receipt QR → web, no app install | PayPal, bank transfer; **credit card (Visa / UnionPay only, no JCB) added 2026-07-16**; currencies incl. TWD and JPY | **2.2%** handling fee reported 2026-06; from 2026-07-16: PayPal 0.33% + from ¥40, credit card 0.5% of tax-excluded price, minimum ¥180 `[S19][S20]` |

| ID | Rule | Status |
|---|---|---|
| **DR-050** | The operator may be unknown indefinitely. `operatorId == null` is a valid, non-error state, because the traveler genuinely cannot know it at the till. | `unconfirmed` that any pre-purchase directory exists (UR-05) |
| **DR-051** | Fee data is volatile, unregulated and carries an observation date. Ocean's terms changed materially within four weeks. Fees must be editable by the user and must render as "unknown" rather than zero when absent. | `confirmed-official` that fees are unregulated `[S3]`; figures `reported-media` |
| **DR-052** | Kaeru never submits anything to an operator, never scrapes one, and never stores operator credentials. It links out. | n/a (brief non-goal) |
| **DR-053** | The association list is a declaration of intent, not an approval or guarantee. UI must not imply Kaeru or the Japanese state vouches for any operator. | `confirmed-official` `[S9]`, `[S3]` |

---

## 9. Uncertain rules and recommended product behaviour

These are the rules no published source settles as of 2026-10-05. Each must be **configurable**, and QA may treat the related tests as non-blocking.

| ID | Uncertainty | Recommended behaviour | Config |
|---|---|---|---|
| **UR-01** | Is the ¥5,000 threshold per **passport** or per transaction/customer at the shop? Official text ties eligibility to the 免税購入対象者, which implies per passport, but never says so in those words. | Assume **per passport**; group the threshold indicator by `(shop, day, traveler)`. Phrase the indicator as information, never as a guarantee. | `threshold.scope = shop_day_traveler` |
| **UR-02** | Do **multiple receipts** at the same shop on the same day aggregate towards ¥5,000? Nothing in the refund-method material addresses it. | Show the aggregate **and** the per-receipt figure, and say aggregation depends on the shop. Never tell the user a second visit will definitely combine. | `threshold.aggregateSameShopDay = true (display-only)` |
| **UR-03** | How much airport time to allow. No official number. | Default **60 minutes** on top of the airline's check-in requirement, user-adjustable, always labelled as Kaeru's recommendation. | `airport.bufferMinutes = 60` |
| **UR-04** | Red-result probability, and whether selection is random or risk-scored. | Never state or imply a probability. Treat red as an ordinary branch with equal weight in the UI. | — |
| **UR-05** | Can a traveler know a shop's operator **before** paying? | Assume no. Default `operatorId` to null; resolution path is the receipt QR, after the fact. | — |
| **UR-06** | Will airport **cash** refunds actually be available? Listed as possible by both agencies; no operator has announced counters. | List cash as a possible method, never promise it. | `operator.refundMethods` data |
| **UR-07** | Timezone handling of the purchase date when the device is not in JST. | Treat purchase dates as **JST calendar dates**. This matters at the 2026-10-31/11-01 boundary (`DR-002`) and at the 2027-03-31/04-01 rate boundary (`DR-023`). | `dates.purchaseTimezone = Asia/Tokyo` |
| **UR-08** | Will the **1% food rate** take effect on 2027-04-01? Cabinet decision 2026-09-15; bill not yet passed. | Ship the rate as dated data with `effectiveFrom` / `effectiveTo` and a `pending` flag. If it does not pass, change data, not code. | `taxRates[]` |
| **UR-09** | Do thresholds combine across tenants at a department store or mall tax-free counter? Delegated counters survive the reform with a same-day constraint, but nothing says whether totals combine. | Treat each tenant shop as its own shop. Note the uncertainty in the guide. | `threshold.scope` |
| **UR-10** | Is the kiosk step mandatory if the traveler simply forgoes the refund (e.g. fees exceed the tax)? Nothing says it is; they paid tax normally. | Allow `not_claiming` freely and do not nag. Do not assert that skipping is permitted — present it as the user's choice about their own money. | — |
| **UR-11** | Recourse if customs confirms but the refund never arrives. No published dispute process. | Provide the operator's contact link and the facts needed to chase. Do not promise an outcome. | `refund.overdueDays` (user-set) |
| **UR-12** | Must a card refund go to the **same card** used for the purchase? Asserted by travelers, not by any operator documentation we found. | Record the refund destination per operator; do not assert the constraint. | — |

---

## 10. Privacy and storage constraints

| ID | Rule |
|---|---|
| **DR-040** | All data is stored **on the device**. No server, no account, no analytics, no telemetry. |
| **DR-041** | **Full passport numbers are never stored.** At most the last 4 characters, and only for disambiguating travelers. No field in any entity may hold a complete passport number, and no import path may create one. |
| **DR-042** | Receipt photos stay on device and are included in export only when the user explicitly opts in. |
| **DR-043** | Export / import is user-driven and local. Import must validate against §7 and must reject records containing anything that looks like a full passport number (`DR-041`). |
| **DR-044** | Kaeru holds no operator or bank credentials, ever. |

---

## 11. Source index

Source IDs `[S1]`–`[S25]` resolve in `docs/research/tax-free-system-2026.md` § Sources, each with a URL and the access date **2026-10-05**. The load-bearing ones for this document:

- `[S1]` Japan Tourism Agency traveler page — <https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html>
- `[S2]` Japan Tourism Agency traveler FAQ — <https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00023.html>
- `[S3]` National Tax Agency refund-method hub, incl. 返金手続について — <https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/format/002.htm>
- `[S4]` Japan Tourism Agency eligible-purchaser list (PDF) — <https://www.mlit.go.jp/kankocho/tax-free/content/001981481.pdf>
- `[S5]` Japan Tourism Agency old-vs-new comparison (PDF) — <https://www.mlit.go.jp/kankocho/tax-free/content/001977883.pdf>
- `[S6]` National Tax Agency No.6371 端数計算 — <https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6371.htm>
- `[S7]` National Tax Agency English leaflet, incl. the 90-day definition and worked example — <https://www.nta.go.jp/publication/pamph/shohi/menzei/202506/pdf/0025006-106.pdf>
- `[S10]` National Tax Agency 消費税率引下げ特設サイト (1% food rate, 2027-04-01) — <https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/zeiritsuhikisage.htm>
- `[S9]` National Tax-Free Shop Association refund-method explainer and operator list — <https://zenmenkyo.jp/refund-top/refund-system-2026/>
- `[S24]` Japan Customs departure procedures — <https://www.customs.go.jp/kaigairyoko/syukkoku.htm>
