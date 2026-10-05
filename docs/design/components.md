# Component Specifications

| | |
|---|---|
| Status | v1.3 (M0) |
| Date | 2026-10-05 |
| Owner | UX designer |
| Tracking | Issue #3 |
| Depends on | `visual-language.md` (tokens), `wireframes.md` (usage) |

Every value below is a token from `tokens.css`. A component that needs a raw hex, px, or duration is a bug in this document — report it rather than inventing one.

## Rules that apply to every component

| Rule | Requirement |
|---|---|
| Target size | Minimum 44x44 px hit area (WCAG 2.2 AA 2.5.8), even when the painted control is smaller. Use padding or a pseudo-element, not a bigger visual. Minimum `--space-3` (8 px) between adjacent targets. |
| Focus | One ring everywhere: `outline: 2px solid var(--color-focus); outline-offset: var(--space-1)`. Never `outline: none` without an equivalent replacement. Focus is visible on every surface (>= 8.3:1 light, >= 8.5:1 dark). |
| Colour | Never the only carrier of meaning. Every status has an icon or a word (WCAG 1.4.1). |
| Text scaling | Survives 200 % browser text size with no loss of content or function (WCAG 1.4.4). All sizes in `rem`; no fixed heights on text containers — use `min-block-size` plus padding. |
| Truncation | English labels are never truncated with an ellipsis. Wrap to two lines. Only user-entered values (shop names, notes) may truncate in a list row, and then the full value is on the detail screen. |
| Reflow | No horizontal scrolling at 320 px wide (WCAG 1.4.10). |
| Motion | Only duration tokens; the global reduced-motion override handles the preference. No component branches on `prefers-reduced-motion` itself. |
| Labels | Every control has a programmatic name. Icon-only controls carry `aria-label` on the control, never on the `<svg>`. Decorative SVGs are `aria-hidden="true" focusable="false"`. |
| Language | Every string comes from the i18n layer. Japanese fragments inside Chinese or English text are wrapped in `<span lang="ja">`. |
| Disabled | Prefer not disabling. Where a control must be disabled, it keeps >= 3:1 contrast, stays focusable where it explains itself, and the reason is adjacent text — never a tooltip. |

---

## 1. App bar

A single-row header: optional back, title, optional single action.

| Property | Value |
|---|---|
| Height | 56 px (`min-block-size`, grows with text scale) |
| Background | `--color-bg`, becoming `--color-surface-raised` + `--shadow-raised` once content scrolls under it |
| Title | `--text-lg`, `--weight-medium`, `--color-text`, truncates at two lines then clips |
| Back | `chevron-left` 24 px, 44x44 target, `aria-label` 返回 / Back |
| Action | At most one icon action; more go into an overflow `⋯` menu |
| Semantics | `<header>` with the title as `<h1>` for the screen |

States: **default** flat; **scrolled** raised; **modal** variant replaces back with `x` (關閉 / Close).

Transition between flat and raised is `--duration-fast` on `box-shadow` only, which is exempt from the no-shadow-animation rule because it is an opacity-equivalent 1 px change; if it causes jank, swap to a static border.

---

## 2. Bottom navigation

| Property | Value |
|---|---|
| Items | Exactly 4 |
| Height | 56 px + `--safe-bottom` |
| Background | `--color-surface-raised`, `--shadow-sheet`, 1 px `--color-border` top edge |
| Item | Icon 24 px over label `--text-sm`, stacked, centred; whole item is the target |
| Active | `--color-primary` icon and label, `--weight-medium`, plus a 2 px top indicator bar |
| Inactive | `--color-text-muted` |
| Badge | 8 px dot (`--color-attention`) for "needs action", or a pill with a count at `--text-xs` on `--color-attention` / `--color-on-attention` |

Accessibility: `<nav aria-label="主要導覽 / Main">` containing a list of links; the active item carries `aria-current="page"`. The badge is not announced on its own — the link's accessible name includes the count ("收據，3 項待處理" / "Receipts, 3 need action"). Hidden in Airport Mode and in full-screen flows.

At 320 px the four English labels ("Home", "Receipts", "Airport", "Guide") fit at `--text-sm`; at 200 % text scale labels wrap to two lines and the bar grows. Labels are never hidden in favour of icons alone.

---

## 3. Buttons

Three weights. A screen has at most one primary button.

| Variant | Fill | Label | Border | Use |
|---|---|---|---|---|
| Primary | `--color-primary` | `--color-on-primary` | none | The one action of a screen |
| Secondary | transparent | `--color-primary` | 1 px `--color-border-strong` | An alternative that is not the main path |
| Quiet | transparent | `--color-primary` | none | Tertiary; text-link weight |
| Destructive | `--color-attention` | `--color-on-attention` | none | Delete all data; delete receipt confirm |

| Property | Value |
|---|---|
| Height | 48 px default; 56 px in Airport Mode; 40 px for inline quiet |
| Padding | `--space-5` inline, `--space-4` block |
| Radius | `--radius-md` |
| Label | `--text-base`, `--weight-medium`, centred, wraps to two lines |
| Full width | Default for primary and destructive on mobile |

States:

| State | Treatment |
|---|---|
| Default | As above |
| Hover (pointer only) | Primary fill → `--color-primary-hover`; secondary/quiet background → `--color-primary-soft` |
| Pressed | Same as hover plus `transform: scale(0.98)` over `--duration-instant`, `--ease-standard` |
| Focus | Standard ring, offset `--space-1` so it clears the fill |
| Disabled | `--color-bg-sunken` fill, `--color-text-subtle` label, `cursor: not-allowed`, `aria-disabled="true"` rather than the `disabled` attribute so it stays focusable and its explanation is reachable |
| Loading | Not used. Local work is instant; there is nothing to wait for |

Contrast: primary label 8.91:1 light, 9.10:1 dark; pressed 11.85:1 / 11.35:1; destructive label 5.93:1 / 7.94:1. Secondary and quiet labels are `--color-primary` on `--color-surface` at 8.91:1 / 8.56:1.

**Save is never disabled on Add Receipt.** It submits, fails, and explains (see Form fields). A disabled button with no reason is a dead end for a tired user.

---

## 4. Card

| Property | Value |
|---|---|
| Background | `--color-surface` |
| Border | 1 px `--color-border` |
| Radius | `--radius-lg` |
| Padding | `--space-5` |
| Shadow | None. Cards are flat; separation comes from the border and the `--color-bg` gap |
| Gap between cards | `--space-6` |

A card that is entirely tappable is a `<button>` or `<a>` wrapping the content, with the focus ring on the card itself and `--color-bg-sunken` as the pressed background. A card with multiple actions is never itself tappable — ambiguous targets are worse than an extra tap.

---

## 5. List row

The workhorse of the receipt list.

| Property | Value |
|---|---|
| Min height | 72 px (three bilingual lines + padding) |
| Padding | `--space-4` block, `--space-5` inline |
| Divider | 1 px `--color-border`, inset to the text start, omitted on the last row |
| Primary line | `--text-base`, `--color-text`, `--weight-medium` |
| Secondary line | `--text-sm`, `--color-text-muted` |
| Status line | Status chip or icon + word, `--text-sm` |
| Trailing | `chevron-right` 20 px, `--color-text-subtle`, `aria-hidden` |
| Amount | Right-aligned, tabular numerals |

States: **default**; **pressed** `--color-bg-sunken` over `--duration-instant`; **focus** standard ring inset so it is not clipped by the card; **selected** (multi-select in packing plan) `--color-primary-soft` background plus a check icon.

Semantics: a list is `<ul>`/`<li>`; each row is one `<a>` or `<button>` so a screen reader announces one item, not five fragments. Shop names use `overflow-wrap: anywhere`; the shop name may clamp to two lines, the amount never clamps.

---

## 6. Status chip

One chip per `DR-060` state. The set is closed: a status that is not in this table does not exist.

| State (`DR-060`) | Background | Text | Icon | zh-TW | en |
|---|---|---|---|---|---|
| `logged` | `--color-bg-sunken` | `--color-text-muted` | `circle` | 已記錄 | Logged |
| `registered` | `--color-primary-soft` | `--color-primary` | `check` | 已向業者登錄 | Registered |
| `customs_confirmed` | `--color-success-soft` | `--color-success` | `check-circle` | 海關已確認 | Customs confirmed |
| `refund_pending` | `--color-primary-soft` | `--color-primary` | `clock` | 等待入帳 | Refund pending |
| `refunded` | `--color-success-soft` | `--color-success` | `check-circle` | 已入帳 | Received |
| `rejected` | `--color-attention-soft` | `--color-attention` | `x` | 未通過 | Rejected |
| `refund_disputed` | `--color-attention-soft` | `--color-attention` | `circle-alert` | 金額有問題 | Amount disputed |
| `not_claiming` | `--color-bg-sunken` | `--color-text-muted` | `circle-slash` | 不辦這張 | Not claiming |

Two chips share `--color-success-soft` (`customs_confirmed`, `refunded`) and two share `--color-primary-soft` (`registered`, `refund_pending`); they are told apart by icon and word, which is the rule anyway. Separate chips, outside the lifecycle, mark things the app needs the user to do: 要處理 / Needs you (`circle-alert`, attention) and 業者未確認 / Operator unknown (`circle-alert`, muted).

Every state is user-asserted (`DR-062`). A chip never implies Kaeru verified anything, and the detail screen always attributes it: 你在 11/04 標記的 / you marked this on 4 Nov.

| Property | Value |
|---|---|
| Height | 24 px (not a target; the row around it is) |
| Padding | `--space-2` block, `--space-3` inline |
| Radius | `--radius-pill` |
| Text | `--text-sm`, `--weight-medium` |
| Icon | 16 px, `--space-2` before the label |

Contrast of every chip text/background pair is listed in `visual-language.md`; the lowest is 5.12:1. A chip is never interactive — it is a label. Status is conveyed by icon *and* word, so colour-blind users and greyscale screenshots still work.

---

## 7. Amount display

Money is the product; it gets its own component.

Three different money numbers coexist and must be distinguishable at a glance. They are distinguished by **form**, never by colour — colour is reserved for status, and a red number would read as an error.

| Number | Form | Label | Example |
|---|---|---|---|
| Tax on the receipt | plain | 消費稅 / Consumption tax | `¥890` |
| Estimated net after fees | `~` prefix | 預估淨退 / Estimated net | `~¥830` |
| Actually received | plain, with a derived fee line | 實收 / Received | `¥520`, 手續費 `− ¥20` |

Only the estimate is ever hero-sized, and it always carries a rider naming the deduction (`DR-025`). Where the operator fee is unknown, show the gross and say the net is unknown — never present gross as what will arrive.

| Size | Token | Use |
|---|---|---|
| Hero | `--text-3xl`, `--weight-bold` | Home: estimated net waiting to come back |
| Large | `--text-2xl`, `--weight-bold` | Section totals, refund tracker |
| Body | `--text-base` | List rows, detail lines |
| Small | `--text-sm` | Fee, per-receipt estimate inside a group |

Rules:

- `font-variant-numeric: tabular-nums` always. A total that re-renders must not shift.
- Format with `Intl.NumberFormat(locale, { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 })`. Yen has no minor unit: `¥12,345`, never `¥12,345.00`. Money is integer yen end to end; never a float (`DR-071`).
- In the hero, the `¥` symbol is `--text-xl` against `--text-3xl` digits and `--color-text-muted`, so the eye lands on the digits. That is a bigger gap than "one step" on the type scale, found and kept during implementation because it serves the goal at least as well as a smaller gap would.
- Kaeru's own estimates round **down** per line, then sum (`DR-024`), so Kaeru never promises more than arrives.
- A derived amount — tax-excluded computed from tax-included — is additionally labelled as calculated at the point of entry (`DR-022`), because shop rounding is the issuer's choice and we cannot reproduce it to the yen.
- Deductions use a true minus sign: `− ¥550` (U+2212), not a hyphen.
- Accessibility: the visual string is wrapped with an `aria-label` that reads naturally — "24,860 日圓" / "24,860 yen". The `~` is not announced; the word 預估 / Estimated in the label carries that meaning.
- Zero state: `¥0` with the muted label 還沒有收據 / No receipts yet — never a blank.

---

## 8. Progress

Two forms.

**Linear bar** (per-traveler checklist in Airport Mode):

| Property | Value |
|---|---|
| Height | 6 px |
| Track | `--color-bg-sunken` |
| Fill | `--color-primary`; `--color-success` once complete |
| Radius | `--radius-pill` |
| Transition | `transform: scaleX()` over `--duration-normal`, `--ease-standard` |

Semantics: `role="progressbar"` with `aria-valuenow/min/max` and an `aria-label`. The numeric form ("3 / 5") is always shown next to the bar — the bar alone is decoration.

**Step indicator** (Airport Mode header): "步驟 2/5 · Step 2 of 5" as text at `--text-sm`, plus five dots (`--radius-full`, 8 px): completed `--color-success`, current `--color-primary` at 10 px, upcoming `--color-border-strong`. The text is the accessible source of truth; dots are `aria-hidden`.

---

## 9. Stepper (Airport Mode shell)

| Property | Value |
|---|---|
| Layout | Full viewport, no bottom nav, no FAB |
| Header | Close `x`, step text, step dots |
| Body | Scrollable, `--text-lg` minimum body size |
| Footer | Sticky, `--color-bg`, 1 px `--color-border` top, `--space-5` padding + `--safe-bottom`; one 56 px primary button, with a quiet secondary below |
| Transition | Next step slides in 16 px from the end side and fades, `--duration-normal`, `--ease-out`; back reverses |

Behaviour:

- Progress is persisted after every interaction; closing and reopening resumes at the same step.
- The blocking "do not check your bags yet" banner is rendered by the shell, not by individual steps, and clears only at step 4 after the user confirms customs is done for every traveler (`UJ-026`, `UJ-031`). It is `role="status"` on first appearance (polite, not interruptive) and is visually persistent thereafter; it does not re-announce on each step.
- **The advance gate explains, it does not grey out.** When a step has unresolved items, the primary button stays enabled; pressing it scrolls to the first unresolved row, moves focus there, and announces the count ("還有 2 張沒確認 / 2 receipts still unresolved"). A disabled button in a queue is a dead end.
- Leaving the mode is always possible and always keeps progress. Friction, never a cage.
- Focus moves to the step heading (`tabindex="-1"`, `<h1>`) on each transition, and the step change is announced via a polite live region.
- `--duration-slow` is never used here; the airport is not the place for leisurely transitions.

**Countdown** (`UJ-032`), in the shell header from step 2 onward:

| Property | Value |
|---|---|
| Text | `--text-sm`, tabular numerals, `--color-text-muted` |
| Source | Flight time minus the airline check-in requirement minus the user's buffer (`DR-032`) |
| Attention | `--color-attention` plus the word 剩下 / left only inside the final 30 minutes |
| Semantics | Updates once per minute into an `aria-live="off"` element; it is read on demand, never announced repeatedly |
| Absent | When the trip has no flight time, the slot is omitted entirely — no placeholder, no zero |

The countdown never blocks, never auto-advances, and never tells the user to give up. The out-of-time branch of S39 states the trade-off; the user decides.

---

## 10. Checklist row

The core of Airport Mode step 1 and the packing plan.

| Property | Value |
|---|---|
| Min height | 64 px |
| Checkbox | 24 px painted, 44x44 target, 2 px `--color-border-strong` border, `--radius-sm` |
| Checked | `--color-primary` fill, `--color-on-primary` check glyph |
| Content | Shop name `--text-lg`, then date + amount `--text-base` `--color-text-muted` |
| Pressed | Row background `--color-bg-sunken` |
| Excluded | Rows routed to the human counter are not rendered as checkboxes; they are a separate panel with a link |
| Warning | An optional third line, `--text-sm` `--color-attention` with a 16 px `circle-alert`, for a condition that applies to this row alone |

The whole row toggles the checkbox — a 24 px target in a queue with luggage is not acceptable. Semantics: a real `<input type="checkbox">` with a `<label>` wrapping the row, so the native accessible name, state, and keyboard behaviour come for free. Groups are `<fieldset>` with a `<legend>` naming the traveler.

**The warning line is not `secondary` text.** Two rows in the MVP carry one: a receipt still marked as checked luggage (`! 標記為託運` / "marked as checked") and a receipt whose goods may need their paperwork shown (`! 要帶證明文件` / "bring the documents"). Both appear in Airport Mode step 1 and in the packing plan, and both exist to make a traveler stop on that row rather than tick through it. Rendering them at `--color-text-muted` alongside the date and amount would remove exactly the emphasis they are for. The second marker is deliberately generic: `DR-016` is a certificate of authenticity (鑑定書) **or** a warranty (保證書), and which one applies depends on the goods — a watch usually has a warranty, a gemstone usually has an appraisal. A row has no space to disambiguate and a wrong specific word is worse than a right general one, so the row says "documents" and the packing plan and guide name the actual paper. The warning does not block the checkbox — the user may still have the goods — and it is included in the row's accessible name so it is not a visual-only cue.

Unchecking a confirmed receipt is allowed and reversible; nothing in Airport Mode is a one-way door except the explicit "customs is done" confirmation.

---

## 11. Form fields

### Shared anatomy

Label (`--text-sm`, `--color-text-muted`, above the field, always visible — never a placeholder as a label), required marker `*` with an explanation at the top of the form, control, then helper or error text.

| Property | Value |
|---|---|
| Height | 48 px |
| Background | `--color-bg-sunken` |
| Border | 1 px `--color-border-strong` (3.49:1 light, 4.64:1 dark — passes 1.4.11) |
| Radius | `--radius-md` |
| Text | `--text-base`, `--color-text` |
| Placeholder | `--color-text-muted` — never `--color-text-subtle` at body size |
| Focus | Border → `--color-primary`, plus the standard outline ring |
| Error | Border → `--color-attention`, message below with `circle-alert` 16 px, `--text-sm`, `--color-attention` |
| Disabled | `--color-bg-sunken`, `--color-text-subtle`, no border change |

Validation runs on blur and on submit, never per keystroke. The cursor is never moved for the user and input is never reformatted mid-typing. On a failed submit: focus the first invalid field, announce the count via `aria-live="polite"`, attach each message with `aria-describedby`, and mark the field `aria-invalid="true"`.

### Amount entry

- `<input type="text" inputmode="numeric" autocomplete="off">` — `type="number"` is rejected: it brings spinners, scroll-wheel mutation, and locale-dependent parsing.
- `¥` is a prefix adornment outside the editable area, `--color-text-muted`, `aria-hidden`; the field's accessible name includes the currency.
- Group separators are inserted on blur, not while typing.
- `--text-xl` and tabular numerals, because this is the number the user is checking against a paper receipt.
- Autofocus on screen open, with the numeric keypad raised. The primary button must remain reachable above the on-screen keyboard.
- A quiet toggle under the field switches to tax-included entry and shows the derived tax-excluded figure beneath, labelled as calculated (principle 7 — be honest about which number you have).

### Date

- Native `<input type="date">`: it is localised, accessible, and keyboard-operable for free, and it works offline.
- Default is today. A "今天 Today" chip sits beside the field to reset it in one tap.
- Below the field, the derived customs deadline is shown as read-only text: "海關期限 2027/02/02 · 90 天 / Customs deadline 2 Feb 2027". Derived values are never editable.

### Segmented control

Used for traveler (2–3 options), tax rate, and packing location.

| Property | Value |
|---|---|
| Container | `--color-bg-sunken`, `--radius-pill`, 2 px padding |
| Segment | Min 44 px tall, `--text-sm`, `--weight-medium` |
| Selected | `--color-surface` thumb, `--radius-pill`, `--color-primary` label, 1 px `--color-border-strong` outline. The outline is deliberately the strong border, not `--color-border`: the thumb fill against the sunken track is only 1.09:1, so the outline (3.49:1 light, 4.64:1 dark) is what makes the selected state identifiable under 1.4.11 |
| Unselected | `--color-text-muted` label |
| Thumb motion | `transform` over `--duration-fast`, `--ease-standard` |

Semantics: `role="radiogroup"` with `role="radio"` children, or a native radio `<fieldset>` styled as segments — the latter is preferred. Arrow keys move selection. Above 3 options, or when any English label would wrap, it becomes a select sheet instead. Labels are never truncated: "Checked luggage" is why the packing control is three stacked rows in the sheet rather than three segments on narrow screens.

**The tax rate control is data-driven (`DR-023`).** Its options come from the dated rate table resolved by the receipt's `purchaseDate`, never from a hard-coded pair. On 2026-11-01 that is two options; from 2027-04-01 the food option becomes 1 % with no code change. Each option is a rate plus a helper line — `10%` / 大部分商品 / "most goods" and `8%` / 食品、飲料（不含酒類） / "food and drink (not alcohol)". The abolished goods categories 一般物品 and 消耗品 must not appear in this control or anywhere else (`DR-013`); reusing them for rates is exactly the confusion the reform created.

### Select sheet

For operator (10 options), traveler (4+), and airport.

- Opens as a bottom sheet with a search field when there are more than 6 options.
- Options are radio rows, 56 px tall, with the selected one marked by both a filled radio and a check.
- Groups have headings ("常見 Common" / "其他 Others"); a sentinel option ("還不確定 Not sure yet") is pinned at the end with its own reassurance line.
- Confirmation is explicit via a *Done* button, so a mis-tap in a queue does not silently change a value.

---

## 12. Bottom sheet

| Property | Value |
|---|---|
| Background | `--color-surface-raised` |
| Radius | `--radius-lg` top corners only |
| Shadow | `--shadow-sheet` + 1 px `--color-border` top edge for dark theme |
| Scrim | `--color-overlay` |
| Max height | 88 % of viewport; content scrolls inside |
| Grabber | 36x4 px `--color-border-strong`, `--radius-pill`, centred, `aria-hidden` |
| Enter | Translate from 100 % to 0 over `--duration-normal`, `--ease-out`; scrim fades over `--duration-fast` |
| Exit | `--duration-slow`, `--ease-in` |

Behaviour: focus is trapped while open and restored to the trigger on close; `Escape`, scrim tap, swipe-down, and browser back all close it. `role="dialog" aria-modal="true"` with `aria-labelledby` pointing at the sheet heading. Background content gets `inert`. Sheet state lives in the URL as `?sheet=<id>` on the current route, so back closes the sheet rather than leaving the screen, and a screen only honours sheet ids it declares — an unknown one opens nothing.

---

## 13. Toast and banner

### Toast

Transient confirmation with an optional undo.

| Property | Value |
|---|---|
| Position | Above the bottom nav, `--space-5` inset, respecting `--safe-bottom` |
| Background | `--color-text` (inverted surface) |
| Text | `--color-bg`, `--text-sm` |
| Action | `--color-bg`, `--weight-medium`, underlined — 16.25:1 light, 15.62:1 dark. The accent colours are *not* usable here: `--color-primary` on `--color-text` is 1.95:1. Because the toast swaps `--color-text` and `--color-bg`, it inverts correctly in both themes with no extra tokens |
| Radius | `--radius-md` |
| Duration | 5 s, extended to 10 s when it carries an undo |
| Motion | Fade + 8 px rise, `--duration-normal` |

Semantics: `role="status"` with `aria-live="polite"`. A toast never carries the only path to an action — undo is a convenience, and the destructive action is also reversible from the detail screen. Toasts never stack; a new one replaces the current one.

### Banner

Persistent, in-flow, not dismissible by timeout.

| Variant | Background | Text | Border | Icon |
|---|---|---|---|---|
| Info | `--color-primary-soft` | `--color-text` | 1 px `--color-primary` left, 3 px | `info` |
| Attention | `--color-attention-soft` | `--color-text` | 3 px `--color-attention` left | `circle-alert` |
| Success | `--color-success-soft` | `--color-text` | 3 px `--color-success` left | `check-circle` |

Body copy is `--color-text` on the soft background (>= 12.8:1 in both themes) rather than the accent colour, so long passages stay comfortable; only a short heading uses the accent colour. Every attention banner carries a corrective action — a banner without a next step is a dead end. Attention banners are `role="alert"` when they appear in response to a user action, and plain content otherwise, so Airport Mode's persistent warning does not re-interrupt a screen reader on every step.

---

## 14. Empty state

| Property | Value |
|---|---|
| Layout | Centred in the content area, `--space-10` above |
| Mark | Frog mark or an outline icon, 48 px, `--color-text-subtle`, `aria-hidden` |
| Headline | `--text-lg`, `--weight-medium`, `--color-text` |
| Body | `--text-base`, `--color-text-muted`, max 3 lines |
| Action | One primary button |
| Secondary | One quiet link at most |

An empty state always explains *why* it is empty and what fills it, never just "No data". Compare: 還沒有收據 / No receipts yet, then 在日本買東西、拿到收據之後，回來記一筆 / After you buy something in Japan, log the receipt here. The three MVP empty states are the receipt list, the action-item list ("沒有待辦，很好 / Nothing needs you right now"), and the refund tracker.

---

## 15. Accessibility acceptance checklist

QA can run this against any screen.

| # | Check | Criterion |
|---|---|---|
| 1 | Every text/background pair meets 4.5:1 (3:1 for >= 24 px or bold >= 18.66 px) | 1.4.3 |
| 2 | Every control boundary and state indicator meets 3:1 | 1.4.11 |
| 3 | No information is conveyed by colour alone | 1.4.1 |
| 4 | Every interactive target is at least 44x44 px with 8 px spacing | 2.5.8 |
| 5 | Focus is visible on every focusable element, on every surface | 2.4.7, 2.4.13 |
| 6 | Tab order follows the visual order; no keyboard traps outside modals | 2.4.3, 2.1.2 |
| 7 | Every control has a programmatic name matching its visible label | 2.5.3, 4.1.2 |
| 8 | 200 % text scale loses no content or function; no horizontal scroll at 320 px | 1.4.4, 1.4.10 |
| 9 | `prefers-reduced-motion` removes all transitions and animations | 2.3.3 |
| 10 | Errors identify the field, describe the fix, and are announced | 3.3.1, 3.3.3 |
| 11 | `<html lang>` matches the active locale; Japanese fragments are marked `lang="ja"` | 3.1.1, 3.1.2 |
| 12 | Both locales render without truncation or overlap at 320 px and at 200 % scale | 1.4.10 |
| 13 | Screen title is an `<h1>`; heading levels do not skip | 1.3.1 |
| 14 | Dialogs trap focus, restore it on close, and are labelled | 4.1.2 |
| 15 | Destructive actions are reversible or confirmed | 3.3.4 |
