/**
 * Rules as effective-dated data.
 *
 * Contract module: types only. Implemented by M1-1.
 *
 * Nothing in `src/domain` may contain a rate, threshold, window or money constant inside
 * a conditional. Every such value is a dated row resolved by a receipt's `purchaseDate`,
 * because the rules are still moving: the consumption tax rate on food and drink is
 * scheduled to fall from 8% to 1% for 2027-04-01..2029-03-31 (DR-023, UR-08, pending
 * legislation), and whether the old or the new refund system applies is decided by the
 * purchase date with no transitional period (DR-001, DR-002).
 *
 * Changing a rule is therefore a data change plus a review, never a code change.
 */
import type { CalendarDate } from './dates.ts';
import type { Jpy, SourceStatus, TaxRate } from './model.ts';

/** A value that is in force between two calendar dates. `effectiveTo: null` means open-ended. */
export interface Dated<T> {
  effectiveFrom: CalendarDate;
  effectiveTo: CalendarDate | null;
  value: T;
  status: SourceStatus | 'pending-legislation';
  /** Short label of where this came from; the guide carries the full citation. */
  source: string;
}

/** A selectable consumption tax rate, with the copy key that explains what it covers. */
export interface TaxRateOption {
  rate: TaxRate;
  /** Message key in the content layer, e.g. `rates.mostGoods`. Never raw copy. */
  labelKey: string;
}

export interface ThresholdRule {
  /** Tax-excluded total at or above which a shop/day group qualifies (DR-010, DR-011). */
  minTaxExcludedJpy: Jpy;
}

export interface DeadlineRule {
  /** Calendar days from the day after purchase to the last valid export day (DR-031). */
  exportWindowDays: number;
}

export interface HighValueRule {
  /** Tax-excluded unit price at or above which documents may be requested (DR-016). */
  unitPriceJpy: Jpy;
}

export interface FeeRule {
  /**
   * Warn when the estimated net refund falls below this, not merely when it goes
   * negative: a 30 yen refund is as bad as none (DR-027). Default 2000.
   */
  warnBelowJpy: Jpy;
}

export interface SystemRule {
  /** First purchase date governed by the refund-at-departure system (DR-001). */
  refundSystemStart: CalendarDate;
}

/**
 * The shipped rules document. One object, versioned and dated, reviewed by the travel
 * expert. `lastReviewed` is checked by a weekly workflow, never by a test (QA R19).
 */
export interface RulesData {
  version: number;
  lastReviewed: CalendarDate;
  system: SystemRule;
  rates: readonly Dated<readonly TaxRateOption[]>[];
  threshold: readonly Dated<ThresholdRule>[];
  deadline: readonly Dated<DeadlineRule>[];
  highValue: readonly Dated<HighValueRule>[];
  fee: readonly Dated<FeeRule>[];
}

/** The rules in force on a given purchase date: the only shape the engine consumes. */
export interface ResolvedRules {
  on: CalendarDate;
  rates: readonly TaxRateOption[];
  threshold: ThresholdRule;
  deadline: DeadlineRule;
  highValue: HighValueRule;
  fee: FeeRule;
  /** True when any resolved row is `pending-legislation` or `unconfirmed`; the UI must caveat. */
  provisional: boolean;
}

/** Pick the row in force on `on`. Throws when a dated series has a gap covering that date. */
export type ResolveDated = <T>(series: readonly Dated<T>[], on: CalendarDate) => Dated<T>;

export type ResolveRules = (rules: RulesData, on: CalendarDate) => ResolvedRules;

/** Which refund system governs a purchase made on `on` (DR-001, DR-002, DR-003). */
export type ResolveSystem = (rules: RulesData, on: CalendarDate) => 'old' | 'refund';
