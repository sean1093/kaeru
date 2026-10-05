/**
 * Resolving the rules document for one purchase date.
 *
 * The engine never reads `RulesData` directly: it asks for the rules in force on a
 * receipt's `purchaseDate` and gets a flat `ResolvedRules`. That is the whole mechanism by
 * which a rule change stays a data change — nothing downstream knows that a rate has a
 * date at all.
 *
 * Purchase dates are JST calendar dates (`DR-002`, `UR-07`). A device in Taipei at 23:30
 * on 2026-10-31 is already in 2026-11-01 in Japan, and the purchase it logs is a
 * refund-system purchase. Resolution therefore happens on a calendar date that was
 * computed in `Asia/Tokyo`, never on a device-local one.
 */
import type { Clock } from './clock.ts';
import { type CalendarDate, daysBetween, JAPAN_TIME_ZONE, today } from './dates.ts';
import type {
  Dated,
  ResolveDated,
  ResolvedRules,
  ResolveRules,
  ResolveSystem,
  RulesData,
} from './rules.ts';
import { kaeruRules } from './rules-data.ts';

/**
 * A dated series has no row covering the requested date.
 *
 * Loud on purpose: the alternative is resolving to a neighbouring row, which would price a
 * purchase at a rate that was not in force on the day it was made.
 */
export class RulesGapError extends Error {
  readonly code = 'rules.gap';
  readonly on: CalendarDate;

  constructor(on: CalendarDate, series: readonly Dated<unknown>[]) {
    const covered = series
      .map((row) => `${row.effectiveFrom}..${row.effectiveTo ?? 'open'}`)
      .join(', ');
    super(`No rule in force on ${on}. Covered ranges: ${covered || 'none'}`);
    this.name = 'RulesGapError';
    this.on = on;
  }
}

/**
 * The row in force on `on`, with both bounds inclusive: a rate that takes effect on
 * 2027-04-01 applies to a purchase made that day (`TC-DOM-042`). `YYYY-MM-DD` strings
 * compare correctly with `<=`, which keeps this free of date arithmetic.
 */
export const resolveDated: ResolveDated = <T>(
  series: readonly Dated<T>[],
  on: CalendarDate,
): Dated<T> => {
  for (const row of series) {
    if (row.effectiveFrom <= on && (row.effectiveTo === null || on <= row.effectiveTo)) {
      return row;
    }
  }
  throw new RulesGapError(on, series);
};

export const resolveRules: ResolveRules = (rules: RulesData, on: CalendarDate): ResolvedRules => {
  const rates = resolveDated(rules.rates, on);
  const threshold = resolveDated(rules.threshold, on);
  const deadline = resolveDated(rules.deadline, on);
  const highValue = resolveDated(rules.highValue, on);
  const fee = resolveDated(rules.fee, on);

  return {
    on,
    system: rules.system,
    rates: rates.value,
    threshold: threshold.value,
    deadline: deadline.value,
    highValue: highValue.value,
    fee: fee.value,
    // `pending-legislation` and `unconfirmed` rows are the ones the UI has to caveat.
    provisional: [rates, threshold, deadline, highValue, fee].some(
      (row) => row.status === 'pending-legislation' || row.status === 'unconfirmed',
    ),
  };
};

/**
 * Which system governs a purchase made on `on` (`DR-001`, `DR-002`).
 *
 * There is no transitional period and no trip-level flag: the answer depends on the
 * purchase date alone, so changing a departure date or logging a receipt a week late can
 * never move a receipt between systems (`TC-DOM-005`).
 */
export const resolveSystem: ResolveSystem = (
  rules: RulesData,
  on: CalendarDate,
): 'old' | 'refund' => (on < rules.system.refundSystemStart ? 'old' : 'refund');

export type SystemPhase = 'before' | 'active';

export interface SystemStatus {
  phase: SystemPhase;
  /** The date the refund system starts, so callers never restate it. */
  start: CalendarDate;
  /** Calendar days until that date; 0 on the day itself, negative once it is live. */
  daysUntilStart: number;
}

/**
 * Where today sits relative to the start of the refund system, in Japan time.
 *
 * Expressed over the rules document rather than a module constant, so the launch date is
 * the same datum the receipt engine resolves against.
 */
export function systemStatus(
  clock: Clock,
  rules: RulesData = kaeruRules,
  timeZone: string = JAPAN_TIME_ZONE,
): SystemStatus {
  const start = rules.system.refundSystemStart;
  const now = today(clock, timeZone);
  return {
    phase: resolveSystem(rules, now) === 'refund' ? 'active' : 'before',
    start,
    daysUntilStart: daysBetween(now, start),
  };
}

/**
 * Calendar days since the rules document was last reviewed, in Japan time (`TC-DOM-052`).
 *
 * Returns the age rather than a verdict: the staleness policy is
 * `RULES_REVIEW_MAX_AGE_DAYS`, applied by the weekly workflow, and a pure function that
 * takes a clock is the only version of this that can be tested at all.
 */
export function rulesReviewAgeDays(
  clock: Clock,
  rules: RulesData = kaeruRules,
  timeZone: string = JAPAN_TIME_ZONE,
): number {
  return daysBetween(rules.lastReviewed, today(clock, timeZone));
}
