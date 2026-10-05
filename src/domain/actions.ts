/**
 * What to do about it, ranked by the cost of ignoring it (`UJ-011`).
 *
 * The ordering is the product decision in this file, so it is stated rather than implied:
 *
 * 1. **Goods in a checked bag** — unrecoverable once the bag is gone (`DR-032`). Every
 *    other item on this list can still be fixed afterwards.
 * 2. **A deadline that passes before departure** — the refund is already lost (`DR-076`).
 * 3. **An unknown packing location** — at risk, because not knowing is not evidence that
 *    the goods are in hand.
 * 4. **Documents for a high-value receipt** — a delay at the counter, not a loss (`DR-016`).
 * 5. **An unregistered operator** — the money has nowhere to go (`UJ-013`).
 * 6. **An unknown operator** — resolvable from the receipt QR at any time (`DR-050`).
 * 7. **A missing photo** — a convenience, and the only item here that costs nothing.
 *
 * Within a kind, more money sorts first: a checked bag holding ¥128,000 of watch outranks
 * one holding a ¥500 snack. Never entry order, which is what the user would get if the
 * list were simply the receipts in the order they were typed.
 */
import type { ActionItem, ActionItemsOf } from './api.ts';
import type { Clock } from './clock.ts';
import { deadlineStatusOf } from './deadlines.ts';
import type { OperatorId, Receipt } from './model.ts';
import { grossRefundOf, hasHighValueItemOf } from './money.ts';
import { isClaimable, isOldSystem, registrationStateOf } from './status.ts';

type Kind = ActionItem['kind'];

/** Lower sorts first. Sparse so a kind can be inserted without renumbering. */
const RANK: Record<Kind, number> = {
  packing_checked_bag: 10,
  deadline_at_risk: 20,
  packing_unknown: 30,
  documents_needed: 40,
  operator_not_registered: 50,
  operator_unknown: 60,
  photo_missing: 70,
};

/**
 * A kind always outranks every kind below it, and money only orders within a kind.
 *
 * The money term is subtracted so that more at stake sorts earlier, and it is clamped
 * below the rank step so a large refund can never lift a missing photo above a checked
 * bag — the thing at stake there is the whole refund, not a larger number.
 */
const RANK_STEP = 1000;
const YEN_PER_BUCKET = 1000;

function weigh(kind: Kind, grossAtStake: number): number {
  // Money is resolved to thousands of yen, which is finer than any ordering decision a
  // human makes and keeps the term inside one rank step by construction.
  const buckets = Math.min(RANK_STEP - 1, Math.floor(grossAtStake / YEN_PER_BUCKET));
  return RANK[kind] * RANK_STEP - buckets;
}

export const actionItemsOf: ActionItemsOf = (
  trip,
  receipts,
  registrations,
  rules,
  clock: Clock,
): readonly ActionItem[] => {
  const claimable = receipts.filter(
    (receipt) =>
      receipt.tripId === trip.id && !isOldSystem(receipt, rules) && isClaimable(receipt, rules),
  );

  const items: ActionItem[] = [];

  /** One item per kind, carrying every receipt it is about and their combined gross. */
  const add = (kind: Kind, matching: readonly Receipt[], operatorId: OperatorId | null = null) => {
    if (matching.length === 0) return;
    items.push({
      kind,
      receiptIds: matching.map((receipt) => receipt.id),
      operatorId,
      weight: weigh(
        kind,
        matching.reduce((total, receipt) => total + grossRefundOf(receipt), 0),
      ),
    });
  };

  add(
    'packing_checked_bag',
    claimable.filter((receipt) => receipt.packingLocation === 'checked_bag'),
  );
  add(
    'deadline_at_risk',
    claimable.filter((receipt) => {
      const status = deadlineStatusOf(receipt, trip, rules, clock);
      return status.risk === 'missed' || status.risk === 'no_margin' || status.expired;
    }),
  );
  add(
    'packing_unknown',
    claimable.filter((receipt) => receipt.packingLocation === 'unknown'),
  );
  add(
    'documents_needed',
    claimable.filter((receipt) => hasHighValueItemOf(receipt, rules)),
  );

  // Registration is a property of the operator, so these group by operator rather than
  // collapsing into one row: the traveller does one registration per operator (UJ-013).
  const unregistered = new Map<OperatorId, Receipt[]>();
  for (const receipt of claimable) {
    if (receipt.operatorId === null) continue;
    if (registrationStateOf(receipt, registrations) !== 'not_registered') continue;
    const group = unregistered.get(receipt.operatorId);
    if (group) group.push(receipt);
    else unregistered.set(receipt.operatorId, [receipt]);
  }
  for (const [operatorId, group] of unregistered) {
    add('operator_not_registered', group, operatorId);
  }

  add(
    'operator_unknown',
    claimable.filter((receipt) => receipt.operatorId === null),
  );
  add(
    'photo_missing',
    claimable.filter((receipt) => receipt.photoRef === undefined),
  );

  // Ties break on the receipt ids so the order is stable across renders rather than
  // depending on which receipts happened to be read first.
  return items.sort(
    (a, b) => a.weight - b.weight || a.receiptIds.join().localeCompare(b.receiptIds.join()),
  );
};
