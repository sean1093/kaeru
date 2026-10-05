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

/**
 * The receipt's tax-excluded total: what the ¥5,000 threshold is judged on (`DR-011`) and
 * the basis of a sale-based operator fee (`DR-026a`).
 */
export type TaxExcludedTotalOf = (receipt: Receipt) => Jpy;

export interface RefundEstimate {
  gross: Jpy;
  /** The operator's cut. Null when unknown; zero is a claim we are not entitled to make. */
  operatorFee: Jpy | null;
  /**
   * The traveler's own bank charge for an inbound transfer, from `Trip.receivingChargeJpy`.
   * Present only when it actually applies — that is, when the operator will pay by bank
   * transfer. Null when unknown or not applicable (`DR-025`).
   */
  receivingCharge: Jpy | null;
  /**
   * True when the receiving charge is part of the estimate. It is a fact once the
   * traveller has chosen a bank transfer, and an assumption before then — see
   * `refundMethodKnown`, which is the field a screen must read before wording it.
   */
  receivingChargeApplies: boolean;
  /**
   * Whether the payout route is known, i.e. the traveller has registered a destination.
   *
   * The deduction is assumed wherever the operator could send a transfer, because
   * assuming it away is the optimistic direction and the bank charge is the larger bite in
   * the evidence. But "your bank will take a cut" and "if you take this by bank transfer,
   * your bank will take a cut" are different sentences, and only this field separates them.
   */
  refundMethodKnown: boolean;
  /**
   * Gross minus everything known. Null when any deduction is unknown, because an honest
   * "fee unknown" beats a confident wrong number (`DR-025`, `DR-051`, `UJ-014`).
   *
   * Note what this is **not**: the receiving charge is levied once per transfer, not once
   * per receipt, so a per-receipt net assumes the worst case of a solo payout. That is the
   * safe direction. The true figure for a group is `EstimateOperatorPayout`.
   */
  net: Jpy | null;
  /**
   * True when `net` is below `rules.fee.warnBelowJpy` (DR-027, S2B).
   *
   * **Precedence:** this is the right warning only when no group is visible. Where the
   * receipt's operator is known and has other receipts on the trip, the screen must show
   * `PayoutEstimate.feeWarning` instead. A warning is not just a number — it invites the
   * user to stop claiming — and a pessimistic per-receipt figure would fire on small
   * receipts whose operator is in fact sending one transfer worth claiming. That either
   * trains the user to ignore the warning or talks them into abandoning a good refund,
   * which is the exact harm DR-027 exists to prevent.
   */
  feeWarning: boolean;
}

/**
 * Estimate what reaches the traveler for one receipt. An unknown deduction yields
 * `net: null` rather than an optimistic number.
 */
export type EstimateRefund = (
  receipt: Receipt,
  operator: Operator | null,
  registration: OperatorRegistration | null,
  trip: Trip,
  rules: ResolvedRules,
) => RefundEstimate;

/**
 * What one operator will actually pay out for a set of receipts. This is the honest view,
 * because the receiving-side charge is taken once per transfer, and it is also how the
 * refund tracker groups (S40, S41).
 */
export interface PayoutEstimate {
  operatorId: string | null;
  receiptIds: readonly string[];
  gross: Jpy;
  operatorFee: Jpy | null;
  /** Applied once for the whole payout, not once per receipt. */
  receivingCharge: Jpy | null;
  net: Jpy | null;
  /** Whether the payout route is known; see `RefundEstimate.refundMethodKnown`. */
  refundMethodKnown: boolean;
  feeWarning: boolean;
}

export type EstimateOperatorPayout = (
  receipts: readonly Receipt[],
  operator: Operator | null,
  registration: OperatorRegistration | null,
  trip: Trip,
  rules: ResolvedRules,
) => PayoutEstimate;

/**
 * Resolve `Receipt.hasHighValueItem`: the user's answer when they gave one, otherwise
 * derived from the dearest unit price on any line. A user-set value always wins (`DR-016`).
 */
export type HasHighValueItemOf = (receipt: Receipt, rules: ResolvedRules) => boolean;

// --- Threshold and eligibility (DR-010..DR-016, UR-01, UR-02) --------------

/** Receipts that share a shop, a purchase date and a traveler (DR-012). */
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

/**
 * Normalise a shop name into a grouping key: trim, collapse space, NFKC, case-fold
 * (`DR-012a`). Null when nothing usable is left, because an empty key is not a weak
 * identity — it is one that matches every other empty key and merges unrelated receipts.
 */
export type ShopKeyOf = (shopName: string) => string | null;

export type GroupByShopDay = (
  receipts: readonly Receipt[],
  rules: ResolvedRules,
) => readonly ShopDayGroup[];

// --- Dates and deadlines (DR-031, DR-032, DR-076) --------------------------

/** Last calendar day the goods may leave Japan: purchase + window, inclusive (DR-031). */
export type ExportDeadlineOf = (receipt: Receipt, rules: ResolvedRules) => CalendarDate;

/**
 * How a receipt's export deadline stands against the trip (`DR-031`, `DR-076`, `DR-076a`).
 *
 * `risk` is a union rather than a pair of booleans because the states must not be
 * confusable: a screen that handles `missed` and forgets `no_margin` looks like complete
 * code and silently says nothing in the case that still has a remedy. A `switch` that
 * misses a member is a type error.
 */
export type DeadlineRisk =
  /** Old-system receipt: there is no customs step and so no deadline to have (`DR-003`). */
  | 'not_applicable'
  /** A deadline exists and there is room: it falls comfortably after the departure date. */
  | 'none'
  /** `0 <= slackDays <= slackWarnDays`. Not lost — but no room if the plan moves (`DR-076a`). */
  | 'no_margin'
  /** The deadline falls before departure: the goods would have to leave first (`DR-076`). */
  | 'missed';

export interface DeadlineStatus {
  deadline: CalendarDate;
  daysRemaining: number;
  /**
   * Calendar days between the deadline and the departure date; negative when the deadline
   * comes first. The copy needs the figure, not just the band: "your deadline is your
   * departure day" is `0` and "two days after you leave" is `2`.
   */
  slackDays: number;
  risk: DeadlineRisk;
  /** The deadline has passed **today**, which is a different axis from `risk`. */
  expired: boolean;
}

export type DeadlineStatusOf = (
  receipt: Receipt,
  trip: Trip,
  rules: ResolvedRules,
  clock: Clock,
) => DeadlineStatus;

/**
 * Flight time minus the airline cut-off minus the user's buffer (`DR-032`, `UJ-022`).
 *
 * `dayOffset` is `-1` when the subtraction crosses midnight — a 01:00 flight means leaving
 * at 23:00 **the night before**, and only this function knows that. A bare "23:00" on a
 * departure-day screen is twenty-two hours late.
 */
export type LeaveForAirportBy = (
  trip: Trip,
) => { time: string; dayOffset: 0 | -1; explained: true } | null;

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

/** A receipt the traveler is still trying to get money back for. */
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

/**
 * Which home state the user gets. The app knows the departure date, so it never asks.
 *
 * One member per state in the IA's phase table: S11 no trip, S12 before, S17 the day
 * before departure when the packing plan becomes the hero, S13 departure day, S14 after.
 * There is no `during`: S10 "Home — during trip" is the **body every phase renders into**,
 * not a sixth phase, and `Trip` holds only a departure date, so nothing could tell
 * "not left home yet" from "in Japan shopping" anyway.
 */
export type TripPhase = 'no_trip' | 'before' | 'last_day' | 'departure_day' | 'after';

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
