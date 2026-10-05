/**
 * Prop contracts for the shared UI kit.
 *
 * Contract module: types only. Implemented by M1-3 against `docs/design/components.md`.
 *
 * Two rules the types enforce on purpose:
 * - Components take **already translated strings**, never message keys. The UI kit has no
 *   opinion about i18n, which keeps it testable and keeps copy with the feature that owns it.
 * - Components take no colour, size or spacing values. Everything resolves to a design
 *   token inside the component (`docs/design/visual-language.md` section 8).
 */
import type { ButtonHTMLAttributes, ComponentChildren, VNode } from 'preact';
import type { Jpy, PackingLocation, ReceiptStatus } from '../domain/model.ts';

export type Icon = () => VNode;

// --- 1. App bar ------------------------------------------------------------

export interface AppBarProps {
  /** Rendered as the screen's `<h1>`; wraps to two lines, then clips. */
  title: string;
  /** Flat by default; raised once the content under it has scrolled. */
  elevated?: boolean;
  /** `back` renders a chevron, `close` renders an x for modal and full-screen flows. */
  leading?: { kind: 'back' | 'close'; label: string; onActivate: () => void };
  /** At most one; anything more belongs in an overflow menu. */
  action?: { icon: Icon; label: string; onActivate: () => void };
}

// --- 2. Bottom navigation --------------------------------------------------

export interface BottomNavItem {
  id: string;
  href: string;
  label: string;
  icon: Icon;
  active: boolean;
  /**
   * A dot has no number and adds nothing to the accessible name. A count's
   * `accessibleName` is concatenated directly after `label` with no separator the kit
   * owns — the fragment must carry its own leading connector, already correct for the
   * caller's locale: `，3 項待處理` (zh-TW) or `, 3 need action` (en), composing to `收據，3
   * 項待處理` / `Receipts, 3 need action`. Because there is no separator slot, the visible
   * label is structurally always a prefix of the spoken name (WCAG 2.5.3, Label in
   * Name) — the kit cannot put the badge first even by accident.
   */
  badge?: { kind: 'dot' } | { kind: 'count'; value: number; accessibleName: string };
}

export interface BottomNavProps {
  label: string;
  items: readonly BottomNavItem[];
}

// --- 3. Button -------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';

/** Default 48 px, `airport` 56 px for gloved, hurried taps, `inline` 40 px for quiet links. */
export type ButtonSize = 'default' | 'airport' | 'inline';

export interface ButtonContractProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /**
   * Renders `aria-disabled`, never the native `disabled` attribute: the control stays
   * focusable so a screen-reader user can reach the reason beside it. Save on Add Receipt
   * is never disabled at all (DR-080).
   */
  inactive?: boolean;
}

// --- 4. Card ---------------------------------------------------------------

interface CardBaseProps {
  title?: string;
  headingLevel?: 2 | 3;
  children?: ComponentChildren;
}

/**
 * A card with a single destination is the whole tap target: `href` makes it a link,
 * `onActivate` makes it a button, neither makes it a plain section. A card with more than
 * one action is never itself tappable, so the two are mutually exclusive rather than
 * merely discouraged — a component that silently prefers one when both are passed hides
 * the mistake instead of reporting it.
 */
export type CardContractProps =
  | (CardBaseProps & { href?: undefined; onActivate?: undefined })
  | (CardBaseProps & { href: string; onActivate?: undefined })
  | (CardBaseProps & { href?: undefined; onActivate: () => void });

// --- 5. List row -----------------------------------------------------------

interface ListRowBaseProps {
  primary: string;
  secondary?: string;
  status?: StatusChipProps;
  amount?: AmountDisplayProps;
  /** Multi-select in the packing plan. */
  selected?: boolean;
  /** Last row in a group omits its divider. */
  last?: boolean;
}

/**
 * The row is a single announce unit, so at most one of `href` and `onActivate` exists: a
 * row with two ways to activate it is two targets wearing one outline. A row with neither
 * is a display row — not focusable, no chevron, nothing to press.
 */
export type ListRowProps =
  | (ListRowBaseProps & { href?: undefined; onActivate?: undefined })
  | (ListRowBaseProps & { href: string; onActivate?: undefined })
  | (ListRowBaseProps & { href?: undefined; onActivate: () => void });

// --- 6. Status chip --------------------------------------------------------

/** The closed DR-060 set, plus the two advisory chips the lists use. */
export type ChipStatus = ReceiptStatus | 'needs_action' | 'operator_unknown';

export interface StatusChipProps {
  status: ChipStatus;
  /** Already translated. Colour never carries the meaning on its own. */
  label: string;
}

// --- 7. Amount display -----------------------------------------------------

/**
 * The three money kinds are told apart by form, never by colour (IA section 6, decision 3):
 * `actual` is plain, `estimate` carries a `~` prefix, `received` carries a derived fee line.
 */
export type AmountKind = 'actual' | 'estimate' | 'received';

export interface AmountDisplayProps {
  kind: AmountKind;
  value: Jpy;
  /** Already translated, e.g. 消費稅 / Consumption tax. */
  label: string;
  size?: 'hero' | 'large' | 'body' | 'small';
  /** `received` only: the implied fee, rendered with a true minus sign. */
  fee?: { value: Jpy; label: string };
  /**
   * Reads naturally for a screen reader, e.g. "Estimated net, 24,860 yen". The `~` is
   * never announced; the word "estimated" carries that meaning.
   */
  accessibleName: string;
}

// --- 8. Progress -----------------------------------------------------------

export interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  /** The numeric form ("3/5") is required; the bar alone is decorative. */
  valueText: string;
  complete?: boolean;
}

export interface StepIndicatorProps {
  current: number;
  total: number;
  /** The accessible source of truth, single-locale, e.g. zh-TW "步驟 2/5" or en "Step 2 of 5"; the dots are hidden. */
  text: string;
}

// --- 9. Stepper (Airport Mode shell) ---------------------------------------

export interface CountdownProps {
  /** Already formatted, tabular. Omit the whole component when there is no flight time. */
  text: string;
  /** Inside the final 30 minutes the shell raises the tone. */
  urgent?: boolean;
  accessibleName: string;
}

export interface StepperProps {
  step: StepIndicatorProps;
  title: string;
  countdown?: CountdownProps;
  onClose: () => void;
  closeLabel: string;
  /**
   * Stays enabled even when the step is not satisfied. `onAdvance` returns the first
   * unresolved row and how many remain; the stepper scrolls there, moves focus and
   * announces the count — friction, never a cage (IA flow F). A disabled button in a
   * queue is a dead end.
   *
   * `blockedBy` is a free-form DOM identifier: the stepper finds the row with
   * `[data-row-id]` and scrolls to it, and the ids are whatever the feature gave its own
   * rows (`ChecklistRowProps.id`). It is deliberately not a closed union — it names an
   * element on screen, not a state anything switches on.
   *
   * `blockedAnnouncement` is a formatter rather than a string because the kit never
   * assembles a sentence: the count is pluralised and counted differently in the two
   * languages, and the feature already holds the bound locale. A plain string cannot work
   * — the caller does not know the count until `onAdvance` has run.
   */
  primary: {
    label: string;
    onAdvance: () => { blockedBy: string; count: number } | null;
    blockedAnnouncement: (count: number) => string;
  };
  secondary?: { label: string; onActivate: () => void };
  /** Rendered by the shell, not by a step, and cleared only at step 4 (UJ-026, UJ-031). */
  banner?: BannerProps;
  children?: ComponentChildren;
}

// --- 10. Checklist row -----------------------------------------------------

export interface ChecklistRowProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  primary: string;
  secondary?: string;
  /** Rows routed to a human counter render as a linked panel, not a checkbox (DR-035). */
  excluded?: { reason: string; href: string };
  /**
   * Per-row marker the traveler has to act on before ticking: 標記為託運 / "marked as
   * checked" (DR-032), or 要帶證明文件 / "bring the documents" for a high-value receipt
   * (DR-016, UJ-020).
   *
   * The second marker is deliberately generic. `DR-016` is a certificate of authenticity
   * (鑑定書) **or** a warranty (保證書) depending on the goods — a watch has a warranty, a
   * gemstone has an appraisal — and naming the wrong one sends someone who just spent
   * ¥1,280,000 hunting for the wrong paper, at which point they stop looking. The specific
   * words belong on S17 and the S21 prompt, which are read sitting at a table.
   */
  warning?: { tone: 'attention' | 'info'; text: string };
}

export interface ChecklistGroupProps {
  /** Becomes the `<legend>`, so the traveler's name is part of every row's name. */
  legend: string;
  progress: ProgressBarProps;
  children?: ComponentChildren;
}

// --- 11. Form fields -------------------------------------------------------

export interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  /** Validation runs on blur and on submit, never per keystroke. */
  error?: string;
  children?: ComponentChildren;
}

export interface AmountEntryProps {
  id: string;
  label: string;
  /** Integer yen. `null` renders an empty field rather than a zero. */
  value: Jpy | null;
  onChange: (value: Jpy | null) => void;
  /** Separators are inserted on blur so the caret never jumps mid-typing. */
  onBlur?: () => void;
  autoFocus?: boolean;
  error?: string;
  /** The tax-included toggle's derived figure, always labelled as calculated (DR-022). */
  derivedHint?: string;
}

export interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "Today" reset chip. */
  todayLabel: string;
  /** Read-only derived deadline shown beneath; never editable (DR-031). */
  deadlineHint?: string;
  error?: string;
}

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  /**
   * Second line under the label. Load-bearing on the tax rate control, where "8% food and
   * drink, not alcohol" is the part that decides whether a bottle of whisky is entered at
   * the right rate.
   */
  helper?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  legend: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export interface SelectSheetOption {
  value: string;
  label: string;
  secondary?: string;
  /** Sticky option such as "not sure yet", pinned below the groups. */
  sentinel?: boolean;
  group?: string;
}

export interface SelectSheetProps {
  title: string;
  options: readonly SelectSheetOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Shown above six options. */
  searchLabel?: string;
  doneLabel: string;
  onClose: () => void;
}

// --- 12. Bottom sheet ------------------------------------------------------

export interface BottomSheetProps {
  /** Labels the dialog; the sheet renders it as its heading. */
  title: string;
  open: boolean;
  /** Escape, scrim tap, swipe down and browser back all route here. */
  onClose: () => void;
  children?: ComponentChildren;
}

// --- 13. Toast and banner --------------------------------------------------

export interface ToastProps {
  message: string;
  /** Undo is a convenience; the action it undoes is always reversible elsewhere. */
  action?: { label: string; onActivate: () => void };
  /** 5 s, or 10 s with an action. Toasts never stack; a new one replaces the current one. */
  durationMs?: number;
  onDismiss: () => void;
}

export interface BannerProps {
  tone: 'info' | 'attention' | 'success';
  /** Short, accent-coloured. The body stays `--color-text`. */
  heading?: string;
  body: string;
  /** Every attention banner carries a way out of the situation it describes. */
  action?: { label: string; onActivate: () => void; href?: string };
  /**
   * `alert` interrupts a screen reader and is only correct when the user just did
   * something. A persistent shell banner uses `none` so it does not re-announce on every
   * Airport Mode step.
   */
  live?: 'alert' | 'status' | 'none';
}

// --- 14. Empty state -------------------------------------------------------

export interface EmptyStateProps {
  /** Decorative; always `aria-hidden`. */
  mark?: Icon;
  headline: string;
  /** Says why it is empty and what will fill it. Never just "No data". */
  body: string;
  action?: { label: string; href?: string; onActivate?: () => void };
  secondary?: { label: string; href: string };
}

export type { PackingLocation };
