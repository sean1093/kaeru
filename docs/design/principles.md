# Design Principles

| | |
|---|---|
| Status | v1.0 (M0) |
| Date | 2026-10-05 |
| Owner | UX designer |
| Tracking | Issue #3 |
| Inputs | `docs/product/brief.md`, `docs/product/user-journey.md` |

Seven principles. Each one is a tie-breaker: when two designs are both defensible, the one that honours the higher principle wins. They are ordered — 1 beats 7.

The user we design for: a tired traveler, one hand on a phone and one hand full of shopping bags, standing in a queue at Narita with 2 bars of signal and a flight in 90 minutes, reading Traditional Chinese or English.

---

## 1. One glance, one action

Every screen answers one question and offers one obvious next move. A traveler should never have to read a screen twice to know what to do.

| | |
|---|---|
| **Do** | Home leads with one number (tax waiting to come back) and one primary action. Airport Mode shows exactly one step at a time, with the step number and the total. |
| **Do** | Put the single most important action in a full-width button in the bottom third of the screen, inside thumb reach. |
| **Don't** | Put three equally weighted buttons side by side ("Edit", "Share", "Delete") at the top of a receipt. |
| **Don't** | Show the dashboard total, the deadline, the operator breakdown, and an onboarding tip in one viewport. |
| **Test** | Cover the screen, uncover it for two seconds, cover it again. Can the user say what the screen is about and what they would tap? |

## 2. Calm by default, unmistakable when it matters

The product is quiet almost everywhere, so the two or three moments that can cost real money land hard. Attention is a budget: spend it on "do not check your bags yet" and on nothing else.

| | |
|---|---|
| **Do** | Reserve `--color-attention` (shu 朱) for exactly three things: a blocking airport state, a deadline inside 7 days, and a destructive confirmation. |
| **Do** | Make the critical airport warning a persistent, full-width banner that the user must acknowledge — not a toast that disappears. |
| **Don't** | Colour every pending receipt red because it is "not done yet". Pending is the normal state of a receipt; it is neutral. |
| **Don't** | Use red and a warning triangle and a shake animation and a modal for the same message. One channel of emphasis plus plain words is enough. |
| **Never** | Convey a state by colour alone. Every status carries an icon or a word too (WCAG 1.4.1). |

## 3. Offline is the normal case, not the error case

The airport is where Kaeru matters most and where the network is worst. Offline is a supported mode, not a failure. The app never shows a sad cloud when it has everything it needs on the device.

| | |
|---|---|
| **Do** | Design every MVP screen to be fully functional with the radio off. All data is local; there is nothing to fetch. |
| **Do** | Show an offline indicator only where offline actually changes what the user can do — i.e. outbound links to operator sites and the Visit Japan Web handoff. |
| **Don't** | Show a global "You are offline" banner on screens that work identically offline. It teaches the user that the app is broken when it is not. |
| **Don't** | Gate a primary action behind a connectivity check or a spinner. |
| **Copy** | zh-TW: 目前離線，但 Kaeru 的資料都在你的手機裡，照常使用。 / en: You're offline. Everything Kaeru needs is already on your phone. |

## 4. Bilingual parity, not translation

Traditional Chinese and English are two first-class products that happen to share a codebase. Layouts are designed against the *longer* string, and Chinese typography gets its own line height and letter spacing rather than inheriting Latin defaults.

| | |
|---|---|
| **Do** | Size every button, chip, and label against the English string, which is typically 1.6–2.2x wider than the zh-TW one. "海關確認完成" is 6 characters; "Customs confirmation done" is 25. |
| **Do** | Use the vocabulary travelers already read on Japanese receipts and airport signage: 退稅, 免稅, 收據, 護照, 託運, 海關, 手續費, 隨身行李, 消耗品. |
| **Do** | Set `lang` correctly per element so the right font and line-breaking rules apply; Japanese proper nouns (店名, 免税手続用の端末) are marked `lang="ja"`. |
| **Don't** | Truncate English with an ellipsis to make a Chinese-sized box work. Wrap to two lines instead. |
| **Don't** | Machine-translate operator names or legal terms. Operator brand names stay in their own script (J&J Tax Free, PIE VAT, Global Blue). |
| **Don't** | Build a sentence from concatenated fragments. Every string is a whole sentence with named placeholders. |

## 5. Privacy you can feel

The brief promises no server, no account, no analytics, no full passport numbers. A promise the user cannot see is worth nothing, so privacy is a visible, inspectable property of the UI.

| | |
|---|---|
| **Do** | State it on the first onboarding screen in one line, and again in Settings with an export button right next to it — the proof is that the user can take the data and leave. |
| **Do** | Store and display only the last 4 characters of a passport number, entered as a *label* field ("Mom's passport ending 7431"). The field is optional. |
| **Do** | Make "Delete all data" real, immediate, and local, with a plain-language confirmation. |
| **Don't** | Ask for anything Kaeru does not need: no email, no name-as-identity, no full passport number, no card number. |
| **Don't** | Add an avatar, a profile, or a "sync" affordance that implies an account exists. |
| **Copy** | zh-TW: 資料只存在這支手機，沒有帳號、沒有伺服器。 / en: Your data stays on this phone. No account, no server. |

## 6. Forgiving of a tired traveler

Input happens standing up, one-handed, in bad light, at the end of a 20,000-step day. The design assumes mistakes and makes them cheap.

| | |
|---|---|
| **Do** | Hit the 20-second target for adding a receipt with smart defaults: today's date, the current trip, the last-used traveler, 10% rate, numeric keypad focused on open. |
| **Do** | Accept "I'm not sure" as a first-class answer for the refund operator, and surface it later as a gentle action item rather than a blocking error. |
| **Do** | Make every destructive action undoable for 5 seconds via a toast; keep targets at 44x44 px minimum with 8 px between them. |
| **Don't** | Require a shop name, a photo, or a packing location before a receipt can be saved. Those are enrichments for the hotel in the evening. |
| **Don't** | Validate on every keystroke. Validate on blur and on submit, and never move the cursor for the user. |
| **Don't** | Use a modal to confirm something harmless. |

## 7. Honest about what Kaeru is and is not

Kaeru is a personal notebook that knows the rules. It does not talk to operators, does not submit anything, and cannot promise money. Overstating that would be the fastest way to lose a user's trust at the exact moment they need it.

| | |
|---|---|
| **Do** | Label amounts as estimates and show the arithmetic: "Estimated refund — the operator's fee is deducted from this". |
| **Do** | Hand off to the operator explicitly: "Open J-TaxRefund to register" opens their site in a new tab, and the registration status in Kaeru is something the user confirms themselves. |
| **Do** | Date and cite every rule shown in the guide, and mark rules that may change before 2026-11-01. |
| **Don't** | Write "We'll get your refund" or "Refund submitted". Kaeru records; the operator pays. |
| **Don't** | Imply a status Kaeru cannot verify. "Marked as registered by you" is honest; "Registered" alone is not. |

---

## Applying the principles: the three hardest moments

| Moment | Governing principle | Design response |
|---|---|---|
| Logging a receipt in a shop with bags in hand | 1, 6 | One screen, four fields, three pre-filled. Save is always enabled; missing enrichment becomes a quiet action item. |
| Standing at the kiosk, offline, 90 minutes to the gate | 1, 2, 3 | Airport Mode: one step per screen, large text, no network, a persistent "do not check your bags yet" banner that only the user can clear. |
| A red customs result with one item missing from a receipt | 2, 7 | A dedicated screen in plain language: what red means, where to go, and the honest consequence — one missing item voids that whole receipt. No blame, one clear next step. |
