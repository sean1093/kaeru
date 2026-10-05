# Wireframes

| | |
|---|---|
| Status | v1.1 (M0) |
| Date | 2026-10-05 |
| Owner | UX designer |
| Tracking | Issue #3 |
| Traces | `UJ-001`…`UJ-037` (`docs/product/user-journey.md`), `DR-0nn` (`docs/product/domain-rules.md`) |
| Scope | Every MVP screen in `information-architecture.md`, plus empty, error, and offline states. |

Low-fidelity, structure only. Boxes are a 360 px-wide phone viewport; proportions are indicative, not measured. Component behaviour is specified in `components.md`, colour and type in `visual-language.md`.

## Reading the frames

| Notation | Meaning |
|---|---|
| `[ Label ]` | Primary button, full width, 56 px tall in Airport Mode, 48 px elsewhere |
| `( Label )` | Secondary button |
| `. Label .` | Quiet button or text link |
| `[___]` | Text or numeric input |
| `( ) / (o)` | Radio, unselected / selected |
| `[ ] / [x]` | Checkbox, unchecked / checked |
| `>` | Row opens a new screen |
| `v` | Row opens a bottom sheet |
| `===` | Attention banner (`--color-attention`) |
| `~~~` | Soft info panel (`--color-primary-soft`) |
| Dashed rule | Divider inside a card |
| Solid rule | Section boundary |
| `[set]` `[cal]` `[time]` `[cam]` `[img]` `[find]` `[net]` | Icon placeholders: settings, date, time, camera, photo library, search, connectivity |
| `o Name` | Traveler avatar plus label |
| `GREEN` / `RED` | The terminal result graphic, rendered as a large icon in the product |
| `!` | Inline warning icon (`circle-alert`) |
| `(i)` | Inline info icon |
| `↗` | Opens an external site in a new tab |

Microcopy below each group is final UI copy, not placeholder. Tone: warm, short, second person, no exclamation marks except the single airport warning.

**Copy and rules.** Where a screen needs a rule inline, the string is short and links to the guide section rather than paraphrasing it, so the rule text lives in one namespace (`guide.*`) and app chrome in another. No app string restates a threshold, a deadline, or a rate.

---

## 1. Onboarding and the explainer — S01 to S05 (UJ-001 to UJ-004)


**S01** — Welcome

```
┌──────────────────────────────────────────────┐
│                                              │
│            かえる                            │
│            Kaeru                             │
│                                              │
│                                              │
│ 2026/11/01 起，日本退稅變了。                │
│ Japan changed tax-free on 1 Nov 2026.        │
│                                              │
│ 你先付含稅價，出境時海關確認後               │
│ 才退錢給你。                                 │
│ You pay the full price first. The tax        │
│ comes back after customs checks your         │
│ goods at the airport.                        │
│                                              │
│ Kaeru 幫你記住每張收據、每個期限，           │
│ 離線也能用。                                 │
│ Kaeru remembers every receipt and            │
│ deadline. It works offline.                  │
│                                              │
│~~~ 資料只存在這支手機，沒有帳號、            │
│~~~ 沒有伺服器。                              │
│~~~ Your data stays on this phone.            │
│~~~ No account, no server.                    │
│                                              │
├──────────────────────────────────────────────┤
│ [ 60 秒看懂新制  How it works ]              │
│ . 直接設定行程  Set up my trip .             │
└──────────────────────────────────────────────┘
```

**S05** — Explainer, step 2 of 5

```
┌──────────────────────────────────────────────┐
│ ✕   新制 60 秒  In 60 seconds   2/5          │
│ ● ● ○ ○ ○                                    │
├──────────────────────────────────────────────┤
│                                              │
│   2                                          │
│   海關要在託運之前                           │
│   Customs comes before bag drop              │
│                                              │
│ 出境當天，要先在出境大廳的機台辦             │
│ 海關確認，然後才去報到、託運行李。           │
│ On departure day you do the customs          │
│ step at a terminal in the departure          │
│ lobby first, and only then check in          │
│ and drop your bags.                          │
│                                              │
│=== 行李託運後就拿不回來。海關要看            │
│=== 東西的時候拿不出來，那張收據就            │
│=== 退不成。                                  │
│=== You cannot get a checked bag back.        │
│=== If customs asks to see the goods          │
│=== and you cannot show them, that            │
│=== receipt is lost.                          │
├──────────────────────────────────────────────┤
│ . 完整說明  Read the full guide . >          │
├──────────────────────────────────────────────┤
│ [ 下一個  Next ]                             │
│ . 跳過  Skip .                               │
└──────────────────────────────────────────────┘
```


**S05 Explainer, 5 steps (UJ-001).** The three counter-intuitive facts land first: you pay full price now (step 1), customs happens before bag drop (step 2), one missing item kills a whole receipt (step 3). Steps 4 and 5 cover operators and the 90-day window. Skippable at every step, re-openable from the Guide tab. Each step links to the matching `guide.steps.*` section rather than restating the rule.


**S02** — Trip setup

```
┌──────────────────────────────────────────────┐
│ ←            行程 Your trip      1/3         │
├──────────────────────────────────────────────┤
│                                              │
│ 出境日期  Departure date   *                 │
│ [ 2026 / 11 / 09            ] [cal]          │
│                                              │
│ 出境機場  Departure airport                  │
│ [ 成田 NRT                  ] v              │
│  ✓ 這個機場有退稅機台                        │
│  ✓ This airport has tax-free terminals       │
│                                              │
│ 班機時間  Flight time (optional)             │
│ [ 18:40                     ] [time]         │
│  填了就能幫你算幾點要出發                    │
│  Lets Kaeru work out when to leave           │
│                                              │
│ . 有國內線轉機再飛出日本？ .                 │
│ . Connecting domestically first? . >         │
│                                              │
│~~~ 只有出境日期是必填的。其他之後            │
│~~~ 都可以改。                                │
│~~~ Only the date is required. You can        │
│~~~ change everything later.                  │
├──────────────────────────────────────────────┤
│ [ 下一步  Next ]                             │
└──────────────────────────────────────────────┘
```


**S02 Trip setup (UJ-002).** The connection link opens a short sheet explaining that the procedure happens at the final airport you leave Japan from (`DR-037`), then asks for that airport. This is load-bearing for Alex-type itineraries and invisible for everyone else.


**S03** — Travelers

```
┌──────────────────────────────────────────────┐
│ ←         旅客 Travelers         2/3         │
├──────────────────────────────────────────────┤
│ 每本護照都是獨立的退稅手續，所以             │
│ 一起旅行的人要分開記。                       │
│ Each passport is its own customs             │
│ procedure, so list everyone.                 │
│                                              │
├──────────────────────────────────────────────┤
│ 1  [ 宜君                   ]   ✕            │
│    護照末四碼 Passport last 4                │
│    [ 7431 ]  (選填 optional)                 │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 2  [ 志豪                   ]   ✕            │
│    [ ____ ]                                  │
├──────────────────────────────────────────────┤
│                                              │
│ . + 新增旅客  Add traveler .                 │
│                                              │
│~~~ 小孩用大人的護照買的東西，記在            │
│~~~ 大人名下就好。                            │
│~~~ If a child buys on a parent passport,     │
│~~~ log it under the parent.                  │
│                                              │
│~~~ 我們只存末四碼，不存完整護照號碼。        │
│~~~ We store the last 4 digits only,          │
│~~~ never a full passport number.             │
├──────────────────────────────────────────────┤
│ [ 下一步  Next ]                             │
└──────────────────────────────────────────────┘
```

**S04** — Ready, with the airport buffer

```
┌──────────────────────────────────────────────┐
│ ←            好了 Ready          3/3         │
│                                              │
│                                              │
│            ( frog mark )                     │
│                                              │
│          都設定好了                          │
│          You are all set                     │
│                                              │
│ 2 位旅客 · 11/09 從成田 NRT 出境             │
│ 2 travelers · leaving NRT on 9 Nov           │
│                                              │
├──────────────────────────────────────────────┤
│ 機場要多留多少時間                           │
│ Extra time for the tax-free steps            │
│ ( 30 分 )[ 60 分 ]( 90 分 )                  │
│                                              │
│ 這是 Kaeru 的建議，不是官方規定。            │
│ 排隊和檢查都可能要時間。                     │
│ This is our suggestion, not an               │
│ official figure. Queues and                  │
│ inspections take time.                       │
├──────────────────────────────────────────────┤
│~~~ 在店裡買完東西，馬上記一筆，              │
│~~~ 20 秒就好。                               │
│~~~ Log a receipt right after you buy.        │
│~~~ It takes about 20 seconds.                │
├──────────────────────────────────────────────┤
│ [ 記第一張收據  Add my first receipt ]       │
│ . 之後再說  Later .                          │
└──────────────────────────────────────────────┘
```


### Onboarding microcopy

| Element | zh-TW | en |
|---|---|---|
| S01 headline | 2026/11/01 起，日本退稅變了。 | Japan changed tax-free on 1 Nov 2026. |
| S01 body | 你先付含稅價，出境時海關確認後才退錢給你。 | You pay the full price first. The tax comes back after customs checks your goods at the airport. |
| S01 privacy | 資料只存在這支手機，沒有帳號、沒有伺服器。 | Your data stays on this phone. No account, no server. |
| S01 primary | 60 秒看懂新制 | How it works, in 60 seconds |
| S05 step 2 title | 海關要在託運之前 | Customs comes before bag drop |
| S05 step 2 warning | 行李託運後就拿不回來。海關要看東西的時候拿不出來，那張收據就退不成。 | You cannot get a checked bag back. If customs asks to see the goods and you cannot show them, that receipt is lost. |
| S02 airport hint | 這個機場有退稅機台 | This airport has tax-free terminals |
| S02 flight-time helper | 填了就能幫你算幾點要出發 | Lets Kaeru work out when to leave |
| S02 connection link | 有國內線轉機再飛出日本？ | Connecting domestically first? |
| S03 intro | 每本護照都是獨立的退稅手續，所以一起旅行的人要分開記。 | Each passport is its own customs procedure, so list everyone. |
| S03 child note | 小孩用大人的護照買的東西，記在大人名下就好。 | If a child buys on a parent passport, log it under the parent. |
| S03 privacy | 我們只存末四碼，不存完整護照號碼。 | We store the last 4 digits only, never a full passport number. |
| S04 buffer label | 機場要多留多少時間 | Extra time for the tax-free steps |
| S04 buffer caveat | 這是 Kaeru 的建議，不是官方規定。排隊和檢查都可能要時間。 | This is our suggestion, not an official figure. Queues and inspections take time. |
| S04 nudge | 在店裡買完東西，馬上記一筆，20 秒就好。 | Log a receipt right after you buy. It takes about 20 seconds. |


---

## 2. Home — S10 to S16 (UJ-011, UJ-016, UJ-022, UJ-036)


**S10** — Home, during the trip

```
┌──────────────────────────────────────────────┐
│ Kaeru                            [set]       │
├──────────────────────────────────────────────┤
│ 預估可退  Waiting to come back               │
│                                              │
│   ~¥ 14,100                                  │
│   消費稅 ¥14,900 扣掉業者手續費後的          │
│   估計值。Estimated after operator           │
│   fees, from ¥14,900 of tax.                 │
│                                              │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 11/09 出境 · 成田 NRT · 還有 4 天            │
│ Leaving NRT on 9 Nov · 4 days left           │
│ o 宜君   o 志豪                              │
├──────────────────────────────────────────────┤
│                                              │
│ 今晚可以做  Tonight (3)       看全部 >       │
│                                              │
│ ┌──────────────────────────────────┐         │
│ │ ● 2 張還沒確認退稅業者           │         │
│ │   2 receipts: operator unknown > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ ● PIE VAT 還沒登錄               │         │
│ │   PIE VAT: not registered yet  > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ ● 5 張還沒填東西放哪             │         │
│ │   5 receipts: where are goods? > │         │
│ └──────────────────────────────────┘         │
│                                              │
├──────────────────────────────────────────────┤
│ 收據  Receipts  12            看全部 >       │
│ 消費 ¥180,000 · 消費稅 ¥14,900               │
│ Spent ¥180,000 · tax ¥14,900                 │
│ 3 家退稅業者  3 operators                    │
│                                              │
├──────────────────────────────────────────────┤
│                              ( + )           │
│ 首頁    收據    機場    指南                 │
│ Home  Receipts Airport Guide                 │
└──────────────────────────────────────────────┘
```


**S10 Home, during trip (UJ-011, UJ-016).** One hero number, a finite and finishable "tonight" list, then the quiet summary. The hero is the *estimated net*, always `~` prefixed, with the gross tax figure named beside it so the user can see the arithmetic (`DR-025`). The action list is capped at three with a count link; it is designed to reach zero.


**S11** — Home, empty

```
┌──────────────────────────────────────────────┐
│ Kaeru                            [set]       │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│            ( frog mark )                     │
│                                              │
│       還沒有收據                             │
│       No receipts yet                        │
│                                              │
│ 在日本買東西、拿到收據之後，                 │
│ 回來記一筆，之後就不會忘。                   │
│ After you buy something in Japan,            │
│ log the receipt here so nothing              │
│ gets lost later.                             │
│                                              │
│ [ 記一張收據  Add a receipt ]                │
│                                              │
│ . 60 秒看懂新制  How it works .              │
│                                              │
├──────────────────────────────────────────────┤
│                              ( + )           │
│ 首頁    收據    機場    指南                 │
└──────────────────────────────────────────────┘
```

**S12** — Home, before the trip

```
┌──────────────────────────────────────────────┐
│ Kaeru                            [set]       │
├──────────────────────────────────────────────┤
│ 還有 23 天出發                               │
│ 23 days until you leave                      │
│ 11/09 · 成田 NRT · 2 位旅客                  │
├──────────────────────────────────────────────┤
│~~~ 出發前先看一次流程，到機場就              │
│~~~ 不會慌。3 分鐘。                          │
│~~~ Read the airport steps once before        │
│~~~ you go. Three minutes.        >           │
├──────────────────────────────────────────────┤
│                                              │
│ 行前準備  Before you go                      │
│                                              │
│ [x] 設定出境日期與機場                       │
│     Departure date and airport               │
│ [x] 加入一起旅行的人                         │
│     Add your travelers                       │
│ [ ] 看一次「機場要做什麼」                   │
│     Read what happens at the airport         │
│ [ ] 把 Kaeru 加到主畫面                      │
│     Add Kaeru to your home screen            │
├──────────────────────────────────────────────┤
│ 還沒有收據。到日本買東西後回來記。           │
│ No receipts yet. Log them in Japan.          │
├──────────────────────────────────────────────┤
│                              ( + )           │
│ 首頁    收據    機場    指南                 │
└──────────────────────────────────────────────┘
```

**S13** — Home, departure day

```
┌──────────────────────────────────────────────┐
│ Kaeru                            [set]       │
├──────────────────────────────────────────────┤
│=== 今天出境 · 18:40 成田 NRT                 │
│=== You leave today · 18:40 NRT               │
│===                                           │
│=== 先過海關，再託運行李。                    │
│=== Customs first, bag drop second.           │
├──────────────────────────────────────────────┤
│ 建議 14:40 從飯店出發                        │
│ Leave your hotel by 14:40                    │
│ 班機 18:40 − 報到 60 分 − 退稅 60 分         │
│ Flight 18:40, check-in 60 min,               │
│ tax-free 60 min. Kaeru 的建議，              │
│ 不是官方規定。Our suggestion, not            │
│ an official figure.                          │
├──────────────────────────────────────────────┤
│                                              │
│ [ 開始機場流程  Start airport mode ]         │
│                                              │
│ 12 張收據 · 2 位旅客 · 3 家業者              │
│ 12 receipts · 2 travelers · 3 operators      │
│                                              │
├──────────────────────────────────────────────┤
│ 出發前要處理  Before you go      (2)         │
│                                              │
│ ● 5 張收據的東西還在託運行李                 │
│   5 receipts: goods in checked bags          │
│   — 過海關前要拿出來             >           │
│                                              │
│ ● 1 張收據要帶保證書                         │
│   1 receipt needs its certificate >          │
│                                              │
├──────────────────────────────────────────────┤
│ 首頁    收據    機場    指南                 │
└──────────────────────────────────────────────┘
```


**S13 Departure day (UJ-022).** The departure-time recommendation shows its own arithmetic so the user can judge it, and is labelled as Kaeru's advice — there is no official figure (`DR-032`). Airport Mode becomes the hero; the refund total moves below the fold, because today it is not actionable.


**S14** — Home, after the trip

```
┌──────────────────────────────────────────────┐
│ Kaeru                            [set]       │
├──────────────────────────────────────────────┤
│ 退款追蹤  Your refunds                       │
│                                              │
│   已入帳 Received      ¥  8,420              │
│   還在等 Still waiting ~¥ 5,680              │
│   沒退成 Not refunded  ¥    280              │
│                                              │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 旅程已結束 · 11/09 回國                      │
│ Trip finished · home since 9 Nov             │
├──────────────────────────────────────────────┤
│                                              │
│ 依業者分組  By operator       看全部 >       │
│                                              │
│ ┌──────────────────────────────────┐         │
│ │ J-TaxRefund        5 張 receipts │         │
│ │ ~¥ 5,680   等待中 Waiting   21 天│         │
│ │ 超過你設定的 14 天，要聯絡嗎？ > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ PIE VAT                        ✓ │         │
│ │ 4 張收據 · 實收 ¥ 8,420          │         │
│ │ 手續費 ¥ 480 · 11/22 入帳        │         │
│ │ Fee ¥480 · arrived 22 Nov      > │         │
│ └──────────────────────────────────┘         │
│                                              │
├──────────────────────────────────────────────┤
│ . 看這趟的總結  Trip summary . >             │
│ . 封存這趟旅程  Archive this trip .          │
├──────────────────────────────────────────────┤
│ 首頁    收據    機場    指南                 │
└──────────────────────────────────────────────┘
```

**S15** — Tonight&#39;s list

```
┌──────────────────────────────────────────────┐
│ ←        今晚可以做  Tonight                 │
├──────────────────────────────────────────────┤
│ 還沒確認退稅業者  Operator unknown           │
│                                  (2)         │
│ 收據上的 QR 一掃就知道。                     │
│ The QR on the receipt tells you.             │
│ > BIC CAMERA 11/03  ¥ 54,000                 │
│ > 松本清 11/04      ¥  8,900                 │
├──────────────────────────────────────────────┤
│ 還沒登錄  Not registered yet     (1)         │
│ 一家業者登錄一次就好，之後的收據             │
│ 會自動跟著。                                 │
│ Register once per operator; later            │
│ receipts attach automatically.               │
│ > PIE VAT · 4 張收據 receipts                │
├──────────────────────────────────────────────┤
│ 東西放哪還沒填  Where are goods  (5)         │
│ > 5 張收據 receipts                          │
├──────────────────────────────────────────────┤
│ 補資料就好  Nice to have        (4)          │
│ > 4 張收據沒有照片                           │
│   4 receipts have no photo                   │
├──────────────────────────────────────────────┤
│~~~ 做完就沒事了，可以放下手機。              │
│~~~ Finish these and you are done for         │
│~~~ tonight.                                  │
└──────────────────────────────────────────────┘
```

**S16** — Trip summary

```
┌──────────────────────────────────────────────┐
│ ←        這趟總結  Trip summary              │
├──────────────────────────────────────────────┤
│ 東京 2026/11/05 – 11/09                      │
│ 12 張收據 · 2 位旅客                         │
├──────────────────────────────────────────────┤
│ 消費總額  Spent        ¥ 180,000             │
│ 付掉的消費稅  Tax paid  ¥  14,900            │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 海關確認  Confirmed     ¥  14,620            │
│ 實際入帳  Received      ¥  13,840            │
│ 手續費    Fees          ¥     780            │
│ 沒退成    Not refunded  ¥     280            │
├──────────────────────────────────────────────┤
│ 為什麼沒退成  Why 280 was lost               │
│                                              │
│ ● 松本清 11/04 · ¥ 280                       │
│   面膜在日本拆開用了                         │
│   Face masks were opened in Japan >          │
├──────────────────────────────────────────────┤
│~~~ 下次可以這樣做：要在日本用的東西          │
│~~~ 分開結帳，那張收據就不會被影響。          │
│~~~ Next time: buy things you will use        │
│~~~ in Japan in a separate transaction,       │
│~~~ so they do not affect a refundable        │
│~~~ receipt.                                  │
├──────────────────────────────────────────────┤
│ . 匯出這趟資料  Export this trip .           │
└──────────────────────────────────────────────┘
```


### Home microcopy

| Element | zh-TW | en |
|---|---|---|
| Hero label | 預估可退 | Waiting to come back |
| Hero caveat | 消費稅 ¥14,900 扣掉業者手續費後的估計值 | Estimated after operator fees, from ¥14,900 of tax |
| Tonight list | 今晚可以做 | Tonight |
| Tonight closer | 做完就沒事了，可以放下手機。 | Finish these and you are done for tonight. |
| Per-operator registration | 一家業者登錄一次就好，之後的收據會自動跟著。 | Register once per operator; later receipts attach automatically. |
| Empty headline | 還沒有收據 | No receipts yet |
| Departure banner | 今天出境。先過海關，再託運行李。 | You leave today. Customs first, bag drop second. |
| Leave-by | 建議 14:40 從飯店出發 | Leave your hotel by 14:40 |
| Leave-by caveat | Kaeru 的建議，不是官方規定。 | Our suggestion, not an official figure. |
| Checked-bag item | 5 張收據的東西還在託運行李 — 過海關前要拿出來 | 5 receipts: goods in checked bags — take them out before customs |
| Documents item | 1 張收據要帶保證書 | 1 receipt needs its certificate |
| After-trip totals | 已入帳 / 還在等 / 沒退成 | Received / Still waiting / Not refunded |
| Overdue nudge | 超過你設定的 14 天，要聯絡嗎？ | Past the 14 days you set. Contact them? |
| Trip summary lesson | 下次可以這樣做：要在日本用的東西分開結帳。 | Next time: buy things you will use in Japan in a separate transaction. |

---

## 3. Receipts — S20 to S29 (UJ-005 to UJ-010, UJ-012 to UJ-015)


**S20** — Receipt list, with a same-shop same-day subtotal

```
┌──────────────────────────────────────────────┐
│ 收據  Receipts                  [find]       │
├──────────────────────────────────────────────┤
│ [ 全部 All ]( o 宜君 )( o 志豪 )             │
│ ( 要處理 Needs action )                      │
├──────────────────────────────────────────────┤
│ 11/04  星期三  Wed                           │
│                                              │
│ ┌──────────────────────────────────┐         │
│ │ 松本清 マツキヨ            o 宜君│         │
│ │ 未稅 ¥ 8,900   稅 ¥ 890          │         │
│ │ ● 業者未確認 Operator unknown  > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ BIC CAMERA                 o 志豪│         │
│ │ 未稅 ¥ 54,000  稅 ¥ 5,400        │         │
│ │ ✓ 已登錄 Registered            > │         │
│ └──────────────────────────────────┘         │
│                                              │
│ 11/03  星期二  Tue                           │
│                                              │
│ ┌──────────────────────────────────┐         │
│ │ 唐吉訶德 ドンキ            o 宜君│         │
│ │ 未稅 ¥ 3,000   稅 ¥ 240          │         │
│ │ ○ 已記錄 Logged                > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ 唐吉訶德 ドンキ            o 宜君│         │
│ │ 未稅 ¥ 2,500   稅 ¥ 200          │         │
│ │ ○ 已記錄 Logged                > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ (i) 本日於此店合計 ¥ 5,500       │         │
│ │     是否合併計算由店家決定       │         │
│ │     Combined at this shop today. │         │
│ │     Whether a shop combines      │         │
│ │     separate receipts is up to   │         │
│ │     the shop.                              │
│ │     . 這兩筆不是同一家店？分開 .           │
│ │     . Not the same shop? Split . │         │
│ └──────────────────────────────────┘         │
│                                              │
├──────────────────────────────────────────────┤
│                              ( + )           │
│ 首頁    收據    機場    指南                 │
└──────────────────────────────────────────────┘
```


**S20 Receipt list.** Grouped by purchase date, newest first. Same-shop same-day receipts carry a combined-subtotal footer that **states the total and the shop's discretion, never qualification** — whether separate transactions aggregate towards ¥5,000 is `UR-02`, unconfirmed. A single receipt at or above ¥5,000 is `DR-010` and may state qualification plainly.

Grouping is best-effort (`DR-012a`): `shopKey` normalisation collapses whitespace and width but will never equate 松本清, マツキヨ and 松本清 新宿東口店. The UI therefore carries both mitigations the rule requires — the add-receipt form suggests shops already used on this trip so repeat visits reuse one spelling, and the user can **merge two shop groups manually** from the group footer's overflow, or split a wrongly merged one. A missed grouping only weakens an advisory indicator; it can never produce a wrong refund figure.


**S21** — Add receipt, the 20-second path

```
┌──────────────────────────────────────────────┐
│ ✕        記一筆  Add receipt                 │
├──────────────────────────────────────────────┤
│                                              │
│ 未稅金額  Tax-excluded total   *             │
│                                              │
│  ¥ [ 8,900                      ]            │
│                                              │
│ . 我只有含稅價  I only have the .            │
│ . tax-included price .                       │
│                                              │
├──────────────────────────────────────────────┤
│ 店家  Shop                      *            │
│ [ 松本清 マツキヨ               ]            │
│  最近 Recent:  松本清 · BIC CAMERA           │
│                · 唐吉訶德                    │
├──────────────────────────────────────────────┤
│ 誰買的  Who bought it           *            │
│ [ o 宜君 ]( o 志豪 )                         │
├──────────────────────────────────────────────┤
│ 11/04 今天 · 10% · 業者未確認                │
│ · 隨身                            v          │
│ Today · 10% · operator unknown               │
│ · with me                                    │
├──────────────────────────────────────────────┤
│ [ ] 這筆有東西會在日本吃掉或用掉             │
│     Some of this will be eaten or            │
│     used in Japan                            │
├──────────────────────────────────────────────┤
│ . 更多細節  More details      ⌄ .            │
├──────────────────────────────────────────────┤
│                                              │
│ [ 儲存  Save ]                               │
└──────────────────────────────────────────────┘
```

**S21** — Add receipt, under the ¥5,000 threshold

```
┌──────────────────────────────────────────────┐
│ ✕        記一筆  Add receipt                 │
├──────────────────────────────────────────────┤
│ 未稅金額  Tax-excluded total   *             │
│  ¥ [ 4,100                      ]            │
│                                              │
│~~~ 這家店今天再加 ¥900 就到 ¥5,000。         │
│~~~ 同一筆結帳買滿最保險。                    │
│~~~ ¥900 more at this shop today              │
│~~~ reaches ¥5,000. Buying it in the          │
│~~~ same transaction is the sure way.         │
│~~~ . 門檻怎麼算  How the threshold . >       │
├──────────────────────────────────────────────┤
│ 店家  Shop                      *            │
│ [ 唐吉訶德 ドンキ               ]            │
├──────────────────────────────────────────────┤
│ 誰買的  Who bought it           *            │
│ [ o 宜君 ]( o 志豪 )                         │
├──────────────────────────────────────────────┤
│ 11/03 · 10% · 業者未確認 · 隨身   v          │
├──────────────────────────────────────────────┤
│ [ ] 這筆有東西會在日本吃掉或用掉             │
│     Some of this will be eaten or            │
│     used in Japan                            │
├──────────────────────────────────────────────┤
│ . 更多細節  More details      ⌄ .            │
├──────────────────────────────────────────────┤
│ [ 儲存  Save ]                               │
└──────────────────────────────────────────────┘
```


**S21 threshold state (UJ-007, DR-075).** Behavioural, not predictive: it tells the user what definitely works — buying more in the *same* transaction. It never promises that a second receipt will merge. Save stays enabled; the panel is `--color-primary-soft`, not an error, and the field keeps its normal border.


**S21** — Add receipt, More details expanded

```
┌──────────────────────────────────────────────┐
│ ✕        記一筆  Add receipt                 │
├──────────────────────────────────────────────┤
│ 未稅 ¥ 8,900 · 松本清 · o 宜君               │
├──────────────────────────────────────────────┤
│ 更多細節  More details        ⌃              │
│                                              │
│ 購買日期  Purchase date                      │
│ [ 2026 / 11 / 04 ] 今天 Today [cal]          │
│  海關期限 2027/02/02                         │
│  Customs deadline 2 Feb 2027                 │
│                                              │
│ 稅率  Tax rate                               │
│ [ 10% ]( 8% )                                │
│  10% 大部分商品  most goods                  │
│  8%  食品、飲料（不含酒類）                  │
│      food and drink (not alcohol)            │
│ . + 這張兩種稅率都有 .                       │
│ . This receipt has two rates .               │
│                                              │
│ 退稅業者  Refund operator                    │
│ [ 還不確定  Not sure yet       ] v           │
│  晚點掃收據上的 QR 就知道了                  │
│  Scan the QR on the receipt later            │
│                                              │
│ 東西放哪  Where are the goods                │
│ [ 隨身 With me ]( 託運 Checked )             │
│ ( 不確定 Not sure )                          │
│                                              │
│ 收據照片  Receipt photo                      │
│ [ [cam] 拍照 ] [ [img] 從相簿選 ]            │
│                                              │
│ 備註  Note                                   │
│ [                              ]             │
├──────────────────────────────────────────────┤
│ [ 儲存  Save ]                               │
└──────────────────────────────────────────────┘
```

**S21** — Add receipt, high-value prompt

```
┌──────────────────────────────────────────────┐
│ ✕        記一筆  Add receipt                 │
├──────────────────────────────────────────────┤
│ 未稅金額  Tax-excluded total   *             │
│  ¥ [ 1,280,000                  ]            │
├──────────────────────────────────────────────┤
│~~~ 這筆超過 100 萬日圓。裡面最貴的           │
│~~~ 「單一商品」是多少？                      │
│~~~ This line is over ¥1,000,000.             │
│~~~ What is the most expensive                │
│~~~ single item in it?                        │
│~~~                                           │
│~~~  ¥ [ 1,280,000              ]             │
│~~~  . 不確定，先跳過  Skip for now .         │
│~~~                                           │
│~~~ 只有單價滿 100 萬的商品，海關才           │
│~~~ 可能要你出示鑑定書或保證書。              │
│~~~ Customs may ask for a certificate         │
│~~~ or warranty only for a single item        │
│~~~ at or above ¥1,000,000.                   │
│~~~ . 這是什麼  Why we ask . >                │
├──────────────────────────────────────────────┤
│ 店家  Shop                      *            │
│ [ 髙島屋 日本橋店               ]            │
├──────────────────────────────────────────────┤
│ [ 儲存  Save ]                               │
└──────────────────────────────────────────────┘
```

**Only asked when a line total already reaches ¥1,000,000** (`DR-016`), because only then can a single item qualify — so the overwhelming majority of receipts never see this field. Skipping is free and the flag stays user-settable from the receipt detail; a user-set flag always wins, since a ¥1,200,000 line could be two ¥600,000 items and only the user knows. Answering it is what makes the documents reminder fire on S17 and S31.

**S23** — Edit receipt

```
┌──────────────────────────────────────────────┐
│ ✕        編輯收據  Edit receipt       ⋯      │
├──────────────────────────────────────────────┤
│ 未稅金額  Tax-excluded total   *             │
│  ¥ [ 8,900                      ]            │
├──────────────────────────────────────────────┤
│ 店家  Shop                      *            │
│ [ 松本清 マツキヨ 新宿東口店     ]           │
├──────────────────────────────────────────────┤
│ 誰買的  Who bought it           *            │
│ [ o 宜君 ]( o 志豪 )                         │
├──────────────────────────────────────────────┤
│ 購買日期  Purchase date                      │
│ [ 2026 / 11 / 04 ]            [cal]          │
│  海關期限 2027/02/02                         │
│  Customs deadline 2 Feb 2027                 │
├──────────────────────────────────────────────┤
│ 稅率  Tax rate                               │
│ [ 10% ]( 8% )                                │
│ 第二個稅率  Second rate line                 │
│ 8%  ¥ [ 1,200                   ]  ✕         │
├──────────────────────────────────────────────┤
│ 退稅業者  Refund operator                    │
│ [ J-TaxRefund                   ] v          │
├──────────────────────────────────────────────┤
│ 東西放哪  Where are the goods                │
│ [ 隨身 With me ]( 託運 Checked )             │
│ ( 不確定 Not sure )                          │
├──────────────────────────────────────────────┤
│ 備註  Note                                   │
│ [ 面膜是送人的                   ]           │
├──────────────────────────────────────────────┤
│ [ 儲存  Save ]                               │
│ . 刪除這張收據  Delete this receipt .        │
└──────────────────────────────────────────────┘
```

**S23** is S21 with every section expanded and no collapsed *More details* — editing is a considered act at a table, not a doorway act. The mixed-rate second line (`DR-020`) is shown here in its added state. Delete is quiet, at the bottom, and undoable for 5 seconds via the toast.


**Tax rate control (DR-023).** Not a hard-coded two-option toggle. The options come from the dated rate table resolved by `purchaseDate`, so a receipt dated on or after 2027-04-01 renders `1%` in the food slot with no code change. The abolished goods categories 一般物品 and 消耗品 appear nowhere in this control (`DR-013`).


**S22** — Receipt detail

```
┌──────────────────────────────────────────────┐
│ ←        收據  Receipt            ⋯          │
├──────────────────────────────────────────────┤
│ 松本清 マツキヨ 新宿東口店                   │
│ 2026/11/04 · o 宜君                          │
├──────────────────────────────────────────────┤
│ 未稅 Tax-excluded        ¥  8,900            │
│ 消費稅 10%               ¥    890            │
│ 含稅 Tax-included        ¥  9,790            │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 預估淨退  Estimated net  ~¥    830           │
│ 消費稅 ¥890 − 業者手續費 ¥60                 │
│ Tax ¥890 minus an operator fee of            │
│ about ¥60. 手續費是業者自訂，可能            │
│ 會變。Fees are set by the operator           │
│ and can change.                              │
├──────────────────────────────────────────────┤
│ 進度  Progress                               │
│  ✓ 已記錄          Logged                    │
│  ✓ 已向業者登錄    Registered                │
│  ○ 海關已確認      Customs confirmed         │
│  ○ 等待入帳        Refund pending            │
│  ○ 已入帳          Received                  │
├──────────────────────────────────────────────┤
│ 退稅業者  Refund operator                    │
│ J-TaxRefund (J&J Tax Free)        v          │
│ 已登錄 · 你在 11/04 標記的                   │
│ Registered · you marked this 4 Nov           │
│ . 開啟 J-TaxRefund 網站  ↗ .                 │
├──────────────────────────────────────────────┤
│ 東西放哪  Where are the goods                │
│ [ 隨身 With me ]( 託運 Checked )             │
│ ( 不確定 Not sure )                          │
├──────────────────────────────────────────────┤
│ [ ] 已經在日本吃掉或用掉了                   │
│     Already eaten or used in Japan           │
├──────────────────────────────────────────────┤
│ 海關期限  Customs deadline                   │
│ 2027/02/02 · 出境日 11/09 在期限內 ✓         │
│ Within the deadline                          │
├──────────────────────────────────────────────┤
│ 照片  Photo        [ [cam] 加一張 ]          │
├──────────────────────────────────────────────┤
│ . 這張不退了  I will not claim this .        │
└──────────────────────────────────────────────┘
```

**S22** — Receipt detail, the two attention states

```
┌──────────────────────────────────────────────┐
│ ←        收據  Receipt            ⋯          │
├──────────────────────────────────────────────┤
│ 松本清 マツキヨ · 11/04 · o 宜君             │
├──────────────────────────────────────────────┤
│ 東西放哪  Where are the goods                │
│ ( 隨身 With me )[ 託運 Checked ]             │
│ ( 不確定 Not sure )                          │
│                                              │
│=== 海關可能會要看這些東西。託運後            │
│=== 就拿不回來了，過海關前請隨身帶著。        │
│=== Customs may ask to see these.             │
│=== You cannot get a checked bag back,        │
│=== so keep them with you until               │
│=== customs is done.                          │
│===                                           │
│=== [ 改成隨身  Move to carry-on ]            │
├──────────────────────────────────────────────┤
│ [x] 已經在日本吃掉或用掉了                   │
│     Already eaten or used in Japan           │
│                                              │
│=== 整張收據都不能退。請不要使用免稅          │
│=== 手續機台，直接到海關人員櫃檯申報。        │
│=== The whole receipt cannot be               │
│=== refunded. Do not use the tax-free         │
│=== terminal for it — tell a customs          │
│=== officer at the desk.                      │
│=== . 完整說明  Read more . >                 │
└──────────────────────────────────────────────┘
```

**S2B** — Receipt detail, fee warning

```
┌──────────────────────────────────────────────┐
│ ←        收據  Receipt            ⋯          │
├──────────────────────────────────────────────┤
│ 唐吉訶德 ドンキ · 11/03 · o 宜君             │
├──────────────────────────────────────────────┤
│ 未稅 Tax-excluded        ¥  3,000            │
│ 消費稅 8%                ¥    240            │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 預估淨退  Estimated net   ~¥    40           │
│                                              │
│=== 這張的退稅可能被手續費吃光。選銀行        │
│=== 匯款時，台灣的收款銀行通常還會再收        │
│=== NT$200-400，實際金額各家不同。            │
│=== The fee may eat this refund. If you       │
│=== take it as an international bank          │
│=== transfer, your own bank usually           │
│=== charges to receive it — sometimes         │
│=== more than the refund itself.              │
│=== . 為什麼  Why is this . >                 │
├──────────────────────────────────────────────┤
│ 可以考慮  You could                          │
│ · 選信用卡或電子支付入帳，通常比較划算       │
│   Choose card or e-money instead of a        │
│   bank transfer where offered                │
│ · 或是這張就不退了                           │
│   Or decide not to claim this one            │
├──────────────────────────────────────────────┤
│ . 這張不退了  I will not claim this .        │
└──────────────────────────────────────────────┘
```


**Fee warning (DR-025, DR-027).** Triggered when the estimated net falls below `fee.warnBelowJpy`, default ¥2,000, held as rules data — not only when it goes below zero — a ¥30 refund is as bad as none, and the user should see it coming. The illustrating figure is deliberately locale-specific: NT$200–400 is a Taiwanese-bank fact and would be wrong to quote to an English-speaking traveler, so the English string carries the same warning without the number. Both link to `guide.faq.q11`.


**S2A** — Not claiming

```
┌──────────────────────────────────────────────┐
│ ✕   這張不退了  Not claiming                 │
├──────────────────────────────────────────────┤
│ 這張收據會從機場流程裡拿掉，也不會           │
│ 再算進預估金額。隨時可以改回來。             │
│ This receipt leaves the airport              │
│ checklist and the estimate. You can          │
│ undo this at any time.                       │
├──────────────────────────────────────────────┤
│ 原因（選填）  Reason (optional)              │
│                                              │
│ ( ) 在日本用掉了  Used in Japan              │
│ ( ) 東西找不到    Item is missing            │
│ ( ) 退的錢不划算  Not worth the fee          │
│ ( ) 舊制的收據    Old-system receipt         │
│ ( ) 其他          Other                      │
│                                              │
│ 不填也可以。                                 │
│ You do not have to pick one.                 │
├──────────────────────────────────────────────┤
│ [ 確定  Done ]                               │
└──────────────────────────────────────────────┘
```

**S29** — Old-system receipt

```
┌──────────────────────────────────────────────┐
│ ←        收據  Receipt            ⋯          │
├──────────────────────────────────────────────┤
│ UNIQLO 銀座 · 2026/10/28 · o 宜君            │
├──────────────────────────────────────────────┤
│~~~ 這張是舊制的收據（2026/10/31 前           │
│~~~ 購買），當場就免稅了，不用在機場          │
│~~~ 辦手續。                                  │
│~~~ This is an old-system receipt             │
│~~~ (bought on or before 31 Oct 2026).        │
│~~~ The tax was already deducted at           │
│~~~ the shop — there is nothing to do         │
│~~~ at the airport.                           │
│~~~ . 新舊制差在哪  What changed . >          │
├──────────────────────────────────────────────┤
│ 未稅 Tax-excluded        ¥  9,800            │
├──────────────────────────────────────────────┤
│ 這張不會出現在機場流程裡。                   │
│ This receipt is not in Airport Mode.         │
├──────────────────────────────────────────────┤
│ . 從這趟刪掉  Remove from this trip .        │
└──────────────────────────────────────────────┘
```

**S24** — Operator chooser (sheet)

```
┌──────────────────────────────────────────────┐
│ ✕   選擇退稅業者  Refund operator            │
├──────────────────────────────────────────────┤
│ 收據上的 QR 會直接帶你到正確的業者。         │
│ The QR on your receipt opens the             │
│ right one.                                   │
│                                              │
│ [ [cam] 掃收據上的 QR  Scan the QR ]         │
├──────────────────────────────────────────────┤
│ [ 搜尋  Search                  ]            │
├──────────────────────────────────────────────┤
│ 常見  Common                                 │
│ (o) J&J Tax Free (J-TaxRefund)               │
│ ( ) PIE VAT                                  │
│ ( ) Smart Detax (JPrefund)                   │
│ ( ) Global Blue                              │
├──────────────────────────────────────────────┤
│ 其他  Others                                 │
│ ( ) Tourego                                  │
│ ( ) WAmazing                                 │
│ ( ) Global Tax Free                          │
│ ( ) Intasect                                 │
│ ( ) Japan Tax Free                           │
│ ( ) Ocean                                    │
├──────────────────────────────────────────────┤
│ ( ) 還不確定  Not sure yet                   │
│     晚點再回來選，不會影響退稅。             │
│     Come back later. This does not           │
│     affect your refund.                      │
├──────────────────────────────────────────────┤
│~~~ 業者是店家決定的，不是你選的。            │
│~~~ 一趟遇到 2-4 家很正常。                   │
│~~~ The shop picks the operator, not          │
│~~~ you. Two to four per trip is              │
│~~~ normal.                                   │
├──────────────────────────────────────────────┤
│ [ 確定  Done ]                               │
└──────────────────────────────────────────────┘
```

**S25** — Traveler chooser (sheet)

```
┌──────────────────────────────────────────────┐
│ ✕        誰買的  Who bought it               │
├──────────────────────────────────────────────┤
│ 退稅是綁在購買時用的那本護照上。             │
│ The refund is tied to the passport           │
│ used at the till.                            │
├──────────────────────────────────────────────┤
│ (o) o 宜君  Yi-chun                          │
│     護照末四碼 7431                          │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ ( ) o 志豪  Chih-hao                         │
│     沒填末四碼  no passport digits           │
├──────────────────────────────────────────────┤
│ . + 新增旅客  Add traveler .                 │
├──────────────────────────────────────────────┤
│ [ 確定  Done ]                               │
└──────────────────────────────────────────────┘
```

Used when the trip has four or more travelers; with two or three it is a segmented control inline, and with one it does not appear at all.

**S26** — Packing location (sheet)

```
┌──────────────────────────────────────────────┐
│ ✕   東西放哪  Where are the goods            │
├──────────────────────────────────────────────┤
│ 海關可能會要你拿出來看，所以位置很           │
│ 重要。                                       │
│ Customs may ask to see the goods, so         │
│ this matters.                                │
├──────────────────────────────────────────────┤
│ (o) 隨身  With me                            │
│     在隨身行李或手上                         │
│     In my carry-on or in my hands            │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ ( ) 託運  Checked luggage                    │
│     ! 託運後拿不回來，過海關前要改           │
│     ! You cannot get it back after           │
│       bag drop                               │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ ( ) 不確定  Not sure                         │
│     出發前再確認一次                         │
│     Check again before you leave             │
├──────────────────────────────────────────────┤
│ [ 確定  Done ]                               │
└──────────────────────────────────────────────┘
```

**S27** — Photo view

```
┌──────────────────────────────────────────────┐
│ ✕                                  ⋯         │
│                                              │
│                                              │
│                                              │
│    ┌──────────────────────────────────┐      │
│    │                                  │      │
│    │     ( receipt photo )            │      │
│    │                                  │      │
│    │    雙指縮放可以看清楚            │      │
│    │    Pinch to zoom                 │      │
│    │                                  │      │
│    └──────────────────────────────────┘      │
│                                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│ 松本清 マツキヨ · 2026/11/04                 │
│ 只存在這支手機  Stored on this phone         │
├──────────────────────────────────────────────┤
│ . 換一張  Replace .   . 刪除  Delete .       │
└──────────────────────────────────────────────┘
```

Full-bleed, dark scrim regardless of theme so the photo is judged on its own. The overflow menu holds replace and delete. The photo is the recovery path for everything the user did not type, including the operator QR, so it is never silently discarded on edit.

**S28** — Receipt list, empty

```
┌──────────────────────────────────────────────┐
│ 收據  Receipts                  [find]       │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│            ( frog mark )                     │
│                                              │
│       這裡還是空的                           │
│       Nothing here yet                       │
│                                              │
│ 每買一樣東西就記一筆，到機場時               │
│ 就不用翻一堆紙收據。                         │
│ Log each purchase as you go, so you          │
│ are not sorting paper receipts at            │
│ the airport.                                 │
│                                              │
│ [ 記一張收據  Add a receipt ]                │
│                                              │
├──────────────────────────────────────────────┤
│                              ( + )           │
│ 首頁    收據    機場    指南                 │
└──────────────────────────────────────────────┘
```


### Receipt microcopy

| Element | zh-TW | en |
|---|---|---|
| Amount label | 未稅金額 | Tax-excluded total |
| Tax-included toggle | 我只有含稅價 | I only have the tax-included price |
| Derived note | 由含稅價換算，是估計值 | Calculated from the tax-included price — an estimate |
| Shop | 店家 | Shop |
| Traveler | 誰買的 | Who bought it |
| Rate 10% | 10% · 大部分商品 | 10% · most goods |
| Rate 8% | 8% · 食品、飲料（不含酒類） | 8% · food and drink (not alcohol) |
| Rate 1% (from 2027-04-01) | 1% · 食品、飲料（不含酒類） | 1% · food and drink (not alcohol) |
| Mixed rate | 這張兩種稅率都有 | This receipt has two rates |
| Operator placeholder | 還不確定 | Not sure yet |
| Operator recovery | 晚點掃收據上的 QR 就知道了 | Scan the QR on the receipt later |
| Operator ownership | 業者是店家決定的，不是你選的。 | The shop picks the operator, not you. |
| Packing | 東西放哪 | Where are the goods |
| Packing options | 隨身 / 託運 / 不確定 | With me / Checked / Not sure |
| Checked warning | 海關可能會要看這些東西。託運後就拿不回來了，過海關前請隨身帶著。 | Customs may ask to see these. You cannot get a checked bag back, so keep them with you until customs is done. |
| Will-use toggle (logging) | 這筆有東西會在日本吃掉或用掉 | Some of this will be eaten or used in Japan |
| Will-use helper | 這張收據就不能退稅。下次把這些東西分開結帳。 | Then this receipt cannot be refunded. Next time, buy these in a separate transaction. |
| Already-used toggle | 已經在日本吃掉或用掉了 | Already eaten or used in Japan |
| Already-used consequence | 整張收據都不能退。請不要使用免稅手續機台，直接到海關人員櫃檯申報。 | The whole receipt cannot be refunded. Do not use the tax-free terminal for it — tell a customs officer at the desk. |
| Net estimate | 預估淨退 | Estimated net |
| Fee caveat | 手續費是業者自訂，可能會變。 | Fees are set by the operator and can change. |
| Fee warning (zh-TW only figure) | 這張的退稅可能被手續費吃光。選銀行匯款時，台灣的收款銀行通常還會再收 NT$200-400，實際金額各家不同。 | The fee may eat this refund. If you take it as an international bank transfer, your own bank usually charges to receive it — sometimes more than the refund itself. |
| Not claiming | 這張不退了 | I will not claim this |
| Not claiming effect | 這張收據會從機場流程裡拿掉，也不會再算進預估金額。隨時可以改回來。 | This receipt leaves the airport checklist and the estimate. You can undo this at any time. |
| Old-system receipt | 這張是舊制的收據，當場就免稅了，不用在機場辦手續。 | This is an old-system receipt. The tax was already deducted at the shop — nothing to do at the airport. |
| Combined-shop footer | 本日於此店合計 ¥5,500 · 是否合併計算由店家決定 | Combined at this shop today: ¥5,500. Whether a shop combines separate receipts is up to the shop. |
| Threshold advice | 這家店今天再加 ¥900 就到 ¥5,000。同一筆結帳買滿最保險。 | ¥900 more at this shop today reaches ¥5,000. Buying it in the same transaction is the sure way. |
| Save toast | 已儲存 | Saved |
| Undo | 復原 | Undo |
| Delete confirm | 刪除這張收據？這個動作無法復原。 | Delete this receipt? This cannot be undone. |
| Registration attribution | 已登錄 · 你在 11/04 標記的 | Registered · you marked this on 4 Nov |


---

## 4. Last day — S17 (UJ-017 to UJ-021)


**S17** — Packing plan, the night before

```
┌──────────────────────────────────────────────┐
│ ←        明天出發  Packing plan              │
├──────────────────────────────────────────────┤
│=== 這些東西明天要隨身帶       (5)            │
│=== These must be with you tomorrow           │
│===                                           │
│=== 現在標記為託運或不確定的收據。            │
│=== 託運後拿不回來，海關就看不到。            │
│=== Marked as checked or not sure.            │
│=== You cannot get a checked bag back.        │
├──────────────────────────────────────────────┤
│ o 宜君  Yi-chun                              │
│ [ ] 三麗鷗 11/07  ¥ 12,000  託運             │
│ [ ] GU 御殿場 11/07 ¥ 8,400  託運            │
│ [ ] ABC Mart 11/07 ¥ 9,800  不確定           │
│                                              │
│ o 志豪  Chih-hao                             │
│ [ ] 鞋店 11/07   ¥ 15,000   託運             │
│ [ ] NIKE 11/07   ¥ 11,000   託運             │
├──────────────────────────────────────────────┤
│ 東西都還在嗎  Is everything still            │
│ there?                          (12)         │
│ 一張收據上少一樣，整張都不能退。             │
│ One missing item voids the whole             │
│ receipt.                                     │
│ [ 一張一張確認  Check them > ]               │
├──────────────────────────────────────────────┤
│ 要帶證明文件  Bring documents   (1)          │
│ ● BIC CAMERA 11/03 · ¥ 1,280,000             │
│   單價 100 萬以上，海關可能會要看            │
│   保證書或保固卡                             │
│   Unit price over ¥1,000,000 —               │
│   customs may ask for the                    │
│   certificate or warranty        >           │
├──────────────────────────────────────────────┤
│ 期限檢查  Deadline check                     │
│ 沒有收據的期限會早於出境日。                 │
│ No receipt expires before you leave.         │
├──────────────────────────────────────────────┤
│ 幾點出發  When to leave                      │
│ 建議 14:40 從飯店出發                        │
│ Leave your hotel by 14:40        >           │
└──────────────────────────────────────────────┘
```


**S17 Packing plan (UJ-017 to UJ-022).** This is where the airport mistake is actually prevented, two hours before the airport. The deadline check reports its own emptiness rather than hiding — the user needs to know it was checked (`DR-076`). The documents reminder fires on `hasHighValueItem` (`DR-016`).

---

## 5. Airport Mode — S30 to S39 (UJ-023 to UJ-032)

Airport Mode takes the whole viewport: no bottom nav, no FAB. Body text is `--text-lg` (20 px) minimum, primary buttons are 56 px tall, and every screen works with the radio off. A quiet *Something's wrong* link sits at the bottom of every step, and the countdown (UJ-032) sits in the header from step 2 onward.


**S30** — Airport Mode, start

```
┌──────────────────────────────────────────────┐
│ ✕        機場流程  Airport mode              │
├──────────────────────────────────────────────┤
│                                              │
│  出境前要做的事                              │
│  Before you leave Japan                      │
│                                              │
│  5 個步驟 · 離線也能用                       │
│  5 steps · works offline                     │
│                                              │
├──────────────────────────────────────────────┤
│  你的狀況  Your situation                    │
│                                              │
│   11 張要辦  receipts to confirm             │
│    2 位旅客  travelers                       │
│    3 家業者  refund operators                │
│    1 張不辦  1 not being claimed             │
│                                              │
├──────────────────────────────────────────────┤
│=== 先過海關，再託運行李。                    │
│=== 託運之後就拿不回來了。                    │
│=== Customs first, bag drop second.           │
│=== You cannot get a checked bag back.        │
├──────────────────────────────────────────────┤
│  要先處理  Fix these first      (2)          │
│  ● 5 張收據的東西還在託運行李                │
│    5 receipts: goods in checked bags         │
│  ● 2 張收據還沒確認東西在不在                │
│    2 receipts not yet checked    >           │
├──────────────────────────────────────────────┤
│  時間  Time                                  │
│  班機 18:40 · 建議 17:40 前辦完              │
│  Flight 18:40 · aim to finish by             │
│  17:40                                       │
├──────────────────────────────────────────────┤
│                                              │
│  [ 開始  Start ]                             │
│                                              │
│  . 這些是什麼意思  What are these . >        │
└──────────────────────────────────────────────┘
```

**S31** — Step 1, have your goods with you

```
┌──────────────────────────────────────────────┐
│ ✕   步驟 1/5          還有 2 小時 48 分      │
│ ● ○ ○ ○ ○            2 h 48 m left           │
├──────────────────────────────────────────────┤
│  把東西都帶在身上                            │
│  Have your goods with you                    │
│                                              │
│  海關可能會要看。每一本護照是分開            │
│  的手續，所以請分別確認。                    │
│  Customs may ask to see them. Each           │
│  passport is a separate procedure.           │
├──────────────────────────────────────────────┤
│  o 宜君  Yi-chun          3 / 5              │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░                         │
│                                              │
│  [x] 松本清 マツキヨ  11/04                  │
│      ¥ 8,900                                 │
│  [x] 唐吉訶德 ドンキ  11/03                  │
│      ¥ 6,200                                 │
│  [x] GU 御殿場        11/07                  │
│      ¥ 8,400                                 │
│  [ ] ABC Mart         11/07                  │
│      ¥ 9,800   ! 標記為託運                  │
│               ! marked as checked            │
│  [ ] LoFt 澀谷        11/06                  │
│      ¥ 5,400                                 │
├──────────────────────────────────────────────┤
│  o 志豪  Chih-hao          0 / 6             │
│  ░░░░░░░░░░░░░░░░░░░░                        │
│  [ ] BIC CAMERA       11/03                  │
│      ¥ 1,280,000  ! 要帶保證書               │
│                   ! bring the                │
│                     certificate              │
│  …                                           │
├──────────────────────────────────────────────┤
│~~~ 有 1 張的東西已經用掉了，那張要           │
│~~~ 走海關人員櫃檯，不走機台。                │
│~~~ 1 receipt has goods that were             │
│~~~ already used. That one goes to a          │
│~~~ customs officer, not the terminal.>       │
├──────────────────────────────────────────────┤
│  [ 都帶了，下一步  Next ]                    │
│  . 有東西找不到  Something is missing .      │
└──────────────────────────────────────────────┘
```


**S31 the hard gate (UJ-024).** Advance is blocked until every claimable receipt is either ticked or explicitly moved out of the list. "Blocked" means the primary button explains rather than greys out: tapping it scrolls to the first unresolved receipt and says 還有 2 張沒確認 / 2 receipts still unresolved. Unticking is always allowed (`DR-063`).


**S32** — Step 2, go landside before check-in

```
┌──────────────────────────────────────────────┐
│ ✕   步驟 2/5          還有 2 小時 31 分      │
│ ● ● ○ ○ ○            2 h 31 m left           │
├──────────────────────────────────────────────┤
│=== 還不要託運行李                            │
│=== Do not check your bags yet!               │
├──────────────────────────────────────────────┤
│  去出境大廳的免稅手續機台                    │
│  Go to the tax-free terminals                │
│                                              │
│  在報到櫃檯之前的出境大廳，還沒過            │
│  安檢的那一側。                              │
│  In the international departure              │
│  lobby, landside — before check-in           │
│  and before security.                        │
│                                              │
│  找這個標示：                                │
│  Look for this sign:                         │
│  「免税手続用の端末」                        │
│  Tax-free procedure terminal                 │
├──────────────────────────────────────────────┤
│  成田機場 NRT                                │
│  你這趟從這裡離開日本。                      │
│  This is where you leave Japan.              │
├──────────────────────────────────────────────┤
│~~~ 成田也可以用 Visit Japan Web 線上         │
│~~~ 辦，但只能在出境大廳指定的 Wi-Fi          │
│~~~ 區域、過安檢之前做。                      │
│~~~ At Narita you can also use Visit          │
│~~~ Japan Web — but only inside the           │
│~~~ departure-lobby Wi-Fi area, before        │
│~~~ security.                       >         │
├──────────────────────────────────────────────┤
│  [ 我到機台了  I am at the terminal ]        │
│  . 上一步  Back .                            │
└──────────────────────────────────────────────┘
```

**S33** — Step 3, at the terminal

```
┌──────────────────────────────────────────────┐
│ ✕   步驟 3/5          還有 2 小時 12 分      │
│ ● ● ● ○ ○            2 h 12 m left           │
├──────────────────────────────────────────────┤
│=== 還不要託運行李  Do not check bags         │
├──────────────────────────────────────────────┤
│  o 宜君  Yi-chun   第 1 位，共 2 位          │
│  Traveler 1 of 2                             │
│                                              │
│  把護照放到機台上掃描。                      │
│  Scan your passport at the terminal.         │
│                                              │
│  幾秒後會出現綠燈或紅燈。                    │
│  In a few seconds you will see a             │
│  green or a red result.                      │
├──────────────────────────────────────────────┤
│  這位旅客這次要確認的                        │
│  What you are confirming for this            │
│  traveler                                    │
│                                              │
│   5 張收據  receipts                         │
│   ¥ 38,700  未稅合計 tax-excluded            │
│                                              │
│  這是 Kaeru 自己的紀錄，現場一律以           │
│  機台和海關為準。                            │
│  This is Kaeru s own record. On the          │
│  spot, the terminal and customs              │
│  decide.                                     │
├──────────────────────────────────────────────┤
│  機台顯示什麼？                              │
│  What did it show?                           │
│                                              │
│  [ GREEN  綠燈 · 不用檢查 ]                  │
│                                              │
│  [ RED    紅燈 · 要檢查 ]                    │
├──────────────────────────────────────────────┤
│  . 機台怪怪的  The terminal is stuck .       │
└──────────────────────────────────────────────┘
```

**S33 shows Kaeru's own record, never a prediction of the terminal screen.** No official source describes what a tax-free procedure terminal displays beyond the inspection-required determination, so the panel is framed as "what you are confirming for this traveler" and defers explicitly: 現場一律以機台和海關為準 / on the spot, the terminal and customs decide. `principles.md` §7 is the rule — do not imply something Kaeru cannot verify.

**S34** — Step 3, green result

```
┌──────────────────────────────────────────────┐
│ ✕   步驟 3/5          還有 2 小時 08 分      │
├──────────────────────────────────────────────┤
│                                              │
│          GREEN                               │
│                                              │
│    綠燈，這位旅客好了                        │
│    Green — this traveler is done             │
│                                              │
│  海關確認完成，不用開箱檢查。                │
│  Customs is confirmed. No inspection         │
│  needed.                                     │
│                                              │
│  已記錄 5 張收據 · o 宜君                    │
│  5 receipts marked · 11/09 15:12             │
├──────────────────────────────────────────────┤
│  還有 1 位旅客要做                           │
│  1 more traveler to go                       │
├──────────────────────────────────────────────┤
│                                              │
│  [ 換下一位 志豪  Next traveler ]            │
│                                              │
│  . 還是先不要託運，等全部做完 .              │
│  . Still do not check bags yet .             │
└──────────────────────────────────────────────┘
```

**S35** — Step 3, red result

```
┌──────────────────────────────────────────────┐
│ ✕   步驟 3/5          還有 1 小時 54 分      │
├──────────────────────────────────────────────┤
│                                              │
│          RED                                 │
│                                              │
│    紅燈 · 要走檢查台                         │
│    Red — go to the inspection desk           │
│                                              │
│  這不是出錯，也不是被抓到。機台只是          │
│  決定要不要看實物。                          │
│  This is not an error and you are not        │
│  in trouble. The terminal simply             │
│  decided to look at your goods.              │
├──────────────────────────────────────────────┤
│  要做什麼  What to do                        │
│  1. 到旁邊的海關檢查台                       │
│     Go to the customs inspection             │
│     desk next to the terminals               │
│  2. 把收據上的東西拿出來給海關看             │
│     Show the goods on each receipt           │
├──────────────────────────────────────────────┤
│=== 檢查是一張收據為單位。那張收據上          │
│=== 少了任何一樣東西，整張都不能退，          │
│=== 連你有帶的也不行。                        │
│=== Inspection is per receipt. If any         │
│=== item on a receipt is missing, that        │
│=== whole receipt is rejected,                │
│=== including the items you do have.          │
│=== . 完整說明  Read more . >                 │
├──────────────────────────────────────────────┤
│  先自己檢查一次  Check yours first           │
│  o 志豪  Chih-hao                            │
│  [x] BIC CAMERA ¥ 1,280,000                  │
│      保證書 certificate [x]                  │
│  [x] 鞋店 ¥ 15,000                           │
│  [ ] NIKE ¥ 11,000   ← 還沒確認              │
├──────────────────────────────────────────────┤
│  [ 海關確認好了  Customs confirmed ]         │
│  . 有一張被退回  One was rejected .          │
└──────────────────────────────────────────────┘
```

**S36** — Already-used goods, routed to the customs desk

```
┌──────────────────────────────────────────────┐
│ ←   已經用掉的東西  Already used             │
├──────────────────────────────────────────────┤
│  這些要走櫃檯，不要用機台                    │
│  These go to a desk, not a terminal          │
│                                              │
│  整張收據都不能退。請不要使用免稅            │
│  手續機台，直接到海關人員櫃檯申報。          │
│  The whole receipt cannot be                 │
│  refunded. Do not use the tax-free           │
│  terminal for it — tell a customs            │
│  officer at the desk.                        │
├──────────────────────────────────────────────┤
│  o 宜君  Yi-chun                             │
│  ┌──────────────────────────────────┐        │
│  │ 松本清 マツキヨ  11/04           │        │
│  │ ¥ 8,900 · 面膜已拆開使用         │        │
│  │ 你在 11/08 標記的              > │        │
│  └──────────────────────────────────┘        │
├──────────────────────────────────────────────┤
│~~~ 誠實申報最安全。海關怎麼處理由            │
│~~~ 他們決定。                                │
│~~~ Declaring honestly is the safe            │
│~~~ option. What happens next is the          │
│~~~ officer s decision.                       │
├──────────────────────────────────────────────┤
│  [ 櫃檯處理好了  Handled at the desk ]       │
│  . 回到步驟 3  Back to step 3 .              │
└──────────────────────────────────────────────┘
```

**S37** — Step 4, customs done, gate released

```
┌──────────────────────────────────────────────┐
│ ✕   步驟 4/5          還有 1 小時 32 分      │
│ ● ● ● ● ○                                    │
├──────────────────────────────────────────────┤
│                                              │
│          ✓                                   │
│                                              │
│    海關確認完成                              │
│    Customs is done                           │
│                                              │
│  o 宜君   5 張 · 綠燈 green                  │
│  o 志豪   6 張 · 紅燈已檢查                  │
│           red, inspected                     │
│                                              │
│  11 張收據已確認，1 張走櫃檯，               │
│  1 張不辦。                                  │
│  11 receipts confirmed, 1 at the             │
│  desk, 1 not claimed.                        │
├──────────────────────────────────────────────┤
│                                              │
│  現在可以去報到、託運行李了。                │
│  Now you can check in and drop your          │
│  bags.                                       │
│                                              │
│  [ 我知道了，去報到  Got it ]                │
│                                              │
├──────────────────────────────────────────────┤
│  . 還有一位旅客沒做  Someone is left .       │
└──────────────────────────────────────────────┘
```

**S38** — Step 5, done

```
┌──────────────────────────────────────────────┐
│ ✕   完成  Done                               │
│ ● ● ● ● ●                                    │
├──────────────────────────────────────────────┤
│                                              │
│          ( frog mark )                       │
│                                              │
│    機場的部分結束了                          │
│    The airport part is over                  │
│                                              │
│  預估可退 ~¥ 14,100                          │
│  Waiting to come back ~¥ 14,100              │
├──────────────────────────────────────────────┤
│  接下來會怎樣  What happens next             │
│                                              │
│  · 退款由店家或退稅業者處理，                │
│    不是日本政府，也不是機場當場給。          │
│    The shop or its refund operator           │
│    pays you — not the government and         │
│    not the airport.                          │
│  · 入帳方式看你登錄時選的。                  │
│    It arrives the way you registered.        │
│  · 沒有法定時間，通常要幾週。                │
│    There is no legal time limit. It          │
│    usually takes a few weeks.                │
│  · Kaeru 會幫你記著，錢進來再回來            │
│    勾一下。                                  │
│    Kaeru will keep track. Tick them          │
│    off when the money arrives.               │
├──────────────────────────────────────────────┤
│                                              │
│  [ 回首頁  Back to home ]                    │
└──────────────────────────────────────────────┘
```

**S39** — Something is wrong

```
┌──────────────────────────────────────────────┐
│ ←   遇到問題  Something is wrong             │
├──────────────────────────────────────────────┤
│  選一個最接近的狀況                          │
│  Pick what is happening                      │
├──────────────────────────────────────────────┤
│ > 收據不見了                                 │
│   I lost a receipt                           │
├──────────────────────────────────────────────┤
│ > 有東西找不到，或已經託運了                 │
│   An item is missing, or already in          │
│   a checked bag                              │
├──────────────────────────────────────────────┤
│ > 機台壞了或排很長                           │
│   The terminal is broken or the              │
│   queue is too long                          │
├──────────────────────────────────────────────┤
│ > 快來不及了                                 │
│   I am running out of time                   │
├──────────────────────────────────────────────┤
│ > 東西在日本已經用掉了                       │
│   I used the goods in Japan                  │
├──────────────────────────────────────────────┤
│ > 找不到機台在哪                             │
│   I cannot find the terminals                │
├──────────────────────────────────────────────┤
│~~~ 每一種都還有辦法。選一個看怎麼做。        │
│~~~ There is a next step for all of           │
│~~~ these. Pick one.                          │
└──────────────────────────────────────────────┘
```

**S39** — Running out of time

```
┌──────────────────────────────────────────────┐
│ ←   快來不及了  Running out of time          │
├──────────────────────────────────────────────┤
│  老實說  Honestly                            │
│                                              │
│  海關確認一定要在託運之前完成，中途          │
│  放棄檢查就等於沒有確認。                    │
│  Customs confirmation has to be              │
│  finished before bag drop, and               │
│  walking away from an inspection             │
│  counts as no confirmation.                  │
│                                              │
│  錯過班機沒有人賠。要放棄哪些，              │
│  由你決定。                                  │
│  Nobody compensates a missed flight.         │
│  What to drop is your call.                  │
├──────────────────────────────────────────────┤
│  金額由大到小  Biggest first                 │
│                                              │
│  1. BIC CAMERA  ~¥ 128,000                   │
│  2. 鞋店         ~¥  1,500                   │
│  3. NIKE         ~¥  1,100                   │
│  4. 其他 8 張合計 ~¥  2,400                  │
│     8 more, combined                         │
├──────────────────────────────────────────────┤
│  可以試試  You can try                       │
│  · 一個人排機台，一個人顧行李                │
│    One queues, one stays with bags           │
│  · 跟地勤說你在辦退稅                        │
│    Tell the check-in staff                   │
├──────────────────────────────────────────────┤
│~~~ 沒辦完的收據不會不見，回國後還是          │
│~~~ 看得到，只是這次退不成。                  │
│~~~ Receipts you skip stay in Kaeru.          │
│~~~ You just will not get the tax back        │
│~~~ for them this time.                       │
├──────────────────────────────────────────────┤
│  [ 回到步驟 3  Back to step 3 ]              │
└──────────────────────────────────────────────┘
```


### Airport Mode microcopy

| Element | zh-TW | en |
|---|---|---|
| Mode title | 機場流程 | Airport mode |
| Governing rule | 先過海關，再託運行李。託運之後就拿不回來了。 | Customs first, bag drop second. You cannot get a checked bag back. |
| Blocking banner | 還不要託運行李 | Do not check your bags yet! |
| Countdown | 還有 2 小時 48 分 | 2 h 48 m left |
| Finish-by | 班機 18:40 · 建議 17:40 前辦完 | Flight 18:40 · aim to finish by 17:40 |
| Step 1 title | 把東西都帶在身上 | Have your goods with you |
| Step 1 reason | 海關可能會要看。每一本護照是分開的手續。 | Customs may ask to see them. Each passport is a separate procedure. |
| Gate message | 還有 2 張沒確認 | 2 receipts still unresolved |
| Step 2 title | 去出境大廳的免稅手續機台 | Go to the tax-free terminals |
| Step 2 place | 在報到櫃檯之前的出境大廳，還沒過安檢的那一側。 | In the international departure lobby, landside — before check-in and before security. |
| Terminal sign | 免税手続用の端末 | Tax-free procedure terminal |
| Final airport | 你這趟從這裡離開日本。 | This is where you leave Japan. |
| VJW note | 只能在出境大廳指定的 Wi-Fi 區域、過安檢之前做。 | Only inside the departure-lobby Wi-Fi area, before security. |
| Green | 綠燈 · 不用檢查 | Green — no inspection |
| Red | 紅燈 · 要檢查 | Red — inspection needed |
| Red reassurance | 這不是出錯，也不是被抓到。機台只是決定要不要看實物。 | This is not an error and you are not in trouble. The terminal simply decided to look at your goods. |
| Red consequence | 檢查是一張收據為單位。那張收據上少了任何一樣東西，整張都不能退，連你有帶的也不行。 | Inspection is per receipt. If any item on a receipt is missing, that whole receipt is rejected, including the items you do have. |
| Used-goods routing | 整張收據都不能退。請不要使用免稅手續機台，直接到海關人員櫃檯申報。 | The whole receipt cannot be refunded. Do not use the tax-free terminal for it — tell a customs officer at the desk. |
| Release | 現在可以去報到、託運行李了。 | Now you can check in and drop your bags. |
| What next | 退款由店家或退稅業者處理，不是日本政府。沒有法定時間，通常要幾週。 | The shop or its refund operator pays you, not the government. There is no legal time limit; it usually takes a few weeks. |
| Out of time | 中途放棄檢查就等於沒有確認。錯過班機沒有人賠。 | Walking away from an inspection counts as no confirmation. Nobody compensates a missed flight. |
| Problem link | 遇到問題 | Something is wrong |
| Offline note | 離線也能用 | Works offline |


---

## 6. Refund tracking — S40, S41 (UJ-033 to UJ-035)


**S40** — Refund tracker

```
┌──────────────────────────────────────────────┐
│ ←        退款追蹤  Refunds                   │
├──────────────────────────────────────────────┤
│  已入帳 Received       ¥  8,420              │
│  還在等 Still waiting ~¥  5,680              │
│  沒退成 Not refunded   ¥    280              │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐         │
│ │ J-TaxRefund                      │         │
│ │ 5 張收據 · 預估淨退 ~¥ 5,680     │         │
│ │ 海關確認後 21 天 · 等待中        │         │
│ │ 21 days since customs · waiting  │         │
│ │ ~~~ 超過你設定的 14 天。         │         │
│ │ ~~~ Past the 14 days you set.  > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ PIE VAT                        ✓ │         │
│ │ 4 張收據 · 實收 ¥ 8,420          │         │
│ │ 手續費 ¥ 480 · 11/22 入帳        │         │
│ │ Fee ¥480 · arrived 22 Nov      > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ Global Blue                      │         │
│ │ 1 張收據 · 預估淨退 ~¥ 1,100     │         │
│ │ 海關確認後 6 天 · 等待中       > │         │
│ └──────────────────────────────────┘         │
├──────────────────────────────────────────────┤
│ 沒退成的  Not refunded          (1)          │
│ > 松本清 11/04 · 面膜在日本用掉了            │
│   Face masks were used in Japan              │
├──────────────────────────────────────────────┤
│ 多久算遲  When to call it late               │
│ [ 14 天 days ] v  這是你的設定，             │
│ 法律沒有規定時間。Your setting —             │
│ there is no legal time limit.                │
└──────────────────────────────────────────────┘
```

**S41** — Operator refund detail

```
┌──────────────────────────────────────────────┐
│ ←        J-TaxRefund                         │
├──────────────────────────────────────────────┤
│  J&J Tax Free / J-TaxRefund                  │
│  5 張收據 · 預估淨退 ~¥ 5,680                │
├──────────────────────────────────────────────┤
│  入帳方式  How they pay                      │
│  你登錄時選的方式                            │
│  Whatever you chose at registration          │
│                                              │
│  手續費  Fee                                 │
│  依業者規定，從退稅金額中扣。                │
│  手續費不受法律管制，也不一定公開。          │
│  Set by the operator and deducted            │
│  from your refund. Fees are not              │
│  regulated and not always published.         │
│  資料日期 2026-10-05  as of                  │
├──────────────────────────────────────────────┤
│  這些收據  These receipts                    │
│  [ ] 松本清 11/04  ~¥   830                  │
│  [ ] 唐吉訶德 11/03 ~¥   440                 │
│  [x] LoFt   11/06  ¥   520 已入帳            │
│      實收 ¥ 520 · 手續費 ¥ 20                │
├──────────────────────────────────────────────┤
│  勾起來表示錢已經進來了。                    │
│  Tick a receipt when the money has           │
│  arrived.                                    │
├──────────────────────────────────────────────┤
│  要聯絡他們的話，手邊準備這些：              │
│  If you contact them, have these             │
│  ready: 購買日期、店名、金額、               │
│  海關確認日期。Purchase date, shop,          │
│  amount, confirmation date.                  │
├──────────────────────────────────────────────┤
│  [ 聯絡 J-TaxRefund  Contact ↗ ]             │
└──────────────────────────────────────────────┘
```

---

## 7. Guide — S50 to S54


**S50** — Guide index

```
┌──────────────────────────────────────────────┐
│ 指南  Guide                     [find]       │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐         │
│ │ 新制怎麼運作                     │         │
│ │ How the new system works       > │         │
│ │ 改了什麼、門檻、期限             │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ 在機場要做什麼                   │         │
│ │ What to do at the airport      > │         │
│ │ 機台、綠燈紅燈、託運順序         │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ 退稅業者                         │         │
│ │ Refund operators               > │         │
│ │ 登錄方式、入帳方式、手續費       │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ 常見問題                         │         │
│ │ FAQ                            > │         │
│ └──────────────────────────────────┘         │
├──────────────────────────────────────────────┤
│ . 再看一次 60 秒說明  Replay the .           │
│ . 60-second explainer .                      │
├──────────────────────────────────────────────┤
│~~~ 內容已經下載好，離線也看得到。            │
│~~~ The guide is bundled — it works           │
│~~~ offline.                                  │
├──────────────────────────────────────────────┤
│ 首頁    收據    機場    指南                 │
└──────────────────────────────────────────────┘
```

**S51** — Guide article

```
┌──────────────────────────────────────────────┐
│ ←   新制怎麼運作  How it works     ⋮         │
├──────────────────────────────────────────────┤
│  1. 先付含稅價                               │
│     You pay the full price                   │
│                                              │
│  2026/11/01 起，免稅店不再現場免稅。         │
│  你在店裡付含稅價，消費稅之後才退。          │
│  From 1 Nov 2026 shops no longer             │
│  deduct the tax at the till. You pay         │
│  the tax-included price and get the          │
│  consumption tax back later.                 │
│                                              │
│  來源 Source: 観光庁 / Japan Tourism         │
│  Agency ↗ · 查閱日 Accessed                  │
│  2026-10-05                                  │
├──────────────────────────────────────────────┤
│  2. 同一天、同一家店 ¥5,000 以上             │
│     ¥5,000 or more, one shop, one day        │
│  …                                           │
├──────────────────────────────────────────────┤
│  3. 90 天內要離境                            │
│     Leave Japan within 90 days               │
│  …                                           │
├──────────────────────────────────────────────┤
│~~~ (i) 這條還可能調整，我們會更新。          │
│~~~ This rule may still change. We            │
│~~~ will update it.                           │
└──────────────────────────────────────────────┘
```


**S51 Guide article.** Every factual section ends with its source link and access date; rules whose status is `pending-legislation` or `unconfirmed` carry the `(i)` caveat inline. This is the only place rule text lives — app screens link here rather than restating.


**S52** — Operator directory

```
┌──────────────────────────────────────────────┐
│ ←        退稅業者  Operators                 │
├──────────────────────────────────────────────┤
│ [ 搜尋  Search                  ]            │
├──────────────────────────────────────────────┤
│ 台灣旅客常遇到  Most common                  │
│ ┌──────────────────────────────────┐         │
│ │ J&J Tax Free (J-TaxRefund)     > │         │
│ │ 掃收據 QR 登錄 · 信用卡 / 匯款   │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ PIE VAT                        > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ Smart Detax (JPrefund)         > │         │
│ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤         │
│ │ Global Blue                    > │         │
│ └──────────────────────────────────┘         │
├──────────────────────────────────────────────┤
│ 其他  Others                                 │
│ > Tourego          > Intasect                │
│ > WAmazing         > Japan Tax Free          │
│ > Global Tax Free  > Ocean                   │
├──────────────────────────────────────────────┤
│~~~ 業者是店家決定的，不是你選的。            │
│~~~ 一趟遇到 2-4 家很正常。                   │
│~~~ The shop picks the operator, not          │
│~~~ you. Two to four per trip is              │
│~~~ normal.                                   │
└──────────────────────────────────────────────┘
```

**S53** — Operator detail

```
┌──────────────────────────────────────────────┐
│ ←        J&J Tax Free                        │
├──────────────────────────────────────────────┤
│ J&J Tax Free（J-TaxRefund）                  │
│ 株式会社J&J（日文名，標記 lang="ja"）        │
├──────────────────────────────────────────────┤
│ 怎麼登錄  How to register                    │
│ 掃收據上或店頭的 QR Code，連到網頁           │
│ 表單，登錄一次就好。                         │
│ Scan the QR on the receipt or in the         │
│ shop. One web form, once.                    │
│                                              │
│ 退款方式  How they pay                       │
│ 信用卡 · 二維碼支付 · 銀行帳戶 · 現金        │
│ Card · QR payment · bank · cash              │
│                                              │
│ 手續費  Fee                                  │
│ 未公布。沒找到數字，我們就說沒有，           │
│ 不會編一個。                                 │
│ Not published. We did not find a             │
│ figure, so we say so rather than             │
│ invent one.                                  │
│ 資料日期 2026-10-05  as of                   │
├──────────────────────────────────────────────┤
│~~~ 這份名單是業者自行向日本全國免稅          │
│~~~ 店協會申報的，不代表協會、日本政府        │
│~~~ 或 Kaeru 的認可或保證。                   │
│~~~ This list is self-declared to the         │
│~~~ national tax-free shop association.       │
│~~~ It is not an endorsement by them,         │
│~~~ by the Japanese government, or by         │
│~~~ Kaeru.                                    │
├──────────────────────────────────────────────┤
│ 你這趟有 5 張收據用這家                      │
│ 5 of your receipts use this operator         │
│ > 看那些收據  See them                       │
├──────────────────────────────────────────────┤
│ [ 開啟官方網站  Official site ↗ ]            │
└──────────────────────────────────────────────┘
```

Every operator detail carries the `DR-053` non-endorsement line and the fee observation date (`DR-026`: fees are volatile and change without notice). "Not published" is shown as itself, never as a blank or a guess.

**S54** — FAQ

```
┌──────────────────────────────────────────────┐
│ ←        常見問題  FAQ                       │
├──────────────────────────────────────────────┤
│ ⌄ 可以先託運再去辦退稅嗎？                   │
│   Can I check my bags first?                 │
│                                              │
│   不行。海關確認一定要在託運之前。           │
│   行李託運後拿不回來，海關要看東西           │
│   的時候拿不出來，那張收據就不能退。         │
│   No. Customs confirmation has to            │
│   happen before bag drop. You cannot         │
│   get a checked bag back, so you             │
│   could not show the goods.                  │
├──────────────────────────────────────────────┤
│ > 紅燈是不是代表我有問題？                   │
│   Does a red result mean trouble?            │
├──────────────────────────────────────────────┤
│ > 在日本吃掉的東西怎麼辦？                   │
│   What if I ate some of it in Japan?         │
├──────────────────────────────────────────────┤
│ > 退的錢什麼時候會進來？                     │
│   When does the money arrive?                │
├──────────────────────────────────────────────┤
│ > 手續費會不會比退的錢還多？                 │
│   Can the fee exceed the refund?             │
├──────────────────────────────────────────────┤
│ > 一家人可以用同一本護照辦嗎？               │
│   Can a family use one passport?             │
├──────────────────────────────────────────────┤
│ > 還要在護照上貼單子嗎？                     │
│   Is there still a paper form?               │
└──────────────────────────────────────────────┘
```

---

## 8. Settings — S60 to S63 (UJ-003, UJ-037)


**S60** — Settings

```
┌──────────────────────────────────────────────┐
│ ←        設定  Settings                      │
├──────────────────────────────────────────────┤
│ 語言  Language                               │
│ > 繁體中文                     ✓             │
│   English                                    │
├──────────────────────────────────────────────┤
│ 外觀  Appearance                             │
│ [ 跟隨系統 System ]( 淺色 Light )            │
│ ( 深色 Dark )                                │
├──────────────────────────────────────────────┤
│ 行程與旅客  Trip and travelers               │
│ > 11/09 · 成田 NRT · 2 位旅客   >            │
│ > 機場多留 60 分  60 min buffer >            │
│ > 多久算遲 14 天  Late after 14 >            │
├──────────────────────────────────────────────┤
│ 資料  Your data                              │
│ > 匯出備份  Export a backup      >           │
│ > 匯入備份  Import a backup      >           │
│ > 刪除所有資料  Delete all data   >          │
├──────────────────────────────────────────────┤
│ 關於  About                                  │
│ > 隱私說明  Privacy              >           │
│ > 版本 0.1.0 · 原始碼 Source ↗               │
├──────────────────────────────────────────────┤
│~~~ 資料只存在這支手機。換手機前記得          │
│~~~ 先匯出。                                  │
│~~~ Your data lives on this phone.            │
│~~~ Export before you switch devices.         │
└──────────────────────────────────────────────┘
```

**S61** — Trip and travelers

```
┌──────────────────────────────────────────────┐
│ ←        行程  Your trip                     │
├──────────────────────────────────────────────┤
│ 出境日期  Departure date                     │
│ [ 2026 / 11 / 09            ] [cal]          │
│                                              │
│ 出境機場  Departure airport                  │
│ [ 成田 NRT                  ] v              │
│                                              │
│ 班機時間  Flight time                        │
│ [ 18:40                     ] [time]         │
│                                              │
│ 報到需要  Check-in needs                     │
│ [ 60 ] 分鐘 minutes                          │
│  航空公司規定的報到截止時間                  │
│  Your airline s check-in cut-off             │
│                                              │
│ 退稅多留  Extra for tax-free                 │
│ ( 30 )[ 60 ]( 90 ) 分鐘 minutes              │
│  Kaeru 的建議，官方沒有數字。                │
│  Our suggestion. There is no                 │
│  official figure.                            │
├──────────────────────────────────────────────┤
│ 算出來  Which gives you                      │
│ 建議 14:40 從飯店出發                        │
│ Leave your hotel by 14:40                    │
├──────────────────────────────────────────────┤
│ 旅客  Travelers                              │
│ > o 宜君 · 7431 · 7 張收據      >            │
│ > o 志豪 · — · 5 張收據         >            │
│ . + 新增旅客  Add traveler .                 │
├──────────────────────────────────────────────┤
│ 多久算遲  When to call a refund late         │
│ [ 14 ] 天 days                               │
│  法律沒有規定入帳時間，這是你自己的          │
│  標準。There is no legal time limit.         │
│  This is your own threshold.                 │
└──────────────────────────────────────────────┘
```

Every derived number shows its inputs. The check-in requirement is the airline's, the buffer is Kaeru's suggestion, and the overdue threshold is the user's own — three different kinds of authority, labelled as such so the user knows which ones they may disagree with.

**S62** — Data: export, import, delete

```
┌──────────────────────────────────────────────┐
│ ←        資料  Your data                     │
├──────────────────────────────────────────────┤
│  匯出備份  Export a backup                   │
│  把所有行程、收據、狀態存成一個檔案。        │
│  Saves every trip, receipt, and              │
│  status into one file.                       │
│                                              │
│  [ ] 包含收據照片 Include photos             │
│      會讓檔案變很大（約 18 MB）              │
│      Makes the file much larger              │
│      (about 18 MB)                           │
│                                              │
│  [ 匯出  Export ]                            │
│  kaeru-backup-2026-11-09.json                │
├──────────────────────────────────────────────┤
│  匯入備份  Import a backup                   │
│  [ 選擇檔案  Choose a file ]                 │
│  匯入前會先讓你看裡面有什麼。                │
│  You will see what is inside before          │
│  anything changes.                           │
├──────────────────────────────────────────────┤
│=== 刪除所有資料  Delete all data             │
│=== 所有行程、收據、照片都會不見，            │
│=== 而且無法復原。                            │
│=== Every trip, receipt, and photo is         │
│=== erased. This cannot be undone.            │
│===                                           │
│=== . 先匯出一份  Export first .              │
│=== [ 刪除所有資料  Delete all ]              │
└──────────────────────────────────────────────┘
```

**S63** — Privacy

```
┌──────────────────────────────────────────────┐
│ ←        隱私  Privacy                       │
├──────────────────────────────────────────────┤
│  Kaeru 不會收集你的任何資料。                │
│  Kaeru collects nothing.                     │
├──────────────────────────────────────────────┤
│  · 沒有帳號，不用註冊                        │
│    No account, no sign-up                    │
│  · 沒有伺服器，資料不會離開這支手機          │
│    No server. Your data never leaves         │
│    this phone                                │
│  · 沒有分析、沒有追蹤、沒有廣告              │
│    No analytics, no tracking, no ads         │
│  · 不存完整護照號碼，只存你自己填的          │
│    末四碼，而且是選填                        │
│    We never store a full passport            │
│    number — only the last 4 digits,          │
│    and only if you enter them                │
│  · 收據照片存在這支手機的瀏覽器裡            │
│    Receipt photos stay in this               │
│    browser on this phone                     │
├──────────────────────────────────────────────┤
│  Kaeru 不是退稅業者。我們不會替你送件，      │
│  也不會跟業者或政府系統連線。所有狀態        │
│  都是你自己標記的。                          │
│  Kaeru is not a refund operator. We          │
│  do not submit anything for you and          │
│  we do not connect to operators or           │
│  government systems. Every status is         │
│  one you set yourself.                       │
├──────────────────────────────────────────────┤
│  . 原始碼在 GitHub  Source ↗ .               │
└──────────────────────────────────────────────┘
```

---

## 9. Cross-cutting states

### Offline

Only shown where being offline actually changes what the user can do: outbound operator links, the Visit Japan Web handoff, and the QR scanner's link-out. Everything else is local and behaves identically.


**Offline** — only where it changes what you can do (S22 shown)

```
┌──────────────────────────────────────────────┐
│ ←        收據  Receipt            ⋯          │
├──────────────────────────────────────────────┤
│ 退稅業者  Refund operator                    │
│ J-TaxRefund (J&J Tax Free)        v          │
│                                              │
│ ~~~ [net] 目前離線。業者網站要連線           │
│ ~~~ 才能開，等有訊號再登錄就好。             │
│ ~~~ You are offline. The operator            │
│ ~~~ site needs a connection — you can        │
│ ~~~ register once you have signal.           │
│                                              │
│ ( 開啟 J-TaxRefund 網站  ↗ )  停用           │
├──────────────────────────────────────────────┤
│ 其他都還能用：記收據、看期限、               │
│ 機場流程都不用網路。                         │
│ Everything else still works:                 │
│ receipts, deadlines, and airport             │
│ mode need no connection.                     │
└──────────────────────────────────────────────┘
```


### Form error


**Form error** — S21 on a failed submit

```
┌──────────────────────────────────────────────┐
│ ✕        記一筆  Add receipt                 │
├──────────────────────────────────────────────┤
│ 未稅金額  Tax-excluded total   *             │
│  ¥ [ 0                          ]            │
│  ! 金額要大於 0                              │
│  ! Enter an amount greater than 0            │
├──────────────────────────────────────────────┤
│ 店家  Shop                      *            │
│ [                              ]             │
│  ! 請填店家名稱，之後才找得到這張收據        │
│  ! Add the shop name so you can find         │
│    this receipt later                        │
├──────────────────────────────────────────────┤
│ 誰買的  Who bought it           *            │
│ [ o 宜君 ]( o 志豪 )                         │
├──────────────────────────────────────────────┤
│ [ 儲存  Save ]                               │
│  還有 2 個欄位要填                           │
│  2 fields still need you                     │
└──────────────────────────────────────────────┘
```


Validation runs on blur and on submit, never on keystroke. Errors are announced via `aria-live="polite"`, the first invalid field receives focus on a failed submit, and the message is attached with `aria-describedby`. The Save button is never disabled — a disabled button with no explanation is a dead end; it fails and explains instead (`DR-080`: validation informs, the user decides).

### Storage write failure


**Storage write failure** — global

```
┌──────────────────────────────────────────────┐
├──────────────────────────────────────────────┤
│=== 存不進去  Could not save                  │
│=== 這支手機的瀏覽器空間滿了，或是            │
│=== 在無痕模式。                              │
│=== This browser is out of space, or          │
│=== you are in private browsing.              │
│===                                           │
│=== 可以試試：刪掉幾張收據照片，或是          │
│=== 先匯出備份再清理。                        │
│=== Try removing a few receipt photos,        │
│=== or export a backup first.                 │
│===                                           │
│=== [ 去管理資料  Manage data ]               │
│=== . 再試一次  Try again .                   │
├──────────────────────────────────────────────┤
└──────────────────────────────────────────────┘
```


### Install prompt

Offered before the trip (UJ-004), not at the airport — Airport Mode has to be installed and cached before it is needed.


**Install prompt** — offered before the trip, never at the airport

```
┌──────────────────────────────────────────────┐
├──────────────────────────────────────────────┤
│~~~ 把 Kaeru 加到主畫面                       │
│~~~ Add Kaeru to your home screen             │
│~~~                                           │
│~~~ 加到主畫面之後，開啟更快，而且            │
│~~~ 在機場沒訊號也打得開。                    │
│~~~ It opens faster and still works           │
│~~~ at the airport with no signal.            │
│~~~                                           │
│~~~ [ 加到主畫面  Add ]                       │
│~~~ . 現在不要  Not now .                     │
├──────────────────────────────────────────────┤
└──────────────────────────────────────────────┘
```


### Cross-cutting microcopy

| Element | zh-TW | en |
|---|---|---|
| Offline, operator link | 目前離線。業者網站要連線才能開，等有訊號再登錄就好。 | You are offline. The operator site needs a connection — you can register once you have signal. |
| Offline, reassurance | 記收據、看期限、機場流程都不用網路。 | Receipts, deadlines, and airport mode need no connection. |
| Amount error | 金額要大於 0 | Enter an amount greater than 0 |
| Shop error | 請填店家名稱，之後才找得到這張收據 | Add the shop name so you can find this receipt later |
| Submit blocked | 還有 2 個欄位要填 | 2 fields still need you |
| Future date warning | 這個日期還沒到，確定嗎？ | That date has not happened yet. Is it right? |
| Deadline-before-departure warning | 這張的海關期限在出境日之前，來不及辦。 | This receipt's customs deadline falls before you leave — it cannot be confirmed in time. |
| Storage error | 存不進去。這支手機的瀏覽器空間滿了，或是在無痕模式。 | Could not save. This browser is out of space, or you are in private browsing. |
| Install prompt | 加到主畫面之後，開啟更快，而且在機場沒訊號也打得開。 | It opens faster and still works at the airport with no signal. |
| Generic retry | 再試一次 | Try again |

---

## 10. Layout notes for engineering

| Rule | Detail |
|---|---|
| Viewport | Designed at 360x640. Must survive 320 px wide without horizontal scroll, and 200 % text zoom without loss of content. |
| Max width | Content column caps at `--content-max` (480 px) and centres. |
| Gutters | `--space-5` (16 px) left and right on every screen. |
| Bottom nav | Fixed, `--shadow-sheet`, `padding-bottom: var(--safe-bottom)`. Hidden in Airport Mode and full-screen flows. |
| FAB | 56 px, bottom-right, `--space-5` from the edge, clearing the bottom nav. |
| Sticky app bar | Flat until the content scrolls under it, then `--shadow-raised`. |
| Long strings | English wraps to two lines; never truncated with an ellipsis. Shop names use `overflow-wrap: anywhere`. |
| Lists | Receipt rows are at least 72 px tall so a three-line bilingual row never clips. |
| Keyboard | The amount field uses `inputmode="numeric"`. The primary action stays reachable above the on-screen keyboard. |
| Amounts | Always tabular numerals; `¥` from `Intl.NumberFormat`, no decimals. |
| Airport Mode | Minimum body 20 px, primary buttons 56 px, no network on any path, state persisted after every tap. |
