/**
 * Tax arithmetic and refund estimation.
 *
 * Three rules shape every line here:
 *
 * - **Integer yen only** (`DR-071`). Rates are converted to basis points and every
 *   division is an integer division, because `Math.ceil(2000 * 0.1)` is 201.
 * - **Per rate, never blended** (`DR-020`). A drugstore basket of 8% food and 10%
 *   cosmetics is the normal case, and one blended rate over the total is wrong for it.
 * - **Round so the figure understates what reaches the traveller** (`DR-024`). That means
 *   floor on an amount paid to the user and ceil on an amount deducted from them. "Floor
 *   everywhere" is the wrong reading: flooring a deduction inflates the net.
 *
 * And one principle: an unknown deduction yields `null`, never zero (`DR-025`, `DR-051`).
 * Eight of the ten shipped operators publish no fee at all, so `net: null` is the normal
 * answer rather than an edge case, and a confident full refund would be a lie.
 */
import type {
  EstimateOperatorPayout,
  EstimateRefund,
  GrossRefundOf,
  HasHighValueItemOf,
  LineAmounts,
  LineAmountsOf,
  PayoutEstimate,
  RefundEstimate,
  TaxExcludedTotalOf,
  TaxOfLine,
} from './api.ts';
import type {
  Jpy,
  Operator,
  OperatorFee,
  OperatorRegistration,
  RefundMethod,
  Trip,
} from './model.ts';
import type { ResolvedRules } from './rules.ts';

/** Basis-point scale: a rate and a fee are both integers out of this, so no float divides. */
const BASIS_POINTS = 10_000;

export const lineAmountsOf: LineAmountsOf = (line): LineAmounts => {
  const rate = Math.round(line.taxRate * BASIS_POINTS);
  const excluded = line.taxExcludedAmount;
  const included = line.taxIncludedAmount;

  // Both sides present: the receipt's own figures win over anything we could compute
  // (DR-022). Whether they are estimates is the form's answer, not ours.
  if (excluded !== null && included !== null) {
    return {
      taxExcluded: excluded,
      taxIncluded: included,
      tax: included - excluded,
      derived: line.amountsAreDerived,
    };
  }

  if (included !== null) {
    // DR-021: taxExcluded = taxIncluded * 100 / (100 + ratePercent), floored (DR-024).
    const taxExcluded = Math.floor((included * BASIS_POINTS) / (BASIS_POINTS + rate));
    return { taxExcluded, taxIncluded: included, tax: included - taxExcluded, derived: true };
  }

  if (excluded !== null) {
    const tax = Math.floor((excluded * rate) / BASIS_POINTS);
    return { taxExcluded: excluded, taxIncluded: excluded + tax, tax, derived: true };
  }

  // Neither amount: DR-070 blocks saving such a line, and zero is the only honest figure
  // for a line that carries no number. Never throw — an imported receipt must still render.
  return { taxExcluded: 0, taxIncluded: 0, tax: 0, derived: true };
};

export const taxOfLine: TaxOfLine = (line) => lineAmountsOf(line).tax;

/**
 * The gross refund: the sum of per-line tax, before anybody takes a fee (`DR-025`).
 *
 * This is never what arrives, and no screen may present it as if it were.
 */
export const grossRefundOf: GrossRefundOf = (receipt) =>
  receipt.lines.reduce((total, line) => total + lineAmountsOf(line).tax, 0);

/** The figure the ¥5,000 threshold is judged on, and the basis of a sale-based fee (`DR-011`). */
export const taxExcludedTotalOf: TaxExcludedTotalOf = (receipt) =>
  receipt.lines.reduce((total, line) => total + lineAmountsOf(line).taxExcluded, 0);

export const hasHighValueItemOf: HasHighValueItemOf = (receipt, rules) => {
  // The user's answer always wins: a ¥1,280,000 line could be two ¥640,000 items and only
  // they know, so a recompute must never discard the override (DR-016).
  if (receipt.hasHighValueItem !== null) return receipt.hasHighValueItem;
  return receipt.lines.some(
    (line) =>
      line.maxUnitPriceTaxExcluded !== null &&
      line.maxUnitPriceTaxExcluded >= rules.highValue.unitPriceJpy,
  );
};

/**
 * The fee schedule that applies to this payout, or null when we have none (`DR-051`).
 *
 * A traveller's own correction wins outright — it is an observation of what their payout
 * actually cost. Otherwise the route decides: Ocean charges differently for PayPal and for
 * a card, so where the route is not yet chosen and every shipped schedule is route-specific
 * the honest answer is that we do not know.
 */
function feeScheduleFor(
  operator: Operator | null,
  registration: OperatorRegistration | null,
  method: RefundMethod | null,
): OperatorFee | null {
  if (registration?.feeOverride) return registration.feeOverride;
  const schedules = operator?.fees ?? [];
  const forRoute = method === null ? undefined : schedules.find((fee) => fee.method === method);
  return forRoute ?? schedules.find((fee) => fee.method === null) ?? null;
}

/** What the operator keeps, rounded up so the estimate never overstates the net (`DR-024`). */
function feeAmount(fee: OperatorFee, gross: Jpy, purchaseTaxExcluded: Jpy): Jpy {
  const rated = fee.rate
    ? Math.ceil(
        ((fee.rate.basis === 'refund' ? gross : purchaseTaxExcluded) * fee.rate.basisPoints) /
          BASIS_POINTS,
      )
    : 0;
  const total = fee.fixedJpy + rated;
  return fee.minimumJpy === null ? total : Math.max(total, fee.minimumJpy);
}

/**
 * Whether the traveller's bank will take its cut of this payout (`DR-025`).
 *
 * Once the route is chosen the answer is a fact. Before then we assume a transfer wherever
 * the operator can send one: the charge is the larger bite in the evidence (PP-03, a
 * ¥19,805 purchase that arrived as NT$77) and assuming it away is the optimistic direction.
 */
function receivingChargeApplies(
  operator: Operator | null,
  registration: OperatorRegistration | null,
): boolean {
  const method = registration?.refundMethod ?? null;
  if (method !== null) return method === 'bank_transfer';
  return operator === null || operator.refundMethods.includes('bank_transfer');
}

function estimate(
  gross: Jpy,
  purchaseTaxExcluded: Jpy,
  operator: Operator | null,
  registration: OperatorRegistration | null,
  trip: Trip,
  rules: ResolvedRules,
): Omit<PayoutEstimate, 'operatorId' | 'receiptIds'> {
  const schedule = feeScheduleFor(operator, registration, registration?.refundMethod ?? null);
  const operatorFee = schedule === null ? null : feeAmount(schedule, gross, purchaseTaxExcluded);

  const chargeApplies = receivingChargeApplies(operator, registration);
  const receivingCharge = chargeApplies ? trip.receivingChargeJpy : null;

  // Any unknown deduction makes the net unknown. An "estimate" that silently omits a
  // deduction is not an estimate, it is a wrong number with a hedge word in front of it.
  const net =
    operatorFee === null || (chargeApplies && receivingCharge === null)
      ? null
      : gross - operatorFee - (receivingCharge ?? 0);

  return {
    gross,
    operatorFee,
    receivingCharge,
    net,
    feeWarning: net !== null && net < rules.fee.warnBelowJpy,
  };
}

/**
 * What one receipt is worth to the traveller, assuming the worst case of a solo payout.
 *
 * Worst case because the receiving charge is levied once per transfer, not once per
 * receipt. Where the operator has other receipts on the trip, the honest figure — and the
 * one a fee warning should be read from — is `estimateOperatorPayout`.
 */
export const estimateRefund: EstimateRefund = (
  receipt,
  operator,
  registration,
  trip,
  rules,
): RefundEstimate => {
  const gross = grossRefundOf(receipt);
  const { operatorFee, receivingCharge, net, feeWarning } = estimate(
    gross,
    taxExcludedTotalOf(receipt),
    operator,
    registration,
    trip,
    rules,
  );
  return {
    gross,
    operatorFee,
    receivingCharge,
    receivingChargeApplies: receivingChargeApplies(operator, registration),
    net,
    feeWarning,
  };
};

/**
 * What one operator will actually pay out for a set of receipts: one transfer, so one
 * receiving charge and one flat fee, however many receipts it covers.
 */
export const estimateOperatorPayout: EstimateOperatorPayout = (
  receipts,
  operator,
  registration,
  trip,
  rules,
): PayoutEstimate => {
  const gross = receipts.reduce((total, receipt) => total + grossRefundOf(receipt), 0);
  const taxExcluded = receipts.reduce((total, receipt) => total + taxExcludedTotalOf(receipt), 0);
  return {
    operatorId: operator?.id ?? null,
    receiptIds: receipts.map((receipt) => receipt.id),
    ...estimate(gross, taxExcluded, operator, registration, trip, rules),
  };
};
