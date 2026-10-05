/**
 * The public surface of the domain engine, as function types.
 *
 * Contract module: types only. M1-1 implements each of these as
 * `export const name: TypeName = (…) => …`, so a signature change is a change to this
 * file and shows up in review rather than hiding in an implementation.
 *
 * Every function here is pure: no `new Date()`, no storage, no `Intl` defaults. Anything
 * that needs the current time takes a `Clock`; anything that needs a calendar takes an
 * explicit time zone.
 */
import type { Clock } from './clock.ts';
import type { CalendarDate } from './dates.ts';
import type {
  Jpy,
  Operator,
  OperatorRegistration,
  PackingLocation,
  Receipt,
  ReceiptLine,
  ReceiptStatus,
  TaxRate,
  Traveler,
  TravelerId,
  Trip,
} from './model.ts';
import type { ResolvedRules } from './rules.ts';

// --- Money (DR-020..DR-027) ------------------------------------------------

/** The two amounts of a line plus the tax between them, all integer yen. */
export interface LineAmounts {
  taxExcluded: Jpy;
  taxIncluded: Jpy;
  tax: Jpy;
  /** True when the input only carried one side, so the others are estimates (DR-022). */
  derived: boolean;
}

/**
 * Complete a line's amounts: `taxExcluded = taxIncluded * 100 / (100 + rate)` (DR-021),
 * rounded down to the yen per line before any sum (DR-024).
 */
export type LineAmountsOf = (line: ReceiptLine) => LineAmounts;

/** Tax on one line at one rate. Never a blended rate applied to a mixed-rate total. */
export type TaxOfLine = (line: ReceiptLine) => Jpy;

/** Sum of per-line tax. This is the gross refund before anybody takes a fee (DR-025). */
export type GrossRefundOf = (receipt: Receipt) => Jpy;

export interface RefundEstimate {
  gross: Jpy;
  /** Null when the operator's fee is unknown — show the gross and say so (DR-025, DR-051). */
  net: Jpy | null;
  /** Null when unknown; zero is a claim we are not entitled to make. */
  fee: Jpy | null;
  /** True when `net` is below `rules.fee.warnBelowJpy` and the warning must show (DR-027, S2B). */
  feeWarning: boolean;
}

/**
 * Estimate what reaches the traveller. An unknown fee yields `net: null`, because an
 * honest "fee unknown" beats a confident wrong number (UJ-014).
 */
export type EstimateRefund = (
  receipt: Receipt,
  operator: Operator | null,
  rules: ResolvedRules,
) => RefundEstimate;

// --- Threshold and eligibility (DR-010..DR-016, UR-01, UR-02) --------------

/** Receipts that share a shop, a purchase date and a traveller (DR-012). */
export interface ShopDayGroup {
  shopKey: string;
  purchaseDate: CalendarDate;
  travelerId: TravelerId;
  receipts: readonly Receipt[];
  taxExcludedTotal: Jpy;
  /** At or above the threshold (DR-010). Advisory only: the shop decides (UR-02, DR-080). */
  meetsThreshold: boolean;
  /** Yen still needed to reach the threshold; 0 once met. Drives the inline hint (UJ-007). */
  shortfall: Jpy;
}

/** Normalise a shop name into a grouping key: trim, collapse space, NFKC, case-fold (DR-012a). */
export type ShopKeyOf = (shopName: string) => string;

export type GroupByShopDay = (
  receipts: readonly Receipt[],
  rules: ResolvedRules,
) => readonly ShopDayGroup[];

// --- Dates and deadlines (DR-031, DR-032, DR-076) --------------------------

/** Last calendar day the goods may leave Japan: purchase + window, inclusive (DR-031). */
export type ExportDeadlineOf = (receipt: Receipt, rules: ResolvedRules) => CalendarDate;

export interface DeadlineStatus {
  deadline: CalendarDate;
  daysRemaining: number;
  /** The deadline falls on or before the departure date, so it is actually at risk (DR-076). */
  atRisk: boolean;
  expired: boolean;
}

export type DeadlineStatusOf = (
  receipt: Receipt,
  trip: Trip,
  rules: ResolvedRules,
  clock: Clock,
) => DeadlineStatus;

/** Flight time minus the airline cut-off minus the user's buffer (DR-032, UJ-022). */
export type LeaveForAirportBy = (trip: Trip) => { time: string; explained: true } | null;

// --- Status lifecycle (DR-060..DR-064) -------------------------------------

/**
 * Whether a transition is allowed. Every state is reversible (DR-063); the only hard
 * block is entering `customs_confirmed` with `allItemsPresent === false` (DR-061).
 */
export type CanTransition = (
  receipt: Receipt,
  to: ReceiptStatus,
) => { allowed: true } | { allowed: false; reasonKey: string };

/** Old-system receipts skip customs entirely and never appear in a checklist (DR-003, DR-064). */
export type IsOldSystem = (receipt: Receipt, rules: ResolvedRules) => boolean;

/** A receipt the traveller is still trying to get money back for. */
export type IsClaimable = (receipt: Receipt, rules: ResolvedRules) => boolean;

/** The operator's registration state, which every receipt of that operator shares (UJ-013). */
export type RegistrationStateOf = (
  receipt: Receipt,
  registrations: readonly OperatorRegistration[],
) => 'not_applicable' | 'not_registered' | 'registered';

// --- Airport readiness (DR-030..DR-035, DR-077..DR-079, UJ-023..UJ-032) ----

export interface TravelerChecklist {
  travelerId: TravelerId;
  receipts: readonly Receipt[];
  taxExcludedTotal: Jpy;
  /** Receipts needing the human counter rather than the kiosk (DR-035, S36). */
  routedToCounter: readonly Receipt[];
  /** Receipts whose goods are in a checked bag, which is the mistake that costs money (DR-032). */
  inCheckedBag: readonly Receipt[];
  requiresDocuments: boolean;
}

export interface AirportReadiness {
  travelers: readonly TravelerChecklist[];
  claimableCount: number;
  notClaimingCount: number;
  /** Message keys for everything standing between the user and a clean kiosk run. */
  blockerKeys: readonly string[];
  /** Nothing to do, which must be said plainly rather than shown as an empty list (DR-079). */
  nothingToDo: boolean;
}

export type AirportReadinessOf = (
  trip: Trip,
  travelers: readonly Traveler[],
  receipts: readonly Receipt[],
  rules: ResolvedRules,
  clock: Clock,
) => AirportReadiness;

// --- Validation (DR-070..DR-080) -------------------------------------------

/**
 * Validation informs; it never blocks what the law permits (DR-080). `block` is reserved
 * for data the app cannot store at all; everything else is `warn` or `inform`.
 */
export type ValidationSeverity = 'block' | 'warn' | 'inform';

export interface ValidationFinding {
  /** The rule this came from, e.g. `DR-076`, so a message can cite the guide. */
  rule: string;
  severity: ValidationSeverity;
  /** Message key in the feature's own bundle. Never raw copy. */
  messageKey: string;
  /** Field path for focus management on a failed submit, e.g. `lines.0.taxExcludedAmount`. */
  field?: string;
  values?: Readonly<Record<string, string | number>>;
}

export type ValidateReceipt = (
  receipt: Receipt,
  trip: Trip | null,
  rules: ResolvedRules,
  clock: Clock,
) => readonly ValidationFinding[];

// --- Trip phase (IA flow D) ------------------------------------------------

/** Which home screen the user gets. The app knows the departure date, so it never asks. */
export type TripPhase = 'no_trip' | 'before' | 'during' | 'last_day' | 'departure_day' | 'after';

export type TripPhaseOf = (trip: Trip | null, clock: Clock) => TripPhase;

// --- Aggregates for the dashboard and the trip summary (UJ-016, UJ-036) ----

export interface TripTotals {
  receiptCount: number;
  spendTaxIncluded: Jpy;
  taxPaid: Jpy;
  estimatedNet: Jpy;
  /** True when at least one operator fee is unknown, so the estimate is incomplete. */
  estimateIncomplete: boolean;
  received: Jpy;
  awaiting: Jpy;
  notRefunded: Jpy;
  operatorCount: number;
}

export type TripTotalsOf = (
  receipts: readonly Receipt[],
  operators: readonly Operator[],
  rules: ResolvedRules,
) => TripTotals;

/** Everything the packing plan and the tonight list rank by: cost of ignoring it (UJ-011). */
export interface ActionItem {
  kind:
    | 'operator_unknown'
    | 'operator_not_registered'
    | 'packing_unknown'
    | 'packing_checked_bag'
    | 'deadline_at_risk'
    | 'documents_needed'
    | 'photo_missing';
  receiptIds: readonly string[];
  operatorId: string | null;
  /** Lower sorts first. Derived from the money and the time at stake, never from entry order. */
  weight: number;
}

export type ActionItemsOf = (
  trip: Trip,
  receipts: readonly Receipt[],
  registrations: readonly OperatorRegistration[],
  rules: ResolvedRules,
  clock: Clock,
) => readonly ActionItem[];

export type { PackingLocation, TaxRate };
