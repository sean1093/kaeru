/**
 * Validation findings (`DR-070`–`DR-080`).
 *
 * **`DR-080` governs everything here: Kaeru never blocks a user from doing something the
 * law permits.** Validation informs; the user decides. `block` is reserved for data the app
 * genuinely cannot work with, and there are four such rules — a line with no amount, an
 * amount that is not whole non-negative yen, a pair of amounts that contradict each other,
 * and a rate that did not exist on the purchase date. Each is Kaeru declining to invent a
 * number, not Kaeru preventing a purchase.
 *
 * Everything else is `warn` or `inform`, including the two that look most like blocks: a
 * shop/day group under the threshold is advice (`DR-075`), and a high-value receipt without
 * its documents is a reminder (`DR-078`).
 *
 * Findings carry message keys rather than copy, and the feature that renders them owns the
 * bundle (`overview.md` section 5).
 */
import type {
  ValidatePurchaseDate,
  ValidateReceipt,
  ValidationFinding,
  ValidationSeverity,
} from './api.ts';
import type { Clock } from './clock.ts';
import { JAPAN_TIME_ZONE, today } from './dates.ts';
import { deadlineStatusOf } from './deadlines.ts';
import type { Receipt, Trip } from './model.ts';
import { hasHighValueItemOf, taxExcludedTotalOf } from './money.ts';
import { tripPhaseOf } from './phase.ts';
import { resolveDated } from './resolve-rules.ts';
import type { ResolvedRules, RulesData } from './rules.ts';
import { isClaimable, isOldSystem } from './status.ts';

function finding(
  rule: string,
  severity: ValidationSeverity,
  messageKey: string,
  extra: Partial<ValidationFinding> = {},
): ValidationFinding {
  return { rule, severity, messageKey, ...extra };
}

export const validatePurchaseDate: ValidatePurchaseDate = (purchaseDate, rules: RulesData) => {
  try {
    resolveDated(rules.rates, purchaseDate);
    return null;
  } catch {
    // The rules document cannot price a purchase made that day, so no tax figure, no
    // threshold and no deadline exist for it. Blocking is declining to invent them.
    return finding('DR-072', 'block', 'validation.purchaseDateOutsideRules', {
      field: 'purchaseDate',
      values: { purchaseDate },
    });
  }
};

/** Amounts a screen may not save at all (`DR-070`, `DR-070a`, `DR-071`, `DR-072`). */
function amountFindings(receipt: Receipt, rules: ResolvedRules): ValidationFinding[] {
  const found: ValidationFinding[] = [];
  const rates = rules.rates.map((option) => option.rate);

  receipt.lines.forEach((line, index) => {
    const { taxExcludedAmount: excluded, taxIncludedAmount: included } = line;

    if (excluded === null && included === null) {
      found.push(
        finding('DR-070', 'block', 'validation.lineNeedsAnAmount', {
          field: `lines.${index}.taxExcludedAmount`,
        }),
      );
    }

    for (const [name, amount] of [
      ['taxExcludedAmount', excluded],
      ['taxIncludedAmount', included],
      ['maxUnitPriceTaxExcluded', line.maxUnitPriceTaxExcluded],
    ] as const) {
      if (amount !== null && (!Number.isInteger(amount) || amount < 0)) {
        // The yen has no minor unit. A fractional amount is not a rounding question, it is
        // a number that cannot exist on a receipt.
        found.push(
          finding('DR-071', 'block', 'validation.amountMustBeWholeYen', {
            field: `lines.${index}.${name}`,
            values: { amount },
          }),
        );
      }
    }

    // DR-070a: the two amounts are the same subtotal with and without tax, so the
    // tax-included figure cannot be the smaller one. Equality is allowed, and deliberately:
    // a per-rate subtotal small enough carries zero tax under Japanese rounding — under
    // ¥10 at 10%, under ¥13 at 8%, under ¥100 at the 1% rate — and refusing those would
    // reject a correct receipt.
    if (excluded !== null && included !== null && included < excluded) {
      found.push(
        finding('DR-070a', 'block', 'validation.amountsContradict', {
          field: `lines.${index}.taxIncludedAmount`,
          values: { taxExcluded: excluded, taxIncluded: included },
        }),
      );
    }

    if (!rates.includes(line.taxRate)) {
      // DR-072: a rate that was not in force on the purchase date cannot produce a tax
      // figure. A 1% line dated before 2027-04-01 is the case this exists for.
      found.push(
        finding('DR-072', 'block', 'validation.rateNotInTable', {
          field: `lines.${index}.taxRate`,
          values: { taxRate: line.taxRate, on: receipt.purchaseDate },
        }),
      );
    }
  });

  return found;
}

export const validateReceipt: ValidateReceipt = (receipt, trip, rules, clock: Clock) => {
  const found: ValidationFinding[] = amountFindings(receipt, rules);

  const todayInJapan = today(clock, JAPAN_TIME_ZONE);
  if (receipt.purchaseDate > todayInJapan) {
    // DR-073: warn, never block. Dates get mistyped and timezones confuse people, and a
    // receipt the user cannot save is worse than one dated a day out.
    found.push(
      finding('DR-073', 'warn', 'validation.purchaseDateInFuture', {
        field: 'purchaseDate',
        values: { purchaseDate: receipt.purchaseDate, today: todayInJapan },
      }),
    );
  }

  // DR-075: the threshold indicator is advice and never blocks. This is the per-receipt
  // figure; the shop/day aggregate is `groupByShopDay`, which the list owns.
  const taxExcluded = taxExcludedTotalOf(receipt);
  if (taxExcluded < rules.threshold.minTaxExcludedJpy) {
    found.push(
      finding('DR-075', 'inform', 'validation.belowThreshold', {
        values: {
          shortfall: rules.threshold.minTaxExcludedJpy - taxExcluded,
          minimum: rules.threshold.minTaxExcludedJpy,
        },
      }),
    );
  }

  if (trip !== null) {
    found.push(...tripFindings(receipt, trip, rules, clock));
  }

  return found;
};

/** Findings that only exist in the context of a trip (`DR-074`, `DR-076`–`DR-078`). */
function tripFindings(
  receipt: Receipt,
  trip: Trip,
  rules: ResolvedRules,
  clock: Clock,
): ValidationFinding[] {
  const found: ValidationFinding[] = [];

  if (receipt.purchaseDate > trip.departureDate) {
    // DR-074: contradictory, but dates get changed and the user may be fixing the trip
    // next. Warn, allow.
    found.push(
      finding('DR-074', 'warn', 'validation.purchaseDateAfterDeparture', {
        field: 'purchaseDate',
        values: { purchaseDate: receipt.purchaseDate, departureDate: trip.departureDate },
      }),
    );
  }

  // An old-system receipt has no customs step, so none of what follows applies to it
  // (DR-003, DR-064). Warning that its goods are in a checked bag would be advice about a
  // procedure it will never go through.
  if (isOldSystem(receipt, rules) || !isClaimable(receipt, rules)) return found;

  const deadline = deadlineStatusOf(receipt, trip, rules, clock);
  if (deadline.risk === 'missed') {
    found.push(
      finding('DR-076', 'warn', 'validation.deadlineBeforeDeparture', {
        values: { deadline: deadline.deadline, departureDate: trip.departureDate },
      }),
    );
  } else if (deadline.risk === 'no_margin') {
    // DR-076a. A different message key, not merely a lower severity: "you have lost this
    // one" and "your deadline is your departure day" are different things to tell someone,
    // and the whole point of the split is that they must not look the same.
    found.push(
      finding('DR-076a', 'warn', 'validation.deadlineNoMargin', {
        values: { deadline: deadline.deadline, slackDays: deadline.slackDays },
      }),
    );
  }

  const phase = tripPhaseOf(trip, clock);
  const atTheEnd = phase === 'departure_day' || phase === 'last_day';
  if (!atTheEnd) return found;

  if (receipt.packingLocation === 'checked_bag') {
    // DR-077, DR-032: checked baggage cannot be retrieved for a tax-free procedure. This
    // is the mistake that costs real money, and it is unrecoverable once the bag is gone.
    found.push(
      finding('DR-077', 'warn', 'validation.goodsInCheckedBag', { field: 'packingLocation' }),
    );
  } else if (receipt.packingLocation === 'unknown') {
    // Treated as at risk rather than as safe: not knowing where the goods are is not
    // evidence that they are in hand.
    found.push(
      finding('DR-077', 'warn', 'validation.goodsLocationUnknown', { field: 'packingLocation' }),
    );
  }

  if (hasHighValueItemOf(receipt, rules)) {
    // DR-078, UJ-020: customs may ask for a certificate or warranty, and they are in the
    // box in the suitcase. Raised the night before so there is time to move them.
    found.push(finding('DR-078', 'warn', 'validation.documentsNeeded'));
  }

  return found;
}
