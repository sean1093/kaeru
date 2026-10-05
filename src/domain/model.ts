/**
 * The Kaeru domain model.
 *
 * Contract module: types only, no runtime values beyond closed string-union constant
 * lists. Implemented and extended by M1-1 (`docs/architecture/implementation-plan.md`);
 * every other slice imports from here and does not edit it without architect review.
 *
 * Source of truth: `docs/product/domain-rules.md` section 1 (entities), section 6
 * (status lifecycle) and section 8 (operator catalogue). Field names match that document
 * exactly so a rule ID can be traced to a field without a glossary.
 */
import type { CalendarDate } from './dates.ts';

export type Id = string;
export type TripId = Id;
export type TravelerId = Id;
export type ReceiptId = Id;
export type OperatorId = Id;
export type PhotoId = Id;

/** `HH:mm` in the departure airport's local time. */
export type LocalTime = string;

/** IATA code of a Japanese airport, e.g. `NRT`. */
export type AirportCode = string;

/** Integer yen. The yen has no minor unit and Kaeru never uses floats for money (DR-071). */
export type Jpy = number;

/** A tax rate as a decimal, e.g. `0.1`. Valid values come from the rate table (DR-023). */
export type TaxRate = number;

// --- Trip and travellers ---------------------------------------------------

export interface Trip {
  id: TripId;
  /** JST calendar date the traveller leaves Japan. */
  departureDate: CalendarDate;
  /** The **final** airport they leave Japan from (DR-037). */
  departureAirport: AirportCode;
  /** Local departure time; drives the countdown (DR-032). Absent when unknown. */
  flightTime?: LocalTime;
  /** Airline bag-drop cut-off before departure, in minutes. Default 60 (DR-032). */
  checkInMinutes: number;
  /** The user's own safety margin, in minutes. Default 60 (UR-03, DR-032). */
  airportBufferMinutes: number;
  /** Days after customs confirmation before a refund is "late" — a preference, not a fact (DR-036). */
  overdueThresholdDays: number;
  /** An archived trip stays readable and is still exported (IA flow G). */
  archived: boolean;
}

export interface Traveler {
  id: TravelerId;
  tripId: TripId;
  /** User-chosen label, not a legal name. */
  displayName: string;
  /**
   * At most the **last 4 characters** of a passport number, for disambiguation only.
   * A full passport number must never exist in any entity or survive an import (DR-041).
   */
  passportRef?: string;
}

// --- Receipts --------------------------------------------------------------

/** The lifecycle of DR-060. Every state is user-asserted (DR-062) and reversible (DR-063). */
export type ReceiptStatus =
  | 'logged'
  | 'registered'
  | 'customs_confirmed'
  | 'refund_pending'
  | 'refunded'
  | 'rejected'
  | 'refund_disputed'
  | 'not_claiming';

export type PackingLocation = 'with_me' | 'checked_bag' | 'unknown';

export type NotClaimingReason =
  | 'consumed'
  | 'missing'
  | 'fee_not_worth_it'
  | 'old_system'
  | 'other';

/**
 * One line per tax rate present on the receipt (DR-020).
 * At least one of the two amounts must be present (DR-070).
 */
export interface ReceiptLine {
  taxRate: TaxRate;
  /** Line total excluding tax. Authoritative for the threshold (DR-011). */
  taxExcludedAmount: Jpy | null;
  /** Line total including tax. */
  taxIncludedAmount: Jpy | null;
  /** Tax-excluded unit price of the dearest single item on this line; null when unknown. */
  maxUnitPriceTaxExcluded: Jpy | null;
  /** True when one amount was computed from the other, which makes it an estimate (DR-022). */
  amountsAreDerived: boolean;
}

/**
 * The aggregate root: one Receipt models one purchase transaction, because that is the
 * unit customs confirms, all or nothing (DR-030). Partial confirmation does not exist.
 */
export interface Receipt {
  id: ReceiptId;
  tripId: TripId;
  /** The eligible purchaser whose passport the purchase is under (DR-004). */
  travelerId: TravelerId;
  /** Free text, exactly as the user typed it. */
  shopName: string;
  /** Normalised grouping identity derived from `shopName`; best-effort, never authoritative (DR-012a). */
  shopKey: string;
  /** JST calendar date of the purchase; decides which system applies (DR-002). */
  purchaseDate: CalendarDate;
  lines: readonly ReceiptLine[];
  /** Null means "not sure", which is a valid state that may persist forever (DR-050). */
  operatorId: OperatorId | null;
  status: ReceiptStatus;
  packingLocation: PackingLocation;
  /** Past-tense fact, asked on the last day or at the airport (UJ-018). Null until asked. */
  allItemsPresent: boolean | null;
  /** Future intent, asked at logging time (UJ-008). Null until asked. */
  willUseInJapan: boolean | null;
  /** Derived from `maxUnitPriceTaxExcluded >= 1_000_000`; a user-set value always wins (DR-016). */
  hasHighValueItem: boolean;
  /** What actually arrived (UJ-034). */
  amountReceived: Jpy | null;
  notClaimingReason: NotClaimingReason | null;
  /** Key into the photo store; the blob never leaves the device (DR-042). */
  photoRef?: PhotoId;
  /** When the user asserted the current status, for the detail screen's attribution (DR-062). */
  statusChangedAt: string;
}

/**
 * Registration is a property of the operator, not of a receipt: one registration covers
 * every receipt handled by that operator on that trip (UJ-013, DR-050).
 */
export interface OperatorRegistration {
  tripId: TripId;
  operatorId: OperatorId;
  /** ISO 8601 instant the user said they had registered; null means not registered. */
  registeredAt: string | null;
}

// --- Operators -------------------------------------------------------------

export type RegistrationMethod = 'receipt_qr' | 'app' | 'web' | 'counter' | 'pos_terminal';

export type RefundMethod =
  | 'credit_card'
  | 'bank_transfer'
  | 'qr_payment'
  | 'cash'
  | 'paypal'
  | 'points';

/** How well sourced a piece of shipped data is; the UI must not present these as equal. */
export type SourceStatus = 'confirmed-official' | 'reported-media' | 'unconfirmed';

/**
 * Shipped catalogue data (DR-050..DR-053). `feeNote: null` means **unknown** and must be
 * rendered as unknown, never as zero (DR-051).
 */
export interface Operator {
  id: OperatorId;
  name: { ja: string; en: string; 'zh-TW': string };
  url: string;
  registrationMethod: readonly RegistrationMethod[];
  refundMethods: readonly RefundMethod[];
  feeNote: { en: string; 'zh-TW': string } | null;
  /** ISO date the fee was observed; fee data is volatile and must be shown dated (DR-026). */
  feeSourceDate: CalendarDate | null;
  status: SourceStatus;
}
