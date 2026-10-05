# Refund Operator Catalog

| | |
|---|---|
| Status | v1.0 |
| Author | Japan travel expert |
| Observation date | 2026-10-05 — **every fee and method below is a snapshot of this date** |
| Tracking | Issue #2 |
| Schema | `docs/product/domain-rules.md` §8 (`DR-050`–`DR-053`) |
| Rendered copy | `docs/content/guide.en.md` / `guide.zh-TW.md` § operators |

Single source of truth for the operator data that ships with Kaeru. The guides render a friendly subset of this; engineering seeds its data file from it.

## Status of this list

These companies appear on the National Tax-Free Shop Association's list of approved transmitting operators **expected to support refunds** under the refund method. The association states explicitly that the list is based on **operators' own declarations** and does **not** represent approval, endorsement or guarantee by the association. The National Tax Agency links to the same list with the same caveat, adding that the state does not thereby warrant anything about the operators.

Kaeru must carry that caveat into the UI. We list operators so that a name on a receipt means something; we are not recommending any of them.

Separately, Taiwanese media reported in September 2026, citing the association's August 2026 data, that **12** tax-free system operators exist overall, with Taiwanese travelers' spending concentrated on four: J&J Tax Free, PIE VAT, Smart Detax (JP Refund) and Global Blue. The ten rows below are the refund-capable subset; the two counts measure different things and neither is wrong.

## Three roles, often one company

| Role | Japanese | zh-TW | Does what |
|---|---|---|---|
| Tax-free shop | 免税店 / 輸出物品販売場 | 免稅店 | Verifies you, creates the purchase record, ultimately owes you the money |
| Approved transmitting operator | 承認送受信事業者 | 承認傳送接收業者 | Sends purchase records to the National Tax Agency, retrieves customs results |
| Refund operator | 返金事業者 | 退款業者 | Actually pays you |

A shop picks one of three patterns: delegate refunds to its transmitting operator, delegate to a different company, or refund you directly. Most of the companies below do both jobs. Refund operators must register as a funds-transfer business (資金移動業) under the Payment Services Act before paying refunds, and are subject to anti-money-laundering identity checks.

## Catalog

### `jj-taxfree` — J&J Tax Free

| | |
|---|---|
| ja | 株式会社J&J Tax Free |
| en | J&J Tax Free (refund portal: J-TaxRefund) |
| zh-TW | J&J Tax Free（退款登錄網站 J-TaxRefund） |
| URL | <https://j-taxfree.jp/> |
| Registration | QR code printed on the receipt or displayed at the till → J-TaxRefund web page. Register passport, contact details and refund destination **once**; later purchases attach automatically |
| Refund methods | Credit card, QR-code payment, bank account, cash |
| Fee | Not published |
| Terminals supported | Smartphone/tablet, POS, PC, dedicated terminal |
| Status | `C-operator` — the registration flow, the QR-on-receipt mechanic and the refund methods are all described on the company's own 免税手続きの流れ page |

### `pie-vat` — PIE VAT

| | |
|---|---|
| ja | 株式会社Pie Systems Japan |
| en | PIE VAT |
| zh-TW | PIE VAT |
| URL | <https://pievat.com/japan> |
| Registration | App; also staffed tax-free counters ("PIE VAT STATION") in around 28 large shopping centres |
| Refund methods | Credit card; 135 currencies supported; Alipay announced as planned |
| Fee | ~3% reported by Taiwanese travelers (one reports netting ~7% of a 10% tax) |
| Notes | Completed Type II funds-transfer business registration on 2026-10-01. Travelers report it as one of the smoother flows, partly because staffed counters exist |
| Status | Fee `reported-media`; registration and methods from the company's own site |

### `smart-detax` — Smart Detax

| | |
|---|---|
| ja | スマートテクノロジーズ＆リソーシーズ株式会社 |
| en | Smart Detax (refund product: JPrefund) |
| zh-TW | Smart Detax（JP Refund） |
| URL | <https://smartdetax.com/> |
| Registration | Handled in-store on the staff's app; the company advertises a ~10-second procedure |
| Refund methods | Cash via an automated change machine at the till, Alipay, WeChat Pay, UnionPay, credit card |
| Fee | Merchant pricing includes a plan explicitly described as customer-funded (顧客負担型), i.e. the traveler pays |
| Notes | Registered with the National Tax Agency as an approved transmitting operator; Kanto Local Finance Bureau registration listed on its site. Began offering refund-method operation ahead of 2026-11-01 |
| Status | `C-operator` for its own published terms |

### `global-blue` — Global Blue

| | |
|---|---|
| ja | Global Blue TFS Japan 株式会社 |
| en | Global Blue |
| zh-TW | 環球藍聯 Global Blue |
| URL | <https://www.globalblue.com/ja> |
| Registration | Counter and app. The long-established international tax-refund operator, familiar to anyone who has shopped in Europe |
| Refund methods | Credit card, cash |
| Fee | Not published for Japan. In Europe its fees are among the higher ones |
| Notes | Taiwanese travelers specifically recommend it for having a tracking app, which is the thing they say the newer operators lack |
| Status | `reported-media` |

### `tourego` — Tourego

| | |
|---|---|
| ja | Tourego Japan 株式会社 |
| en | Tourego |
| zh-TW | Tourego |
| URL | <https://tourego.com/> (EN: <https://www.tourego.com/en>) |
| Registration | Smartphone; scan passport or QR code; advertised as 5 steps in 30 seconds |
| Refund methods | Not itemised publicly |
| Fee | **1.5% of the tax-free sales amount, "in principle paid by the tourist"** (a merchant-pays option exists) |
| Fee basis | **Purchase.** "Of the tax-free sales amount" is the operator's own wording, and 免税売上 is the sale, not the refund. On a ¥10,000 tax-excluded purchase that is ¥150 against a ¥1,000 refund — 15% of the money coming back (`DR-026a`) |
| Notes | Singapore-origin; National Tax Agency approved transmitting operator. Its site is the clearest of the ten about who pays the fee |
| Status | `C-operator` |

### `ocean` — Ocean

| | |
|---|---|
| ja | 株式会社Ocean |
| en | Ocean |
| zh-TW | Ocean |
| URL | <https://ocean.inc/> (service: <https://service.ocean.inc/tax-system>) |
| Registration | QR code on the receipt → web only, no app install. Name, phone, email, passport photo |
| Refund methods | PayPal, bank transfer; **credit card added 2026-07-16 (Visa and UnionPay only — not JCB)**; currencies include TWD and JPY |
| Fee | **Credit-card route, from 2026-07-16: 0.5% of the tax-excluded price, minimum ¥180.** That is the only percentage here with a confirmed basis, so it is the only one shown as one. **PayPal route: a flat ¥40-and-up component, plus a percentage we do not show** — the percentage's basis is unconfirmed, and a yen amount carries no basis risk. The earlier **~2.2%** figure is superseded and its basis is unconfirmed; it survives as narrative in Notes, not as a number anyone can compute with (`DR-026a`) |
| Fee basis | **Credit-card route: purchase** — "未稅價格的 0.5%" is explicit. **PayPal route: unknown**; described as an overseas remittance fee, which suggests the remitted refund, but the wording does not settle it. **The 2.2% figure: unknown basis and superseded** — both a purchase basis and a refund basis fit the two reported cases once the receiving bank's charge is allowed for, so it must not be shipped as a number (`DR-026a`) |
| Notes | **The cautionary tale.** Deployed early at animate, Miki House and Sneaker Dunk. With only PayPal/bank transfer at launch, Taiwanese travelers hit inbound foreign-remittance charges of NT$200–400+ from their own banks: one documented case turned ¥19,805 of purchases (≈¥1,980 tax) into **NT$77**, another turned ¥1,100 of tax into **nothing**. The company offered ¥2,000 compensation in virtual-card or gift-card form and then added credit-card refunds. Shows how fast operator terms move and why fee data needs an observation date |
| Status | Fee and methods `reported-media` (first-hand traveler accounts with screenshots) |

### `jptaxfree` — Japan Tax Free

| | |
|---|---|
| ja | 株式会社日本免税 |
| en | Japan Tax Free |
| zh-TW | 日本免稅 |
| URL | <https://jptaxfree.com/> |
| Registration | **Not itemised publicly.** The association list records only the shop's equipment (POS, tablet, dedicated terminal), which says nothing about what a traveller does |
| Refund methods | Not published |
| Fee | Not published |
| Status | Listed on the association's refund-capable list only |

### `wamazing` — WAmazing

| | |
|---|---|
| ja | WAmazing 株式会社 |
| en | WAmazing |
| zh-TW | WAmazing |
| URL | <https://corp.wamazing.com/> |
| Registration | **Not itemised publicly.** The association list records only the shop's equipment (app, dedicated terminal), which says nothing about what a traveller does |
| Refund methods | Not published |
| Fee | Not published |
| Notes | The only one of the ten that declared support for just one of the three refund delegation patterns |
| Status | Listed on the association's refund-capable list only |

### `global-tax-free` — Global Tax Free

| | |
|---|---|
| ja | Global Tax Free 株式会社 |
| en | Global Tax Free |
| zh-TW | Global Tax Free |
| URL | <https://www.global-taxfree.jp/> |
| Registration | **Not itemised publicly.** The association list records only the shop's equipment (POS, tablet, PC), which says nothing about what a traveller does |
| Refund methods | Not published |
| Fee | Not published |
| Status | Listed on the association's refund-capable list only |

### `intasect` — Intasect

| | |
|---|---|
| ja | Intasect Communications 株式会社 |
| en | Intasect (InTaxFree Refund) |
| zh-TW | Intasect（InTaxFree） |
| URL | <https://intapay-payment.intasect.com/intaxfree-refund> |
| Registration | **Not itemised publicly.** The association list records only the shop's equipment (POS, tablet, PC), which says nothing about what a traveller does |
| Refund methods | Not published |
| Fee | Not published |
| Status | Listed on the association's refund-capable list only |

## Rules for maintaining this file

1. **Never write a fee we have not seen published or reported first-hand.** "Not published" is a legitimate value and the only honest one for five of these ten. Rendering `null` as `0%` would be a lie that costs users money.
2. **A percentage without a basis is not a fee, it is a guess.** A percentage may be charged on the refund or on the tax-excluded purchase, and the refund is roughly a tenth of the purchase, so the wrong choice is a tenfold error in the user's money. Record the basis from the operator's own wording or record no number at all (`DR-026a`). Only two bases are established today: Tourego (purchase) and Ocean's credit-card route (purchase).
3. **The association list describes the shop's equipment, not the traveller's path.** Its columns (スマートフォン・タブレット / POSレジ / パソコン / その他) record what hardware a shop runs the tax-free system on. That is a merchant procurement fact and must never be written into a Registration row, where a reader will take "PC" to mean there is a website they can register on.
4. **Every fee carries its observation date.** Ocean's terms changed materially within four weeks. Consumption Tax Act rules do not govern refund procedures at all, so operators may change fees, methods and currencies at any time with no notice.
5. **Never imply endorsement.** Neither the association, the National Tax Agency, nor Kaeru vouches for any operator.
6. **Do not promise airport cash.** Cash at the departure port is a method the authorities list as possible. No operator has announced staffed airport cash counters for 2026-11-01.
7. **The traveler usually cannot choose.** The operator is a property of the shop. Present this catalog as a reference for decoding a receipt, not as a menu.

## Sources

All accessed 2026-10-05.

- National Tax-Free Shop Association — refund method explainer and the list of approved transmitting operators expected to support refunds: <https://zenmenkyo.jp/refund-top/refund-system-2026/>, list PDF <https://zenmenkyo.jp/dcms_media/other/henkinjigyousha2603.pdf>
- National Tax Agency — 返金手続について, including the statement that consumption-tax law prescribes no rules for refund procedures and the funds-transfer / AML obligations on refund operators: <https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/format/002.htm>
- Japan Tourism Agency — traveler FAQ on refund methods and timing: <https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00023.html>
- J&J Tax Free: <https://j-taxfree.jp/tax-free/refund/>
- Pie Systems Japan: <https://pievat.com/japan>
- Smart Detax: <https://smartdetax.com/>
- Tourego Japan: <https://www.tourego.com/en>
- 這裡胡說 JL TALKS — operator table transcribed from the association list: <https://blog.jesselin.com/archives/154534/japan-duty-free-changes-2026/>
- 聯合新聞網 udn — 12 operators, four dominant for Taiwanese travelers (2026-09-27): <https://udn.com/news/story/7266/9779704>
- PTT Japan_Travel — first-hand Ocean refund account (2026-06-20): <https://www.ptt.cc/bbs/Japan_Travel/M.1781954991.A.46E.html>
- PTT Japan_Travel — Ocean fee schedule after the 2026-07-16 revision: <https://www.ptt.cc/bbs/Japan_Travel/M.1784200231.A.D78.html>
- PTT Japan_Travel — PIE VAT and Global Blue traveler commentary: <https://www.ptt.cc/bbs/Japan_Travel/M.1781905642.A.DB5.html>
