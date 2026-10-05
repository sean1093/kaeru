# Visual Language

| | |
|---|---|
| Status | v1.0 (M0) |
| Date | 2026-10-05 |
| Owner | UX designer |
| Tracking | Issue #3 |
| Hand-off | The `tokens.css` block at the end of this file is copied verbatim into `src/styles/tokens.css` (owned by the architect). |

The look is 和モダン — warm paper, ink-black text, one indigo accent, a lot of air. Nothing decorative earns its place; hierarchy comes from space and weight, not from boxes and shadows.

---

## 1. Palette

Colours are named after traditional Japanese colour names, then exposed to engineering only through semantic tokens. **Components never reference a palette name — only a semantic token.**

### Primitives

| Name | Reading | Hex | Role |
|---|---|---|---|
| kinari | 生成り | `#FAF7F2` | Unbleached paper. App canvas, light theme. |
| kinari-deep | 生成り（濃） | `#F2EDE4` | Sunken wells, input backgrounds. |
| shiro | 白 | `#FFFFFF` | Card and sheet surfaces. |
| sumi | 墨 | `#1C1A17` | Ink. Primary text. |
| usuzumi | 薄墨 | `#5C564C` | Thin ink. Secondary text. |
| nezumi | 鼠 | `#857D6F` | Mouse grey. Disabled text, control borders. |
| ai | 藍 | `#1B4D73` | Indigo. Primary action, links, selection. |
| kon | 紺 | `#143A57` | Dark indigo. Pressed primary. |
| ai-usu | 薄藍 | `#E7EEF4` | Soft indigo wash. |
| shu | 朱 | `#B23B22` | Vermilion. Attention only. |
| shu-usu | 薄朱 | `#FBEBE6` | Soft vermilion wash. |
| matcha | 抹茶 | `#3F6B3A` | Tea green. Success, done. |
| matcha-usu | 薄抹茶 | `#E9F1E6` | Soft green wash. |
| gofun | 胡粉 | `#E3DCD0` | Shell white. Hairline dividers. |

### Semantic tokens — light theme

| Token | Hex | Used for |
|---|---|---|
| `--color-bg` | `#FAF7F2` | App canvas |
| `--color-bg-sunken` | `#F2EDE4` | Input wells, inactive segments |
| `--color-surface` | `#FFFFFF` | Cards, list containers |
| `--color-surface-raised` | `#FFFFFF` | Bottom sheets, sticky app bar over content |
| `--color-text` | `#1C1A17` | Body and headings |
| `--color-text-muted` | `#5C564C` | Labels, helper text, timestamps |
| `--color-text-subtle` | `#857D6F` | Disabled text, placeholder at >= 24 px only |
| `--color-primary` | `#1B4D73` | Primary button fill, links, active nav |
| `--color-primary-hover` | `#143A57` | Pressed / hover primary |
| `--color-primary-soft` | `#E7EEF4` | Selected segment, info panel |
| `--color-text-on-primary` | `#FFFFFF` | Label on primary fill |
| `--color-attention` | `#B23B22` | Blocking airport state, deadline < 7 days, destructive |
| `--color-on-attention` | `#FFFFFF` | Label on attention fill |
| `--color-attention-soft` | `#FBEBE6` | Attention banner background |
| `--color-success` | `#3F6B3A` | Confirmed, registered, paid out |
| `--color-on-success` | `#FFFFFF` | Label on success fill |
| `--color-success-soft` | `#E9F1E6` | Success chip background |
| `--color-border` | `#E3DCD0` | Decorative hairlines between rows |
| `--color-border-strong` | `#857D6F` | Borders that identify a control (inputs, quiet buttons) |
| `--color-focus` | `#1B4D73` | Focus ring |
| `--color-overlay` | `rgba(28,26,23,0.48)` | Scrim behind sheets and dialogs |

### Semantic tokens — dark theme

Same roles, re-pointed. The dark theme is warm charcoal, not blue-black, and the accents are desaturated so they do not glow in a dark airport.

| Token | Hex |
|---|---|
| `--color-bg` | `#171513` |
| `--color-bg-sunken` | `#100F0E` |
| `--color-surface` | `#201E1B` |
| `--color-surface-raised` | `#2A2724` |
| `--color-text` | `#F2EDE4` |
| `--color-text-muted` | `#B9B1A4` |
| `--color-text-subtle` | `#948C7F` |
| `--color-primary` | `#8FC0E3` |
| `--color-primary-hover` | `#AFD4F0` |
| `--color-primary-soft` | `#1B2C38` |
| `--color-text-on-primary` | `#0D1A23` |
| `--color-attention` | `#F0957C` |
| `--color-on-attention` | `#2A0F08` |
| `--color-attention-soft` | `#39211A` |
| `--color-success` | `#9CC894` |
| `--color-on-success` | `#10200E` |
| `--color-success-soft` | `#1E2C1C` |
| `--color-border` | `#332F2A` |
| `--color-border-strong` | `#847C6E` |
| `--color-focus` | `#8FC0E3` |
| `--color-overlay` | `rgba(0,0,0,0.60)` |

### Dark mode decision

**Dark mode ships in the MVP.** Reasons: the two highest-stakes moments (hotel evening, 6 a.m. airport) happen in dim light; iOS and Android both expose a system preference that users expect to be honoured; and because every colour is already a semantic token, the cost is one extra block in `tokens.css` plus one setting.

Implementation: `@media (prefers-color-scheme: dark)` for the system default, plus `[data-theme="dark"]` / `[data-theme="light"]` on `<html>` so Settings can force a theme. `color-scheme: light dark` is set on `:root` so native form controls and scrollbars follow. Airport Mode does **not** force a theme — forcing light at 6 a.m. would be hostile.

### Contrast — light theme

All pairs computed with the WCAG 2.x relative-luminance formula. Body text requires >= 4.5:1; large text (>= 24 px, or >= 18.66 px bold) and non-text UI boundaries require >= 3:1.

| Foreground | Background | Use | Ratio | Required | Result |
|---|---|---|---|---|---|
| `--color-text` | `--color-bg` | Body text on canvas | 16.25:1 | 4.5:1 | PASS |
| `--color-text` | `--color-surface` | Body text on card | 17.36:1 | 4.5:1 | PASS |
| `--color-text` | `--color-bg-sunken` | Body text in input well | 14.89:1 | 4.5:1 | PASS |
| `--color-text` | `--color-surface-raised` | Body text on sheet | 17.36:1 | 4.5:1 | PASS |
| `--color-text-muted` | `--color-bg` | Secondary text on canvas | 6.80:1 | 4.5:1 | PASS |
| `--color-text-muted` | `--color-surface` | Secondary text on card | 7.27:1 | 4.5:1 | PASS |
| `--color-text-muted` | `--color-bg-sunken` | Helper text in well | 6.23:1 | 4.5:1 | PASS |
| `--color-text-subtle` | `--color-bg` | Disabled label (>= 24 px) | 3.81:1 | 3.0:1 | PASS |
| `--color-text-subtle` | `--color-surface` | Disabled label (>= 24 px) | 4.07:1 | 3.0:1 | PASS |
| `--color-primary` | `--color-bg` | Link / icon on canvas | 8.34:1 | 4.5:1 | PASS |
| `--color-primary` | `--color-surface` | Link / icon on card | 8.91:1 | 4.5:1 | PASS |
| `--color-primary` | `--color-bg-sunken` | Selected segment label | 7.64:1 | 4.5:1 | PASS |
| `--color-primary-hover` | `--color-bg` | Pressed link | 11.09:1 | 4.5:1 | PASS |
| `--color-text-on-primary` | `--color-primary` | Primary button label | 8.91:1 | 4.5:1 | PASS |
| `--color-text-on-primary` | `--color-primary-hover` | Pressed button label | 11.85:1 | 4.5:1 | PASS |
| `--color-primary` | `--color-primary-soft` | Text on soft primary chip | 7.61:1 | 4.5:1 | PASS |
| `--color-text` | `--color-primary-soft` | Body on info panel | 14.83:1 | 4.5:1 | PASS |
| `--color-attention` | `--color-bg` | Attention text on canvas | 5.55:1 | 4.5:1 | PASS |
| `--color-attention` | `--color-surface` | Attention text on card | 5.93:1 | 4.5:1 | PASS |
| `--color-on-attention` | `--color-attention` | Attention button / badge | 5.93:1 | 4.5:1 | PASS |
| `--color-attention` | `--color-attention-soft` | Text on attention banner | 5.12:1 | 4.5:1 | PASS |
| `--color-text` | `--color-attention-soft` | Body on attention banner | 14.99:1 | 4.5:1 | PASS |
| `--color-success` | `--color-bg` | Success text on canvas | 5.82:1 | 4.5:1 | PASS |
| `--color-success` | `--color-surface` | Success text on card | 6.22:1 | 4.5:1 | PASS |
| `--color-on-success` | `--color-success` | Success badge label | 6.22:1 | 4.5:1 | PASS |
| `--color-success` | `--color-success-soft` | Text on success chip | 5.39:1 | 4.5:1 | PASS |
| `--color-text` | `--color-success-soft` | Body on success panel | 15.04:1 | 4.5:1 | PASS |
| `--color-border-strong` | `--color-bg` | Input outline on canvas | 3.81:1 | 3.0:1 | PASS |
| `--color-border-strong` | `--color-surface` | Input outline on card | 4.07:1 | 3.0:1 | PASS |
| `--color-border-strong` | `--color-bg-sunken` | Outline in input well | 3.49:1 | 3.0:1 | PASS |
| `--color-focus` | `--color-bg` | Focus ring on canvas | 8.34:1 | 3.0:1 | PASS |
| `--color-focus` | `--color-surface` | Focus ring on card | 8.91:1 | 3.0:1 | PASS |

### Contrast — dark theme

| Foreground | Background | Use | Ratio | Required | Result |
|---|---|---|---|---|---|
| `--color-text` | `--color-bg` | Body text on canvas | 15.62:1 | 4.5:1 | PASS |
| `--color-text` | `--color-surface` | Body text on card | 14.26:1 | 4.5:1 | PASS |
| `--color-text` | `--color-bg-sunken` | Body text in input well | 16.42:1 | 4.5:1 | PASS |
| `--color-text` | `--color-surface-raised` | Body text on sheet | 12.74:1 | 4.5:1 | PASS |
| `--color-text-muted` | `--color-bg` | Secondary text on canvas | 8.57:1 | 4.5:1 | PASS |
| `--color-text-muted` | `--color-surface` | Secondary text on card | 7.83:1 | 4.5:1 | PASS |
| `--color-text-muted` | `--color-bg-sunken` | Helper text in well | 9.02:1 | 4.5:1 | PASS |
| `--color-text-subtle` | `--color-bg` | Disabled label (>= 24 px) | 5.48:1 | 3.0:1 | PASS |
| `--color-text-subtle` | `--color-surface` | Disabled label (>= 24 px) | 5.00:1 | 3.0:1 | PASS |
| `--color-primary` | `--color-bg` | Link / icon on canvas | 9.38:1 | 4.5:1 | PASS |
| `--color-primary` | `--color-surface` | Link / icon on card | 8.56:1 | 4.5:1 | PASS |
| `--color-primary` | `--color-bg-sunken` | Selected segment label | 9.86:1 | 4.5:1 | PASS |
| `--color-primary-hover` | `--color-bg` | Pressed link | 11.71:1 | 4.5:1 | PASS |
| `--color-text-on-primary` | `--color-primary` | Primary button label | 9.10:1 | 4.5:1 | PASS |
| `--color-text-on-primary` | `--color-primary-hover` | Pressed button label | 11.35:1 | 4.5:1 | PASS |
| `--color-primary` | `--color-primary-soft` | Text on soft primary chip | 7.39:1 | 4.5:1 | PASS |
| `--color-text` | `--color-primary-soft` | Body on info panel | 12.30:1 | 4.5:1 | PASS |
| `--color-attention` | `--color-bg` | Attention text on canvas | 8.06:1 | 4.5:1 | PASS |
| `--color-attention` | `--color-surface` | Attention text on card | 7.36:1 | 4.5:1 | PASS |
| `--color-on-attention` | `--color-attention` | Attention button / badge | 7.94:1 | 4.5:1 | PASS |
| `--color-attention` | `--color-attention-soft` | Text on attention banner | 6.61:1 | 4.5:1 | PASS |
| `--color-text` | `--color-attention-soft` | Body on attention banner | 12.81:1 | 4.5:1 | PASS |
| `--color-success` | `--color-bg` | Success text on canvas | 9.63:1 | 4.5:1 | PASS |
| `--color-success` | `--color-surface` | Success text on card | 8.79:1 | 4.5:1 | PASS |
| `--color-on-success` | `--color-success` | Success badge label | 8.99:1 | 4.5:1 | PASS |
| `--color-success` | `--color-success-soft` | Text on success chip | 7.75:1 | 4.5:1 | PASS |
| `--color-text` | `--color-success-soft` | Body on success panel | 12.57:1 | 4.5:1 | PASS |
| `--color-border-strong` | `--color-bg` | Input outline on canvas | 4.41:1 | 3.0:1 | PASS |
| `--color-border-strong` | `--color-surface` | Input outline on card | 4.03:1 | 3.0:1 | PASS |
| `--color-border-strong` | `--color-bg-sunken` | Outline in input well | 4.64:1 | 3.0:1 | PASS |
| `--color-focus` | `--color-bg` | Focus ring on canvas | 9.38:1 | 3.0:1 | PASS |
| `--color-focus` | `--color-surface` | Focus ring on card | 8.56:1 | 3.0:1 | PASS |

**Deliberately below 3:1:** `--color-border` on `--color-bg` (1.27:1 light, 1.37:1 dark). This is a decorative hairline between list rows. It never carries information and never bounds a control — those use `--color-border-strong`. WCAG 1.4.11 exempts purely decorative boundaries. Every list row is independently distinguishable by its text, and rows remain operable with the divider invisible.

**Verification:** these numbers are reproducible. QA should assert them in an automated test over the token values rather than trusting this table; see `docs/qa/` for the contrast-regression test.

---

## 2. Typography

### Font stacks

No webfonts. A CJK webfont is 4–10 MB, which is indefensible for an offline-first PWA on airport Wi-Fi, and every target OS ships an excellent Chinese and Japanese face.

| Token | Stack |
|---|---|
| `--font-sans` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Arial, sans-serif` |
| `--font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |
| `--font-numeric` | `var(--font-sans)` with `font-variant-numeric: tabular-nums` |

The resolved face per language:

| `lang` | iOS / macOS | Android | Windows |
|---|---|---|---|
| `zh-Hant` / `zh-TW` | PingFang TC | Noto Sans TC | Microsoft JhengHei |
| `ja` | Hiragino Sans | Noto Sans JP | Yu Gothic |
| `en` | SF Pro (system-ui) | Roboto | Segoe UI |

`<html lang>` is set from the active locale. Japanese proper nouns inside Chinese or English text are wrapped in `<span lang="ja">` so the Japanese face and Japanese glyph variants are used (`直`, `海`, `免` differ between TC and JP faces).

### Type scale

A 1.25-ish scale, rounded to even pixels. All sizes are declared in `rem` so browser text-size settings and 200 % zoom work; `--text-base` is 1rem = 16 px.

| Token | px | rem | Weight | Line height | Use |
|---|---|---|---|---|---|
| `--text-xs` | 12 | 0.75 | regular | `--leading-normal` | Legal note, timestamp. Minimum size in the product. |
| `--text-sm` | 14 | 0.875 | regular / medium | `--leading-normal` | Field labels, chips, helper text, nav labels. |
| `--text-base` | 16 | 1.0 | regular | `--leading-cjk` | Body, list row title, button label. |
| `--text-lg` | 20 | 1.25 | medium | `--leading-normal` | Card title, section heading, Airport Mode body. |
| `--text-xl` | 24 | 1.5 | medium | `--leading-tight` | Screen title, Airport Mode step heading. |
| `--text-2xl` | 30 | 1.875 | bold | `--leading-tight` | Secondary amounts. |
| `--text-3xl` | 38 | 2.375 | bold | `--leading-tight` | The hero number on Home: tax waiting to come back. |

### Line height and CJK

| Token | Value | Applies to |
|---|---|---|
| `--leading-tight` | 1.25 | Headings >= 24 px, numerals |
| `--leading-normal` | 1.5 | Latin body, labels, helper text |
| `--leading-cjk` | 1.75 | Body copy when `lang` is `zh-Hant` or `ja` |

Chinese and Japanese glyphs fill their em box, so Latin-tuned leading makes a paragraph look like a wall. `--leading-cjk: 1.75` is applied via `:lang(zh-Hant), :lang(ja) { line-height: var(--leading-cjk); }`. `--tracking-cjk: 0.02em` adds a hair of letter spacing for the same reason; Latin text gets `0`.

Additional CJK rules:
- `text-wrap: pretty` where supported; `word-break: normal` and `line-break: strict` for CJK so punctuation does not start a line.
- Never `text-transform: uppercase` — it is meaningless for CJK and shouty in English.
- Never justify. Ragged right only.
- `overflow-wrap: anywhere` on user-entered shop names, which may be long Japanese strings with no break opportunities.

### Numerals

Money is the product. Every amount uses `font-variant-numeric: tabular-nums` so digits align in a column and a total does not jitter as it updates.

- Format: `¥12,345` — `Intl.NumberFormat` with `currency: 'JPY'`, `maximumFractionDigits: 0`. Yen has no minor unit; never show `¥12,345.00`.
- The symbol is set one step smaller than the digits and in `--color-text-muted` when the number is a hero, so the eye lands on the digits.
- Estimated amounts carry a `~` prefix and the word 預估 / Estimated, never a bare number.
- Negative / deducted values (the operator fee) are shown as `− ¥550` with a true minus sign (U+2212), not a hyphen.

---

## 3. Spacing

A 4 px base with an 8 px rhythm. The two sub-4 steps exist only for hairline offsets and icon nudges.

| Token | px | Typical use |
|---|---|---|
| `--space-0` | 0 | Reset |
| `--space-1` | 2 | Focus ring offset, icon optical nudge |
| `--space-2` | 4 | Chip padding, gap inside a label+icon pair |
| `--space-3` | 8 | Gap between adjacent controls (minimum, for 44 px targets) |
| `--space-4` | 12 | List row vertical padding |
| `--space-5` | 16 | Screen horizontal gutter, card padding |
| `--space-6` | 20 | Gap between cards |
| `--space-7` | 24 | Section padding, sheet padding |
| `--space-8` | 32 | Gap between major sections |
| `--space-9` | 40 | Above a primary action |
| `--space-10` | 48 | Empty-state breathing room |
| `--space-11` | 64 | Top of a first-run screen |
| `--space-12` | 80 | Airport Mode vertical rhythm |

Screen gutter is `--space-5` (16 px). Content is capped at `--content-max: 480px` and centred, so the phone layout simply stops growing on a tablet or desktop rather than stretching into unreadable lines.

---

## 4. Radius, elevation, borders

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Chips, small badges, inline buttons |
| `--radius-md` | 10px | Buttons, input fields |
| `--radius-lg` | 16px | Cards, bottom sheets (top corners only) |
| `--radius-pill` | 999px | Status chips, segmented control thumb |
| `--radius-full` | 50% | Avatar initial, step dot |

**Hairline borders are the default way to separate things; shadows are the exception.** A 1 px `--color-border` line is quieter, renders identically in both themes, and costs nothing to paint. Only two shadows exist:

| Token | Value | Use |
|---|---|---|
| `--shadow-raised` | `0 1px 2px rgba(28,26,23,0.06)` | Sticky app bar once content scrolls under it |
| `--shadow-sheet` | `0 -8px 24px rgba(28,26,23,0.12)` | Bottom sheet and bottom nav, to lift them off the page |

In dark theme both shadows are near-invisible, so the same elements additionally get a `--color-border` top edge. Cards never have a shadow: a card is `--color-surface` on `--color-bg`, with `--radius-lg` and a 1 px `--color-border`.

---

## 5. Iconography

- **Style:** stroke only, 1.75 px at 24 px, round caps and joins, `currentColor`. No filled icons, no two-tone, no gradients.
- **Sizes:** 20 px inside list rows and chips, 24 px in the app bar and bottom nav, 32 px in empty states, 48 px in Airport Mode step headers.
- **Source:** [Lucide](https://lucide.dev) (ISC licence) as the base set, which matches the stroke style and is permissive enough for a public repo. Icons are inlined as SVG in the component that uses them — no sprite fetch, no icon font, no network request. Only the ~18 icons the MVP uses are included.
- **Starting set:** `receipt`, `plus`, `home`, `plane-takeoff`, `book-open`, `settings`, `check`, `check-circle`, `circle-alert`, `clock`, `luggage`, `backpack`, `scan-line`, `camera`, `chevron-right`, `chevron-left`, `x`, `wifi-off`, `download`, `trash-2`, `user`, `yen`.
- **Accessibility:** decorative icons get `aria-hidden="true"` and `focusable="false"`. An icon that is the only content of a control gets an `aria-label` on the control, never on the `<svg>`.
- **Never** use an icon alone to convey status. Pair it with a word (principle 2).
- **Custom:** two icons are drawn in-house because no library has them — the kiosk terminal and the "customs confirmed" seal. Both follow the same 24 px / 1.75 px grid.

---

## 6. Motion

Motion is used to explain where something came from, never to entertain. Nothing moves on the Home screen at rest.

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 80ms | Press feedback, chip toggle |
| `--duration-fast` | 120ms | Colour and opacity changes, focus ring |
| `--duration-normal` | 200ms | Bottom-sheet open, toast in, step transition |
| `--duration-slow` | 320ms | Bottom-sheet dismiss, full-screen push |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default for anything that moves and settles |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entering the screen |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving the screen |

Rules:
- Transform and opacity only. Never animate `width`, `height`, `top`, or `box-shadow`.
- Travel distance is small: a sheet rises from the bottom edge, a step slides 16 px, nothing flies across the screen.
- No spinners for local work. Local reads are instant; if something genuinely takes > 400 ms (image compression), show a determinate progress bar.
- No animated success checkmarks or confetti. Principle 2: the product is calm.

**Reduced motion.** `@media (prefers-reduced-motion: reduce)` sets every duration token to `1ms` and disables `transition`/`animation` globally via a reset. Because components only reference duration tokens, this is a single override — components need no conditional logic. Transitions that convey meaning (a sheet appearing) become instant state changes, which is the correct behaviour; nothing becomes unreachable.

---

## 7. Brand

**Wordmark:** `Kaeru` set in `--font-sans` at `--text-xl`, weight medium, `--tracking-cjk` letter spacing, in `--color-text`. Below it, optionally, `かえる` at `--text-xs` in `--color-text-muted`. The pun (返る / 帰る) is explained once in the guide, never on a screen the user passes through daily.

**Mark (optional, decorative):** a frog seen from above, reduced to three strokes — a rounded body arc and two eye dots — drawn on the same 24 px / 1.75 px grid as the icon set, in `--color-matcha` on `--color-bg`. It is used in exactly three places: the PWA app icon, the onboarding first screen, and the empty state of the receipt list. It never appears in the app bar, never animates, and is always `aria-hidden` with the accessible name carried by the adjacent text.

**App icon:** the mark in `--color-success` on `--color-bg`, with a generous safe area so iOS and Android masking does not clip it. Maskable icon provided at 512 px with a 20 % padding ring.

**Tone of voice:** warm, short, second person. "Your tax is waiting" not "Pending refund amount". In zh-TW: friendly written Taiwanese Mandarin (你的退稅還在路上), no mainland vocabulary, no 您 (too formal and distancing for a travel companion), no exclamation marks except in the one airport warning.

---

## 8. tokens.css

Copy verbatim into `src/styles/tokens.css`. No component may declare a raw hex, px, or duration outside this file.

```css
/* Kaeru design tokens — generated from docs/design/visual-language.md v1.0 (2026-10-05).
   Edit the design doc first, then mirror the change here. */

:root {
  color-scheme: light dark;

  /* ---- Color: light theme (kinari paper) ---- */
  --color-bg: #faf7f2;
  --color-bg-sunken: #f2ede4;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;

  --color-text: #1c1a17;
  --color-text-muted: #5c564c;
  --color-text-subtle: #857d6f;

  --color-primary: #1b4d73;
  --color-primary-hover: #143a57;
  --color-primary-soft: #e7eef4;
  --color-text-on-primary: #ffffff;

  --color-attention: #b23b22;
  --color-on-attention: #ffffff;
  --color-attention-soft: #fbebe6;

  --color-success: #3f6b3a;
  --color-on-success: #ffffff;
  --color-success-soft: #e9f1e6;

  --color-border: #e3dcd0;
  --color-border-strong: #857d6f;
  --color-focus: #1b4d73;
  --color-overlay: rgba(28, 26, 23, 0.48);

  /* ---- Spacing: 4 / 8 scale ---- */
  --space-0: 0;
  --space-1: 2px;
  --space-2: 4px;
  --space-3: 8px;
  --space-4: 12px;
  --space-5: 16px;
  --space-6: 20px;
  --space-7: 24px;
  --space-8: 32px;
  --space-9: 40px;
  --space-10: 48px;
  --space-11: 64px;
  --space-12: 80px;

  /* ---- Radius ---- */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 999px;
  --radius-full: 50%;

  /* ---- Elevation: hairline first, shadow only for lifted surfaces ---- */
  --shadow-raised: 0 1px 2px rgba(28, 26, 23, 0.06);
  --shadow-sheet: 0 -8px 24px rgba(28, 26, 23, 0.12);

  /* ---- Typography ---- */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
    "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Hiragino Sans",
    "Noto Sans JP", "Yu Gothic", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", monospace;
  --font-numeric: var(--font-sans);

  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.25rem;    /* 20px */
  --text-xl: 1.5rem;     /* 24px */
  --text-2xl: 1.875rem;  /* 30px */
  --text-3xl: 2.375rem;  /* 38px */

  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-cjk: 1.75;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;

  --tracking-cjk: 0.02em;

  /* ---- Motion ---- */
  --duration-instant: 80ms;
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 320ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);

  /* ---- Layout ---- */
  --tap-min: 44px;
  --content-max: 480px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* ---- Color: dark theme (warm charcoal) ---- */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #171513;
    --color-bg-sunken: #100f0e;
    --color-surface: #201e1b;
    --color-surface-raised: #2a2724;

    --color-text: #f2ede4;
    --color-text-muted: #b9b1a4;
    --color-text-subtle: #948c7f;

    --color-primary: #8fc0e3;
    --color-primary-hover: #afd4f0;
    --color-primary-soft: #1b2c38;
    --color-text-on-primary: #0d1a23;

    --color-attention: #f0957c;
    --color-on-attention: #2a0f08;
    --color-attention-soft: #39211a;

    --color-success: #9cc894;
    --color-on-success: #10200e;
    --color-success-soft: #1e2c1c;

    --color-border: #332f2a;
    --color-border-strong: #847c6e;
    --color-focus: #8fc0e3;
    --color-overlay: rgba(0, 0, 0, 0.6);
  }
}

/* Settings can force a theme regardless of the system preference. */
:root[data-theme="dark"] {
  --color-bg: #171513;
  --color-bg-sunken: #100f0e;
  --color-surface: #201e1b;
  --color-surface-raised: #2a2724;

  --color-text: #f2ede4;
  --color-text-muted: #b9b1a4;
  --color-text-subtle: #948c7f;

  --color-primary: #8fc0e3;
  --color-primary-hover: #afd4f0;
  --color-primary-soft: #1b2c38;
  --color-text-on-primary: #0d1a23;

  --color-attention: #f0957c;
  --color-on-attention: #2a0f08;
  --color-attention-soft: #39211a;

  --color-success: #9cc894;
  --color-on-success: #10200e;
  --color-success-soft: #1e2c1c;

  --color-border: #332f2a;
  --color-border-strong: #847c6e;
  --color-focus: #8fc0e3;
  --color-overlay: rgba(0, 0, 0, 0.6);
}

/* Reduced motion: one override, because components only reference duration tokens. */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 1ms;
    --duration-fast: 1ms;
    --duration-normal: 1ms;
    --duration-slow: 1ms;
  }

  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Base rules that belong next to the tokens

These are not tokens, but they are the global rules that make the tokens behave. They live in `src/styles/base.css`.

```css
html {
  font-family: var(--font-sans);
  font-size: 100%; /* respect the user's browser text size */
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-text-size-adjust: 100%;
}

:lang(zh-Hant),
:lang(zh-TW),
:lang(ja) {
  line-height: var(--leading-cjk);
  letter-spacing: var(--tracking-cjk);
  line-break: strict;
  word-break: normal;
}

:lang(en) {
  line-height: var(--leading-normal);
  letter-spacing: 0;
}

/* Money and any aligned figure. */
.numeric,
[data-numeric] {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

/* One focus ring everywhere, visible on every surface. */
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: var(--space-1);
  border-radius: var(--radius-sm);
}

/* Minimum target size (WCAG 2.2 AA 2.5.8). */
button,
a[role="button"],
input[type="checkbox"],
input[type="radio"],
summary {
  min-block-size: var(--tap-min);
  min-inline-size: var(--tap-min);
}
```
