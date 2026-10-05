/**
 * Trip totals (`UJ-016`, `UJ-036`).
 *
 * The figures are **segmented, never blended**: tax paid, expected, received and lost are
 * different facts about different receipts, and one number that mixes them answers no
 * question a traveller actually has (`TC-DOM-051`).
 *
 * `estimatedNet` is the sum of `estimateOperatorPayout` over the operator groups rather
 * than a second calculation of the same quantity. The receiving charge is levied once per
 * transfer, so summing per-receipt nets would charge it once per receipt — and more
 * importantly, two ways to compute what a traveller is owed is how the home screen and the
 * refund tracker end up disagreeing.
 */
import type { TripTotals, TripTotalsOf } from './api.ts';
import type { Jpy, OperatorId, Receipt } from './model.ts';
import { estimateOperatorPayout, lineAmountsOf } from './money.ts';
import { isClaimable, isOldSystem } from './status.ts';

const sumOf = (receipts: readonly Receipt[], of: (receipt: Receipt) => Jpy): Jpy =>
  receipts.reduce((total, receipt) => total + of(receipt), 0);

const taxOf = (receipt: Receipt): Jpy =>
  receipt.lines.reduce((total, line) => total + lineAmountsOf(line).tax, 0);

const spendOf = (receipt: Receipt): Jpy =>
  receipt.lines.reduce((total, line) => total + lineAmountsOf(line).taxIncluded, 0);

export const tripTotalsOf: TripTotalsOf = (
  receipts,
  operators,
  registrations,
  trip,
  rules,
): TripTotals => {
  const mine = receipts.filter((receipt) => receipt.tripId === trip.id);

  // Old-system receipts are still trip cost — the traveller spent the money and paid the
  // tax — but they were never going to be refunded, so they are not "awaiting" and not
  // "lost" either (DR-064). They count in spend and tax and nowhere else.
  const refundable = mine.filter((receipt) => !isOldSystem(receipt, rules));
  const claimable = refundable.filter((receipt) => isClaimable(receipt, rules));
  const awaitingReceipts = claimable.filter((receipt) => receipt.status !== 'refunded');
  const abandoned = refundable.filter(
    (receipt) => receipt.status === 'not_claiming' || receipt.status === 'rejected',
  );

  const byOperator = new Map<OperatorId | null, Receipt[]>();
  for (const receipt of awaitingReceipts) {
    const group = byOperator.get(receipt.operatorId);
    if (group) group.push(receipt);
    else byOperator.set(receipt.operatorId, [receipt]);
  }

  let estimatedNet: Jpy = 0;
  let estimateIncomplete = false;
  for (const [operatorId, group] of byOperator) {
    const operator = operators.find((candidate) => candidate.id === operatorId) ?? null;
    const registration =
      registrations.find(
        (candidate) => candidate.operatorId === operatorId && candidate.tripId === trip.id,
      ) ?? null;
    const payout = estimateOperatorPayout(group, operator, registration, trip, rules);
    if (payout.net === null) {
      // An unknown deduction does not become zero. The gross still counts towards the
      // estimate, and the figure is flagged incomplete so the screen can say so.
      estimateIncomplete = true;
      estimatedNet += payout.gross;
    } else {
      estimatedNet += payout.net;
    }
  }

  return {
    receiptCount: mine.length,
    spendTaxIncluded: sumOf(mine, spendOf),
    taxPaid: sumOf(mine, taxOf),
    estimatedNet,
    estimateIncomplete,
    // What actually arrived, as the traveller reported it — never our estimate (UJ-034).
    received: sumOf(
      refundable.filter((receipt) => receipt.status === 'refunded'),
      (receipt) => receipt.amountReceived ?? 0,
    ),
    awaiting: sumOf(awaitingReceipts, taxOf),
    notRefunded: sumOf(abandoned, taxOf),
    operatorCount: new Set(
      refundable
        .map((receipt) => receipt.operatorId)
        .filter((operatorId): operatorId is OperatorId => operatorId !== null),
    ).size,
  };
};
