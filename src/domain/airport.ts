/**
 * Airport readiness: what stands between the traveller and a clean kiosk run.
 *
 * Three shapes this must have, and each one is a rule rather than a layout preference:
 *
 * - **Grouped by traveller, then by receipt, never by item.** Customs confirms one whole
 *   purchase transaction or none of it (`DR-030`), and eligibility attaches to one
 *   passport (`DR-004`). Yi-chun needs to hand Chih-hao his own list, not read hers aloud
 *   in a queue (`UJ-019`).
 * - **Old-system receipts are absent entirely** (`DR-003`, `DR-064`). They have no kiosk
 *   step, and showing them here would be an instruction to do something that does not exist.
 * - **Nothing to do is said, not shown as an empty list** (`DR-079`). An empty checklist and
 *   a checklist that has not loaded look identical, and one of them means "you are done".
 */
import type {
  AirportBlocker,
  AirportBlockerKey,
  AirportReadiness,
  AirportReadinessOf,
  TravelerChecklist,
} from './api.ts';
import type { Clock } from './clock.ts';
import { deadlineStatusOf } from './deadlines.ts';
import type { Receipt, ReceiptId, Trip } from './model.ts';
import { hasHighValueItemOf, taxExcludedTotalOf } from './money.ts';
import type { ResolvedRules } from './rules.ts';
import { isClaimable, isOldSystem } from './status.ts';

/**
 * Every blocker, in the order they have to be dealt with.
 *
 * The order is the cost of ignoring each one, not their severity in the abstract: goods in
 * a checked bag are unrecoverable once the bag is gone (`DR-032`), an unanswered presence
 * question is the gate the kiosk run cannot start without (`DR-030`), and a missing
 * certificate is a delay rather than a loss (`DR-016`).
 */
interface BlockerContext {
  rules: ResolvedRules;
  trip: Trip;
  clock: Clock;
}

interface BlockerRule {
  key: AirportBlockerKey;
  applies: (receipt: Receipt, context: BlockerContext) => boolean;
}

const BLOCKERS: readonly BlockerRule[] = [
  // DR-032, DR-077: checked baggage cannot be retrieved for a tax-free procedure. This
  // is the mistake the whole product exists to prevent, and it is still preventable —
  // which is the only reason it outranks the one below.
  { key: 'blocker.checkedBag', applies: (receipt) => receipt.packingLocation === 'checked_bag' },
  // DR-031: already lost, and the machine is the worst place to discover it. A total
  // loss, so it sits above everything that is a delay or an unanswered question.
  {
    key: 'blocker.deadlineExpired',
    applies: (receipt, { rules, trip, clock }) =>
      deadlineStatusOf(receipt, trip, rules, clock).expired,
  },
  // Not knowing where the goods are is not evidence that they are in hand (TC-DOM-073).
  { key: 'blocker.packingUnknown', applies: (receipt) => receipt.packingLocation === 'unknown' },
  // DR-030: the question has to be answered before the kiosk, not at it.
  { key: 'blocker.itemsNotConfirmed', applies: (receipt) => receipt.allItemsPresent === null },
  // DR-030 again, the other way: this receipt cannot be confirmed at all and has to come
  // off the list before the traveller reaches the machine.
  { key: 'blocker.itemsMissing', applies: (receipt) => receipt.allItemsPresent === false },
  // DR-035: consumed goods must be declared to an officer at the counter, never put
  // through the kiosk.
  { key: 'blocker.consumedGoods', applies: (receipt) => receipt.willUseInJapan === true },
  // DR-016, DR-078: customs may ask for a certificate or warranty. A delay, not a loss.
  {
    key: 'blocker.documentsNeeded',
    applies: (receipt, { rules }) => hasHighValueItemOf(receipt, rules),
  },
];

export const airportReadinessOf: AirportReadinessOf = (
  trip,
  travelers,
  receipts,
  rules,
  clock: Clock,
): AirportReadiness => {
  const onThisTrip = receipts.filter((receipt) => receipt.tripId === trip.id);
  // Old-system receipts never enter this flow at all — not as a checklist row, not as a
  // blocker, not in a count (DR-003).
  const inScope = onThisTrip.filter((receipt) => !isOldSystem(receipt, rules));
  const claimable = inScope.filter((receipt) => isClaimable(receipt, rules));

  const checklists: TravelerChecklist[] = travelers.map((traveler) => {
    const mine = claimable.filter((receipt) => receipt.travelerId === traveler.id);
    return {
      travelerId: traveler.id,
      receipts: mine,
      taxExcludedTotal: mine.reduce((total, receipt) => total + taxExcludedTotalOf(receipt), 0),
      routedToCounter: mine.filter((receipt) => receipt.willUseInJapan === true),
      inCheckedBag: mine.filter((receipt) => receipt.packingLocation === 'checked_bag'),
      requiresDocuments: mine.filter((receipt) => hasHighValueItemOf(receipt, rules)),
    };
  });

  const context: BlockerContext = { rules, trip, clock };
  const blockers: AirportBlocker[] = [];
  for (const { key, applies } of BLOCKERS) {
    const receiptIds: ReceiptId[] = claimable
      .filter((receipt) => applies(receipt, context))
      .map((receipt) => receipt.id);
    if (receiptIds.length > 0) blockers.push({ key, receiptIds });
  }

  return {
    travelers: checklists,
    claimableCount: claimable.length,
    notClaimingCount: inScope.filter((receipt) => receipt.status === 'not_claiming').length,
    blockers,
    nothingToDo: claimable.length === 0,
  };
};
