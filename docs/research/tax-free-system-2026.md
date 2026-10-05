# Japan's Tax-Free Refund Method (リファンド方式), from 2026-11-01

| | |
|---|---|
| Status | v1.0 |
| Author | Japan travel expert |
| Research date | 2026-10-05 (all access dates below are 2026-10-05 unless stated) |
| Tracking | Issue #2 |
| Consumers | `docs/product/domain-rules.md`, `docs/product/user-journey.md`, `docs/content/` |

## How to read this document

Every factual claim carries an evidence tag. Nothing in this document is first-hand: the system starts on **2026-11-01**, which is 27 days after the research date, so no traveler has yet walked through it.

| Tag | Meaning |
|---|---|
| **[C]** Confirmed | Stated by Japan Tourism Agency (観光庁), National Tax Agency (国税庁), Japan Customs (税関) or the Digital Agency. |
| **[R]** Reported | Media, industry association, or refund operator publication. Plausible, not a government statement. |
| **[E]** Expected | Our inference from the above, or an operational detail nobody has published. Must be treated as a product assumption, not a fact. |

Source numbers `[S1]`–`[S24]` resolve in [Sources](#sources).

---

## 1. One-paragraph summary

Until 2026-10-31 a visitor shows a passport at the till and pays the tax-excluded price. From **2026-11-01** the visitor pays the **tax-inclusive** price, and the consumption tax comes back only after Japan Customs confirms at departure that the goods are actually leaving Japan. Confirmation happens at a kiosk in the landside departure lobby **before baggage drop**, within **90 days of purchase**, and the money is paid later by the shop or by a refund operator the shop has contracted. **[C]** `[S1][S2][S7]`

## 2. Step-by-step mechanics

### 2.1 In the shop

| # | What happens | Evidence |
|---|---|---|
| 1 | You show your passport (or the Visit Japan Web tax-free QR code, if the shop supports it). | **[C]** `[S1]`, QR: **[R]** `[S12][S16]` |
| 2 | You pay the **tax-inclusive** price. There is no discount at the till any more. | **[C]** `[S1][S7]` |
| 3 | The shop transmits purchase record information (購入記録情報) to the National Tax Agency's tax-free sales management system, itself or through an approved transmitting operator (承認送受信事業者). | **[C]** `[S3][S7][S9]` |
| 4 | The shop tells you how to register a refund destination. In practice: a QR code printed on the receipt or displayed at the till, leading to the operator's web page or app. | Requirement to inform: **[C]** `[S2]`. QR-on-receipt mechanic: **[R]** `[S13][S19][S20]` |
| 5 | You register once per operator: passport data, contact details, refund destination (card / bank / e-wallet). Later receipts from shops using the same operator attach automatically. | **[R]** `[S13][S20]` |

Note on step 4/5: the National Tax Agency states plainly that **the law prescribes no rules at all for how refunds are carried out** `[S3]`. The registration experience is therefore an operator product decision, not a legal standard, and will differ shop by shop. **[C]**

### 2.2 At departure

See [section 6](#6-customs-confirmation-at-departure) — this is the part that decides whether you get paid.

### 2.3 After customs

| # | What happens | Evidence |
|---|---|---|
| 6 | Customs records the export confirmation (税関確認情報). Preserving that record is what legally makes the sale tax-free. | **[C]** `[S3][S7]` |
| 7 | The shop, or the refund operator acting for it, pays you the consumption-tax amount by the method you registered. | **[C]** `[S1][S2][S3]` |
| 8 | Timing and fees are set by the shop/operator, not by law. "Ask the tax-free shop" is the official answer. | **[C]** `[S2][S3]` |

---

## 3. Eligibility

### 3.1 Who

| Group | Requirement | Documents to present | Evidence |
|---|---|---|---|
| Foreign nationals, non-resident | Must be verifiable as **less than 6 months since entry** into Japan (excluding diplomatic / official / US-forces status). Typical tourist status is 短期滞在 ("Temporary Visitor"). | Passport | **[C]** `[S4]` |
| Cruise-ship landing permit holders (船舶観光上陸許可) | New: passport **in addition to** the landing permit. A copy of the passport is acceptable for this group. | Passport (or copy) + landing permit | **[C]** `[S4][S5]` |
| Crew / emergency / shipwreck landing permits | New: passport in addition to the permit. | Passport + permit | **[C]** `[S4][S5]` |
| Japanese nationals, non-resident | Lived abroad continuously **2 years or more**, and **less than 6 months** since the temporary return. | Passport + one of: copy of 戸籍の附票, 在留証明, **or My Number Card** (new; must show the move abroad; smartphone My Number Card counts). Permanent-domicile (本籍) entry no longer required. | **[C]** `[S4][S5][S2]` |

A Taiwanese tourist on a normal short visit is covered by row 1 with nothing but a passport. **[E]**

### 3.2 Which goods

| Rule | Value | Evidence |
|---|---|---|
| Minimum purchase | **Tax-excluded total of ¥5,000 or more**, same shop, same day. Unchanged from the old system. | **[C]** `[S1][S5][S7]` |
| General goods vs consumables | **Distinction abolished.** One combined total; drugstore snacks and a jacket now add up together. | **[C]** `[S1][S5][S7]` |
| Upper limit | **None.** The ¥500,000 consumables cap is abolished. | **[C]** `[S5][S7]` |
| Special sealed packaging for consumables | **Abolished.** | **[C]** `[S1][S5][S7]` |
| "Not for business use" check | **Abolished** as a requirement. | **[C]** `[S5][S7]` |
| Quantity | Limited to what **you can personally carry out of Japan at departure**. This replaces the old purpose test. | **[C]** `[S1][S2][S5]` |
| Excluded goods | ① gold and platinum bullion; ② **gold coins and platinum coins** (newly added); ③ goods not subject to consumption tax. | **[C]** `[S1][S5]` |
| High-value goods | Tax-excluded **unit price ¥1,000,000 or more**: the shop must transmit "product information details" (brand, model, shape, colour, presence of a certificate; serial number for items such as watches). Customs may ask you to show the certificate of authenticity or warranty. | **[C]** `[S2][S5][S7]` |

**Trap:** abolishing the sealed packaging does **not** mean you may use the goods in Japan. If you eat, drink or use a consumable before departure, you cannot get customs confirmation for it, and you must tell a customs officer rather than use the kiosk. **[C]** `[S1][S2]`

### 3.3 Separate shipment (別送) — gone

The old practice of mailing your tax-free purchases home yourself and proving export with a shipping slip was **abolished on 2025-03-31**, before this reform. It is not coming back. Shop-operated direct shipping (直送) still exists but is now handled under Consumption Tax Act Article 7 (export exemption) and does not go through the tax-free sales procedure at all. **[C]** `[S5][S7]`

---

## 4. The 90-day rule

- You must leave Japan and complete customs confirmation **within 90 days of the purchase date**. **[C]** `[S1][S7]`
- Official counting method: **"the period from the day following the date of purchase to the 90th day."** The National Tax Agency's own worked example: purchase on **November 1** → customs deadline **January 30 of the following year**. **[C]** `[S7]`
- The deadline is **per purchase**, not per trip. Each receipt carries its own clock.
- For a typical 4–7 day leisure trip the rule never binds. It matters for long stays, repeat entries during one 90-day window, and changed departure dates. **[E]**

Cross-check of the official example: 2026-11-01 + 90 days counted from 2026-11-02 = 2027-01-30. November 29 days remaining + December 31 + January 30 = 90. The arithmetic is consistent, so we can implement it literally. **[C]**

---

## 5. Differences from the old system

Consolidated from the Japan Tourism Agency comparison table `[S5]` and the National Tax Agency English leaflet `[S7]`. All rows **[C]**.

| Item | Until 2026-10-31 | From 2026-11-01 |
|---|---|---|
| Price paid at the till | Tax-excluded (exempt on the spot) | **Tax-inclusive (taxed)** |
| When you get the tax | Never paid in the first place | **Refunded after customs confirms export** |
| Minimum | ¥5,000 tax-excluded, same shop, same day | **Unchanged** |
| General goods / consumables split | Yes, separate thresholds | **Abolished, combined** |
| Consumables cap ¥500,000 | Yes | **Abolished** |
| Special sealed packaging | Required for consumables | **Abolished** |
| Purpose-of-use check | Required | **Abolished**; replaced by "quantity you can personally carry out" |
| Export deadline | Carry goods out at departure | **Depart and get customs confirmation within 90 days of purchase** |
| Customs step | Passport presented at customs; in practice often after security | **Kiosk/online in the landside departure lobby, before baggage drop** |
| Excluded goods | Business/resale-evident goods; gold & platinum bullion; non-taxable goods | Gold & platinum bullion; **gold & platinum coins**; non-taxable goods |
| High-value goods | No special rule | **Tax-excluded unit price ≥ ¥1,000,000: product details incl. serial numbers transmitted** |
| Tax-free shop categories | General type / procedure-entrustment type | **Merged into one**; shops not digitised by 2026-10-31 lose their permit |
| Separate shipment (別送) | Abolished 2025-03-31 | Still abolished |
| Penalty | Tax collected if goods not held at departure | Tax collected **and penalty provisions** if confirmed goods are not exported promptly |

Note on the transition: there is **no overlap period**. The applicable system is decided by the **purchase date**. A trip spanning 2026-10-31/11-01 will contain receipts under both systems. **[C]** `[S7][S14]`

---

## 6. Customs confirmation at departure

This is the single highest-risk moment for the traveler and the core of Kaeru's value.

### 6.1 The sequence

All steps **[C]** unless marked, from `[S1]` and `[S2]`:

1. **Arrive at the airport early.** Confirmation — including an inspection if you get one — must be finished **before check-in / baggage drop**.
2. **Go to the international departure lobby, landside, before baggage drop.** The tax-free kiosks (免税手続用の端末 — kiosk terminals or electronic terminals) and the customs inspection point are installed there.
3. **Have every tax-free item physically with you.** You cannot do this after your bags are checked, and you may **not** ask the airline to retrieve checked baggage for a tax-free procedure.
4. **Present your passport at the kiosk.** Reading the passport to showing a result takes **a few seconds**.
   - At seven high-traffic airports — **Narita, Haneda, Kansai, Chubu, Fukuoka, New Chitose, Naha** — you may instead complete it **online via Visit Japan Web**, but only inside the dedicated procedure Wi-Fi area of the international departure lobby, i.e. **before the security checkpoint**.
5. **Read the result.**
   - **Green (グリーン判定)** — no inspection needed, customs confirmation is complete.
   - **Red (レッド判定)** — go to the customs inspection point and present the goods.
6. **Then** check in and drop your bags.

### 6.2 The receipt-unit rule

> Customs confirmation is performed **per single purchase transaction (one receipt)**. If even one of the tax-free items on that receipt is not in your possession, **none** of the items on that receipt — including the ones you do have — can be confirmed, and that receipt's consumption tax is not refunded. **[C]** `[S1][S2]`

This is the rule that will cause the most lost refunds, and it is counter-intuitive: travelers will expect partial refunds. It also means the practical advice is a **purchasing** behaviour, not an airport behaviour: do not put "will definitely eat this in Japan" items in the same transaction as items you will carry home. **[C]/[E]** `[S2][S14][S15]`

### 6.3 Consumed or missing goods

If you have consumed all or part of a consumable, **do not use the kiosk** for that receipt. Report it to a customs officer at the counter. **[C]** `[S1][S2]`

### 6.4 Failure modes that void the refund

| Situation | Outcome | Evidence |
|---|---|---|
| Goods already checked in as baggage, then a red result | Baggage cannot be retrieved → cannot present goods → no confirmation, no refund | **[C]** `[S1][S2]` |
| One item from a receipt missing | Entire receipt rejected | **[C]** `[S1][S2]` |
| Consumable consumed in Japan | That receipt not refundable; declare to officer | **[C]** `[S1][S2]` |
| Departure more than 90 days after purchase | Not eligible | **[C]** `[S1][S7]` |
| Procedure done at a domestic transfer airport | Invalid; must be done at the **final** airport you leave Japan from | **[C]** `[S1][S2]` |
| You abandon the inspection because you are late for check-in | Treated as **not** having received customs confirmation. Neither the airline nor customs compensates you if you miss your flight over this. | **[C]** `[S1]` |
| Confirmed goods not actually exported | Consumption tax collected **and** penalty provisions apply | **[C]** `[S1][S2][S7]` |

### 6.5 Edge itineraries

| Itinerary | Where to do it | Evidence |
|---|---|---|
| Domestic flight → international flight | At the **final departure airport** from Japan | **[C]** `[S1][S2]` |
| Cruise starting/ending outside Japan | At the **last domestic port**, before baggage handover | **[C]** `[S2]` |
| "Fly & Cruise": Japan-departing cruise that calls abroad and returns, then you fly home | At the **airport**, when you finally depart Japan. Nothing to do at the cruise departure. | **[C]** `[S1][S2]` |

### 6.6 How much time to allow

Officially: the kiosk itself is "a few seconds", but if you are selected for inspection you need queueing and inspection time, so "arrive early". No number is published. **[C]** `[S1][S2]`

English-language travel guides have begun recommending **45–60 minutes beyond your usual airport routine, more at peak times**. That figure is media guidance, not official. **[R]** `[S21]`

Japan Customs' own medium-term strategy document acknowledges that "because all foreign travelers seeking tax exemption will now carry out procedures at customs, customs workload is expected to increase substantially" — which is an official signal that queues are anticipated. **[C]** `[S17]`

Kaeru should present a configurable recommendation and be explicit that it is our advice, not a rule. **[E]**

---

## 7. Refund mechanics: who pays, how, when, how much is taken

### 7.1 Who pays

The refund is **not** paid by the Japanese government. It is paid by the tax-free shop, or by a refund operator (返金事業者) the shop has delegated to. **[C]** `[S1][S3]`

The ecosystem has three roles, which may or may not be the same company **[C]** `[S9]`:

| Role | Japanese | Does what |
|---|---|---|
| Tax-free shop | 免税店 / 輸出物品販売場 | Verifies the purchaser, creates the purchase record, ultimately owes you the money |
| Approved transmitting operator | 承認送受信事業者 | Sends purchase records to the NTA and retrieves customs confirmation results on the shop's behalf |
| Refund operator | 返金事業者 | Actually pays you, by card / QR payment / cash / transfer |

Shops choose one of three patterns: delegate refunds to their transmitting operator, delegate to a different operator, or refund travelers directly. **[C]** `[S9]`

### 7.2 Methods

Methods the Japan Tourism Agency and National Tax Agency list as possible: **bank transfer, credit-card transfer, app transfer, and cash inside the departure port after customs confirmation**. Which ones you actually get depends on the shop. **[C]** `[S2][S3]`

Operators are also legally permitted to refund as **points/store credit**. **[R]** `[S14]`

Refund operators must register as a **funds-transfer business (資金移動業)** under the Payment Services Act before paying refunds, and are subject to anti-money-laundering identity checks and foreign-exchange law screening. **[C]** `[S3][S9]` Pie Systems Japan announced completion of its Type II funds-transfer registration on 2026-10-01. **[R]** `[S11]`

### 7.3 Timing

"In principle after the tax-free sale is established by customs confirmation at the airport/port; ask the tax-free shop for details." No service-level standard exists. **[C]** `[S2]`

### 7.4 Fees — the part nobody announces up front

There is no legal cap, no legal disclosure requirement, and no standard. **[C]** `[S3]` What is publicly documented:

| Operator | Fee | Evidence |
|---|---|---|
| Tourego | **1.5%** of the tax-free sales amount, "in principle paid by the tourist" (merchant-pays option exists) | **[C-operator]** `[S23]` |
| Ocean | **2.2%** handling fee reported by a traveler in June 2026 | **[R]** `[S19]` |
| Ocean (after 2026-07-16 revision) | PayPal: overseas remittance fee **0.33% + from ¥40**. Credit card: **0.5% of the tax-excluded price, minimum ¥180**. | **[R]** `[S20]` |
| PIE VAT | ~**3%** reported by travelers; one reports netting ~7% of a 10% tax | **[R]** `[S18]` |
| Smart Detax | Offers merchants a "customer-pays" (顧客負担型) free plan, i.e. the traveler funds the service | **[C-operator]** `[S22]` |

**The fee that actually hurt people was not the operator's.** A Taiwanese traveler who bought ¥19,805 (≈¥1,980 of tax) through Ocean received **NT$77** after the operator's 2.2% and his Taiwanese bank's inbound foreign-remittance charge. Another case: ¥1,100 of tax, NT$40 operator fee, NT$400 bank inbound FX fee → **net zero**. Taiwanese banks typically charge **NT$200–400+** to receive a foreign remittance, and refusing the transfer also costs a fee. **[R]** `[S18][S19][S20]`

Product consequence: for small receipts, a bank-transfer refund can be worth **less than nothing**. Kaeru must let users record the fee and must not display a naive "10% is coming back". **[E]**

### 7.5 Refund amount

Nothing official defines the refunded amount beyond "the amount equivalent to consumption tax" (消費税相当額). **[C]** `[S1][S7]` Minus whatever the operator deducts. So:

```
estimated refund = consumption tax on the receipt − operator fee − receiving-side charges
```

with the second and third terms usually unknown at purchase time. **[E]**

---

## 8. Consumption tax rates — and a change already scheduled

| Rate | Applies to | Period | Evidence |
|---|---|---|---|
| 10% | Standard | Current | **[C]** `[S6][S8]` |
| 8% | Food and drink (excluding alcohol and eat-in), newspapers on subscription | Current | **[C]** `[S6][S8]` |
| **1%** | **Food and drink** (same scope as the current 8% category) | **2027-04-01 to 2029-03-31** | **[C, pending legislation]** `[S8][S10]` |
| 8% | Newspapers on subscription | Continues through the above period | **[C, pending legislation]** `[S10]` |

This is not speculation about a possible reform: the National Tax Agency has opened a dedicated site, and the cabinet decision ("飲食料品消費税率の臨時的な引下げ及び就業者負担軽減支援金の導入に関する大綱") is dated **2026-09-15**. The agency states explicitly that the content applies **if the bill is submitted to and passed by the Diet**. **[C]** `[S8][S10]`

**Why this matters to Kaeru:** a drugstore receipt dated 2027-04-02 has a food line taxed at 1%, not 8%. Our refund estimate would be wrong by a factor of eight on that line. Tax rates must be **dated data**, resolved by purchase date — never constants in code. This single finding justifies the brief's "rules live as data" constraint on its own. **[E]**

### 8.1 Getting the tax out of a tax-inclusive price

Japanese tax arithmetic, for a receipt line at rate *r*:

```
tax_excluded = tax_included × (100 / (100 + r_percent))     # 100/110 at 10%, 100/108 at 8%
tax          = tax_included − tax_excluded
```

Rounding: the National Tax Agency's rule for qualified invoices is that fractions under ¥1 are rounded **once per tax rate per invoice**, and the **method (round up, round down, round half up) is the issuer's free choice**. Per-item rounding then summed is explicitly **not permitted**. **[C]** `[S6]`

Consequence for us: we cannot reproduce a shop's printed tax figure to the yen with certainty, because we do not know which rounding method that shop uses. Any number Kaeru computes is an **estimate**, and where the receipt prints a tax amount we should prefer the printed figure. **[E]**

---

## 9. Visit Japan Web

- Visit Japan Web is the Digital Agency service for arrival procedures (immigration, customs declaration) **and "tax-free shopping service"**. **[C]** `[S12]`
- Two distinct uses, which travelers and even some media conflate:
  1. A **tax-free shopping QR code** presented in the shop in place of the passport — only at shops that support it. **[C]** `[S12]`; shop-dependence **[R]** `[S13]`
  2. An **online alternative to the departure kiosk**, at the seven listed airports, inside the departure-lobby procedure Wi-Fi area, before security. **[C]** `[S1][S2]`
- The exact departure-side flow has not been published in detail. A Taiwanese aviation blogger notes "this part of the procedure has not been made public". **[R]** `[S13]`

Product consequence: Kaeru should mention Visit Japan Web as a possible faster path and link out, but must not depend on it or describe screens we have not seen. **[E]**

---

## 10. Why Japan is doing this

The stated purpose is to stop tax-free goods being resold inside Japan and to remove the burden on shops of policing that. **[C]** `[S3][S17]`, restated in media `[S14]`. Japan Customs' 2030 strategy frames it as "proper enforcement of the consumption tax exemption system for foreign travelers" and notes the resulting workload increase. **[C]** `[S17]`

Worth recording because Taiwanese commentators dispute the proportionality — PTT discussion argues the fraud caught is small relative to the friction imposed, and suspects the main beneficiaries are the intermediaries collecting fees. **[R]** `[S18]` Kaeru takes no position; we record it because it predicts user sentiment, and user sentiment sets the tone our copy must answer.

---

## 11. Media accuracy check

The PM's starting links were verified against the official sources. Findings:

| Source | Verdict |
|---|---|
| bnext `[S14]` | Accurate. Cites the Japan Tourism Agency pages and comparison PDF directly; its tables match them. Safe to cite as a zh-TW explainer. |
| jesselin `[S13]` | Accurate and unusually deep (read the shop-facing documents). Only soft spot: says "ten refund operators" while the association list shows ten rows for refund-capable operators, and the udn piece says twelve operators exist overall — both can be true at different scopes. |
| udn `[S16]` | Accurate as reportage; its content is a summary of a commentator's Facebook post, reporting the association's August 2026 data: **12** tax-free system operators exist, with Taiwanese travelers concentrated on four. Second-hand. |
| funliday `[S15]` | **Contains an error.** Its comparison table states the threshold as "單日單店未稅滿 5,500 日圓" (¥5,500) in both the old and new columns, while its own body text later says ¥5,000. The official figure is **¥5,000**. Do not cite funliday for numbers. |

This is exactly why the domain rules carry source URLs: a popular Taiwanese travel site is currently publishing a wrong threshold.

---

## 12. Open questions

Things we could not answer from published sources as of 2026-10-05. These flow into `docs/product/domain-rules.md` §"Uncertain rules" with recommended fallback behaviour.

| # | Question | Why it matters | Current best answer |
|---|---|---|---|
| Q1 | Is the ¥5,000 threshold judged per **passport** or per transaction/customer at the shop? | A family paying together on one receipt vs. three passports. | Official text says "same shop, one day, ¥5,000 tax-excluded" against the 免税購入対象者 (eligible purchaser). **[E]** It is per eligible purchaser, i.e. per passport. Not stated in those words anywhere we found. |
| Q2 | Do multiple receipts at the same shop on the same day aggregate towards ¥5,000? | Two ¥3,000 drugstore visits. | Under the old system shops aggregated same-day purchases at their discretion/procedure. Nothing in the refund-method material addresses it. Treat as shop-dependent. **[E]** |
| Q3 | Exactly how much airport time to allow? | Our single most actionable piece of advice. | No official figure. Media says 45–60 min extra. **[R]** `[S21]` |
| Q4 | What is the probability of a red result, and is it random or risk-scored? | Changes how we frame it to users. | Not published. The Taiwanese expert community expects a Korea-like random/risk mechanism. **[E]/[R]** `[S13]` |
| Q5 | Which operator does a given shop use, and can a traveler know before buying? | Users on PTT asked exactly this and got no answer. | No directory exists. The receipt QR is the only reliable signal, i.e. you find out after paying. **[E]** `[S18]` |
| Q6 | Are cash refunds at the airport actually going to be widely available? | Would remove the whole fee problem for small amounts. | Listed as a possible method by both agencies; no operator has announced airport cash counters. **[C] for possibility, [E] for availability** `[S2][S3]` |
| Q7 | Can you decline/skip the refund for a receipt without consequence? | A traveler who realises the fee exceeds the tax. | Nothing says the kiosk step is mandatory if you simply forgo the refund; you paid tax normally. PTT reached the same conclusion informally. **[E]** `[S18]` |
| Q8 | Will the food rate really drop to 1% on 2027-04-01? | Eight-fold error in refund estimates on food lines. | Cabinet decision made 2026-09-15; **bill not yet passed**. **[C, pending]** `[S8][S10]` |
| Q9 | Do shops aggregate across brands inside one department store / mall? | Mall tax-free counters serve many tenants. | Tax-free counters (委託型) exist and the merged shop category keeps them, with the constraint that the procedure must be same-day as the sale. Whether thresholds combine is not stated. **[E]** `[S7][S9]` |
| Q10 | What happens if customs confirms but the refund never arrives? | Our users will ask. | No published dispute process. Recourse is the shop/operator. **[E]** `[S2][S3]` |

---

## 13. Glossary

| Japanese | zh-TW | English | Note |
|---|---|---|---|
| 消費税 | 消費稅 | Consumption tax | 10% standard, 8% reduced |
| 免税 | 免稅 | Tax-free / tax exemption | |
| 輸出物品販売場 | 出口物品販售場（免稅店） | Export goods sales place | The legal term for a tax-free shop |
| 免税店 | 免稅店 | Tax-free shop | Everyday term |
| リファンド方式 | 退款制（先付後退） | Refund method | The new system |
| 免税購入対象者 | 免稅購買對象者 | Eligible tax-free goods purchaser | The legal category you must fall into |
| 一般物品 | 一般物品 | General goods | Category abolished 2026-11-01 |
| 消耗品 | 消耗品 | Consumables | Category abolished 2026-11-01 |
| 税込価格 | 含稅價 | Tax-inclusive price | What you now pay |
| 税抜価格 | 未稅價 | Tax-excluded price | What the ¥5,000 threshold is judged on |
| 購入記録情報 | 購買紀錄資訊 | Purchase record information | Sent by the shop to the NTA |
| 税関確認 | 海關確認 | Customs confirmation | The step that makes the exemption real |
| 持出し確認 | 攜出確認 | Export confirmation | Same thing, seen from customs' side |
| 免税手続用の端末 | 免稅手續機台 | Tax-free procedure terminal | Kiosk or electronic terminal |
| キオスク端末 | KIOSK 自助機台 | Kiosk terminal | |
| グリーン判定 | 綠燈 | Green result | No inspection needed |
| レッド判定 | 紅燈 | Red result | Inspection required |
| 税関検査 | 海關檢查 | Customs inspection | |
| 受託手荷物 | 託運行李 | Checked baggage | Must come **after** customs |
| 手荷物 | 隨身行李 | Carry-on baggage | |
| 搭乗手続 | 登機報到 | Check-in | |
| 返金 | 退款 | Refund (the payout) | |
| 返金事業者 | 退款業者 | Refund operator | Pays you |
| 承認送受信事業者 | 承認傳送接收業者 | Approved transmitting/receiving operator | Talks to the NTA |
| 承認免税手続事業者 | 承認免稅手續業者 | Approved tax-free procedure operator | Runs delegated counters |
| 手数料 | 手續費 | Handling fee | |
| 別送 | 別送（自行寄送） | Separate shipment | Abolished 2025-03-31 |
| 直送 | 直送（店家寄送） | Direct shipping | Shop ships; now under Art. 7 |
| 国税庁 | 日本國稅廳 | National Tax Agency | |
| 観光庁 | 日本觀光廳 | Japan Tourism Agency | |
| 税関 | 海關 | Japan Customs | |
| 旅券 | 護照 | Passport | |

---

## Sources

Government and official (**[C]**):

- `[S1]` Japan Tourism Agency — 旅行者向け特設ページ (traveler special page, refund method). <https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html> — accessed 2026-10-05
- `[S2]` Japan Tourism Agency — 旅行者向け よくある質問（リファンド方式）(traveler FAQ). <https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00023.html> — accessed 2026-10-05
- `[S3]` National Tax Agency — 輸出物品販売場制度のリファンド方式への見直し (hub page, incl. 返金手続について). <https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/format/002.htm> — accessed 2026-10-05
- `[S4]` Japan Tourism Agency — 【旅行者向け】免税購入対象者一覧（リファンド方式）(PDF). <https://www.mlit.go.jp/kankocho/tax-free/content/001981481.pdf> — accessed 2026-10-05
- `[S5]` Japan Tourism Agency — 手続の変更点（比較表）(PDF). <https://www.mlit.go.jp/kankocho/tax-free/content/001977883.pdf> — accessed 2026-10-05
- `[S6]` National Tax Agency — タックスアンサー No.6371 端数計算 (as of 2026-04-01). <https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6371.htm> — accessed 2026-10-05
- `[S7]` National Tax Agency — "Tax-Free Shopping System will be shifted to the Refund Method from November 2026" (English, April 2025, PDF). <https://www.nta.go.jp/publication/pamph/shohi/menzei/202506/pdf/0025006-106.pdf> — accessed 2026-10-05
- `[S8]` National Tax Agency — 消費税の軽減税率制度・適格請求書等保存方式（インボイス制度）index. <https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/index.htm> — accessed 2026-10-05
- `[S10]` National Tax Agency — 消費税率引下げ特設サイト and 【リーフレット】飲食料品に係る２年間の消費税率引下げについて (2026-09). <https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/zeiritsuhikisage.htm> and <https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/pdf/0026008-127_leaflet.pdf> — accessed 2026-10-05
- `[S12]` Digital Agency — Visit Japan Web. <https://services.digital.go.jp/en/visit-japan-web/> — accessed 2026-10-05
- `[S17]` Japan Customs — 税関中長期構想2030 (PDF), section on proper enforcement of the tax-free refund method. <https://www.customs.go.jp/zeikan/seido/smart/honbun2030.pdf> — accessed 2026-10-05
- `[S24]` Japan Customs — 出国時の税関手続 (departure procedures; "if checking in these goods, get customs confirmation before handing them to the airline"). <https://www.customs.go.jp/kaigairyoko/syukkoku.htm> — accessed 2026-10-05
- Multilingual traveler leaflets (Japan Tourism Agency): zh-TW <https://www.mlit.go.jp/kankocho/tax-free/content/001991249.pdf>, English <https://www.mlit.go.jp/kankocho/tax-free/content/001991247.pdf>, Japanese <https://www.mlit.go.jp/kankocho/tax-free/content/001991246.pdf> — accessed 2026-10-05
- Shop-facing traveler caution leaflet (National Tax Agency), zh-TW: <https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/pdf/caution_ct.pdf> — accessed 2026-10-05

Industry association and operators (**[C-operator]** for their own terms, **[R]** otherwise):

- `[S9]` 全国免税店協会 (National Tax-Free Shop Association) — 【2026年11月1日施行】リファンド方式解説. <https://zenmenkyo.jp/refund-top/refund-system-2026/> — accessed 2026-10-05
- `[S11]` Pie Systems Japan — company news, Type II funds-transfer business registration completed 2026-10-01. <https://pievat.com/japan> — accessed 2026-10-05
- `[S22]` Smart Detax (Smart Technologies & Resources) — service and pricing, incl. customer-pays plan. <https://smartdetax.com/> — accessed 2026-10-05
- `[S23]` Tourego Japan — merchant FAQ, "tourist pays a 1.5% service fee". <https://www.tourego.com/en> — accessed 2026-10-05
- Refund-capable approved operator list (PDF): <https://zenmenkyo.jp/dcms_media/other/henkinjigyousha2603.pdf> — accessed 2026-10-05
- J&J Tax Free — 新免税制度「リファンド方式」について. <https://j-taxfree.jp/tax-free/refund/> — accessed 2026-10-05

Media and traveler discussion (**[R]**):

- `[S13]` 這裡胡說 JL TALKS (傑西大叔) — 2026/11上路 日本免稅制度 重點變化整理. <https://blog.jesselin.com/archives/154534/japan-duty-free-changes-2026/> — accessed 2026-10-05
- `[S14]` 數位時代 BusinessNext — 日本退稅新制11/1上路 (2026-10-01). <https://www.bnext.com.tw/article/92398/japan-tax-free-refund-2026> — accessed 2026-10-05
- `[S15]` Funliday — 2026日本退稅新制 (2026-09-23, updated 2026-10-01). <https://www.funliday.com/posts/japan-taxfree-2026/> — accessed 2026-10-05. **Contains a ¥5,500 threshold error.**
- `[S16]` 聯合新聞網 udn — 日本11月退稅新制上路 專家點名4大系統 (2026-09-27). <https://udn.com/news/story/7266/9779704> — accessed 2026-10-05
- `[S18]` PTT Japan_Travel — [新聞] 日本退稅新制上路「收2次手續費」慘變倒貼 (2026-06-20) and replies. <https://www.ptt.cc/bbs/Japan_Travel/M.1781905642.A.DB5.html> — accessed 2026-10-05
- `[S19]` PTT Japan_Travel — Re: ... first-hand Ocean refund account, ¥19,805 purchase → NT$77 received (2026-06-20). <https://www.ptt.cc/bbs/Japan_Travel/M.1781954991.A.46E.html> — accessed 2026-10-05
- `[S20]` PTT Japan_Travel — Re: ... Ocean adds credit-card refunds 2026-07-16, fee schedule (2026-07-16). <https://www.ptt.cc/bbs/Japan_Travel/M.1784200231.A.D78.html> — accessed 2026-10-05
- `[S21]` English travel guides on airport timing (e.g. Get Around Japan, "Japan Tax Refund 2026"). <https://www.getaroundjapan.jp/archives/8936> — accessed 2026-10-05
- PTT Japan_Travel — [資訊] 旅收 — 日本退稅新制助手, an existing zh-TW receipt-tracking app (2026-07-15). <https://www.ptt.cc/bbs/Japan_Travel/M.1784086076.A.B00.html> — accessed 2026-10-05
