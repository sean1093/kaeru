import { describe, expect, it } from 'vitest';
import {
  aFee,
  aLine,
  anOperator,
  aReceipt,
  aRegistration,
  aTraveler,
  aTrip,
} from '../test-support/domain.ts';
import { actionItemsOf } from './actions.ts';
import { airportReadinessOf } from './airport.ts';
import { fixedClock } from './clock.ts';
import type { Receipt } from './model.ts';
import { estimateOperatorPayout } from './money.ts';
import { resolveRules } from './resolve-rules.ts';
import { kaeruRules } from './rules-data.ts';
import { isClaimable, isOldSystem } from './status.ts';
import { tripTotalsOf } from './totals.ts';

const rules = resolveRules(kaeruRules, '2026-11-10');
const trip = aTrip({ departureDate: '2026-11-20', receivingChargeJpy: 1500 });
const departureDay = fixedClock('2026-11-20T06:00:00+09:00');
const midTrip = fixedClock('2026-11-12T09:00:00+09:00');
const travelers = [aTraveler({ id: 'traveler-1' }), aTraveler({ id: 'traveler-2' })];

/** A claimable receipt that trips no blocker, so each test introduces exactly one. */
const ready = (overrides: Partial<Receipt> = {}): Receipt =>
  aReceipt({
    allItemsPresent: true,
    willUseInJapan: false,
    packingLocation: 'with_me',
    photoRef: 'photo-1',
    lines: [aLine({ taxExcludedAmount: 20_000 })],
    ...overrides,
  });

/** The same receipt with no photo attached, which `exactOptionalPropertyTypes` will not fake. */
const withoutPhoto = (receipt: Receipt): Receipt => {
  const { photoRef: _photoRef, ...rest } = receipt;
  return rest;
};

const keysOf = (blockers: readonly { key: string }[]) => blockers.map((blocker) => blocker.key);

describe('airportReadinessOf (DR-030, DR-079, UJ-019)', () => {
  it('TC-DOM-084 says there is nothing to do rather than showing an empty list', () => {
    const readiness = airportReadinessOf(trip, travelers, [], rules, departureDay);
    expect(readiness.nothingToDo).toBe(true);
    expect(readiness.claimableCount).toBe(0);
    expect(readiness.travelers).toHaveLength(2);
    expect(readiness.travelers.every((checklist) => checklist.receipts.length === 0)).toBe(true);
  });

  it('TC-DOM-001 excludes old-system receipts entirely, not merely from the checklist', () => {
    // They have no kiosk step, so a row, a count or a blocker about one would be an
    // instruction to do something that does not exist (DR-003).
    const old = ready({ id: 'old', purchaseDate: '2026-10-31', packingLocation: 'checked_bag' });
    const readiness = airportReadinessOf(trip, travelers, [old], rules, departureDay);
    expect(readiness.nothingToDo).toBe(true);
    expect(readiness.claimableCount).toBe(0);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.travelers[0]?.receipts).toEqual([]);
  });

  it('UJ-019 gives each traveller their own list, because each passport is its own procedure', () => {
    const hers = ready({ id: 'a', travelerId: 'traveler-1' });
    const his = ready({
      id: 'b',
      travelerId: 'traveler-2',
      lines: [aLine({ taxExcludedAmount: 9000 })],
    });
    const readiness = airportReadinessOf(trip, travelers, [hers, his], rules, departureDay);
    expect(readiness.travelers[0]?.receipts.map((r) => r.id)).toEqual(['a']);
    expect(readiness.travelers[1]?.receipts.map((r) => r.id)).toEqual(['b']);
    expect(readiness.travelers[0]?.taxExcludedTotal).toBe(20_000);
    expect(readiness.travelers[1]?.taxExcludedTotal).toBe(9000);
    expect(readiness.claimableCount).toBe(2);
  });

  it('TC-DOM-072 raises a checked bag as a blocker naming its receipts', () => {
    const packed = ready({ id: 'packed', packingLocation: 'checked_bag' });
    const readiness = airportReadinessOf(trip, travelers, [ready(), packed], rules, departureDay);
    const blocker = readiness.blockers.find((b) => b.key === 'blocker.checkedBag');
    expect(blocker?.receiptIds).toEqual(['packed']);
    expect(readiness.travelers[0]?.inCheckedBag.map((r) => r.id)).toEqual(['packed']);
  });

  it('TC-DOM-080 routes a receipt whose goods were used in Japan to the counter', () => {
    // DR-035: the official instruction is to tell an officer, not to try the machine.
    const used = ready({ id: 'used', willUseInJapan: true });
    const readiness = airportReadinessOf(trip, travelers, [used], rules, departureDay);
    expect(readiness.travelers[0]?.routedToCounter.map((r) => r.id)).toEqual(['used']);
    expect(keysOf(readiness.blockers)).toContain('blocker.consumedGoods');
  });

  it('TC-DOM-025 flags documents for a high-value receipt', () => {
    const watch = ready({
      id: 'watch',
      lines: [aLine({ taxExcludedAmount: 1_280_000, maxUnitPriceTaxExcluded: 1_280_000 })],
    });
    const readiness = airportReadinessOf(trip, travelers, [watch], rules, departureDay);
    expect(readiness.travelers[0]?.requiresDocuments.map((receipt) => receipt.id)).toEqual([
      'watch',
    ]);
    expect(keysOf(readiness.blockers)).toContain('blocker.documentsNeeded');
  });

  it('separates an unanswered presence question from an answered no', () => {
    const unanswered = ready({ id: 'unanswered', allItemsPresent: null });
    const missing = ready({ id: 'missing', allItemsPresent: false });
    const readiness = airportReadinessOf(
      trip,
      travelers,
      [unanswered, missing],
      rules,
      departureDay,
    );
    // Different problems with different remedies: one needs an answer, the other needs the
    // receipt taken off the list before the traveller reaches the machine (DR-030).
    expect(
      readiness.blockers.find((b) => b.key === 'blocker.itemsNotConfirmed')?.receiptIds,
    ).toEqual(['unanswered']);
    expect(readiness.blockers.find((b) => b.key === 'blocker.itemsMissing')?.receiptIds).toEqual([
      'missing',
    ]);
  });

  it('reports blockers in the order they have to be dealt with', () => {
    const everything = [
      ready({ id: 'bag', packingLocation: 'checked_bag' }),
      ready({ id: 'unknown-bag', packingLocation: 'unknown' }),
      ready({ id: 'unanswered', allItemsPresent: null }),
      ready({ id: 'used', willUseInJapan: true }),
    ];
    const readiness = airportReadinessOf(trip, travelers, everything, rules, departureDay);
    expect(keysOf(readiness.blockers)).toEqual([
      'blocker.checkedBag',
      'blocker.packingUnknown',
      'blocker.itemsNotConfirmed',
      'blocker.consumedGoods',
    ]);
  });

  it('ranks an expired deadline above every delay, because it is a total loss', () => {
    // The array's order is load-bearing on S30: the traveller works down it.
    const lateTrip = aTrip({ departureDate: '2027-03-01' });
    const readiness = airportReadinessOf(
      lateTrip,
      travelers,
      [
        ready({
          id: 'watch',
          purchaseDate: '2026-11-01',
          lines: [aLine({ taxExcludedAmount: 1_280_000, maxUnitPriceTaxExcluded: 1_280_000 })],
        }),
        ready({ id: 'stale', purchaseDate: '2026-11-01' }),
        ready({ id: 'bag', purchaseDate: '2026-11-01', packingLocation: 'checked_bag' }),
      ],
      rules,
      fixedClock('2027-02-28T06:00:00+09:00'),
    );
    const order = keysOf(readiness.blockers);
    expect(order.indexOf('blocker.deadlineExpired')).toBeLessThan(
      order.indexOf('blocker.documentsNeeded'),
    );
    // Only a checked bag outranks it, and only because that one is still preventable.
    expect(order[0]).toBe('blocker.checkedBag');
    expect(order[1]).toBe('blocker.deadlineExpired');
  });

  it('reports an expired deadline, which the machine would otherwise discover', () => {
    const lateTrip = aTrip({ departureDate: '2027-03-01' });
    const stale = ready({ id: 'stale', purchaseDate: '2026-11-01' });
    const readiness = airportReadinessOf(
      lateTrip,
      travelers,
      [stale],
      rules,
      fixedClock('2027-02-28T06:00:00+09:00'),
    );
    expect(readiness.blockers.find((b) => b.key === 'blocker.deadlineExpired')?.receiptIds).toEqual(
      ['stale'],
    );
  });

  it('counts the receipts the traveller has stopped claiming without listing them', () => {
    const abandoned = ready({ id: 'gone', status: 'not_claiming', packingLocation: 'checked_bag' });
    const readiness = airportReadinessOf(
      trip,
      travelers,
      [ready(), abandoned],
      rules,
      departureDay,
    );
    expect(readiness.notClaimingCount).toBe(1);
    expect(readiness.claimableCount).toBe(1);
    expect(readiness.blockers).toEqual([]);
  });

  it('ignores receipts belonging to another trip', () => {
    const elsewhere = ready({ id: 'other', tripId: 'trip-9', packingLocation: 'checked_bag' });
    const readiness = airportReadinessOf(trip, travelers, [elsewhere], rules, departureDay);
    expect(readiness.nothingToDo).toBe(true);
  });
});

describe('tripTotalsOf (UJ-016, UJ-036)', () => {
  const operator = anOperator({
    id: 'operator-1',
    fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })],
  });
  const registration = aRegistration({ operatorId: 'operator-1', refundMethod: 'bank_transfer' });

  it('TC-DOM-051 keeps the figures segmented rather than blending them', () => {
    const receipts = [
      ready({ id: 'a', operatorId: 'operator-1', status: 'refund_pending' }),
      ready({ id: 'b', operatorId: 'operator-1', status: 'refunded', amountReceived: 1700 }),
      ready({ id: 'c', status: 'not_claiming' }),
    ];
    const totals = tripTotalsOf(receipts, [operator], [registration], trip, rules);
    expect(totals.receiptCount).toBe(3);
    expect(totals.taxPaid).toBe(6000); // 2,000 per receipt
    expect(totals.spendTaxIncluded).toBe(66_000);
    expect(totals.awaiting).toBe(2000); // only the one still pending
    expect(totals.received).toBe(1700); // what arrived, not what we estimated
    expect(totals.notRefunded).toBe(2000); // the abandoned one
    expect(totals.operatorCount).toBe(1);
  });

  it('charges the receiving fee once per operator payout, not once per receipt', () => {
    const five = [1, 2, 3, 4, 5].map((n) =>
      ready({ id: `r${n}`, operatorId: 'operator-1', status: 'logged' }),
    );
    const totals = tripTotalsOf(five, [operator], [registration], trip, rules);
    const payout = estimateOperatorPayout(five, operator, registration, trip, rules);
    // Identical to the refund tracker's own figure, because it is the same calculation.
    expect(totals.estimatedNet).toBe(payout.net);
    expect(totals.estimateIncomplete).toBe(false);
  });

  it('TC-DOM-050 agrees with the refund tracker for every seeded trip, not just this one', () => {
    // The worked example above pins one concrete case so a failure here is easy to read.
    // This is the invariant: for any trip, the home screen's hero figure is the sum of the
    // per-operator payouts, because it *is* those payouts and not a second calculation.
    // The interesting shapes are the ones a re-derivation would get wrong — several
    // operators at once, known and unknown fees mixed, an override, assorted statuses.
    const knownFee = anOperator({
      id: 'op-known',
      fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })],
    });
    const salesFee = anOperator({
      id: 'op-sales',
      refundMethods: ['credit_card'],
      fees: [aFee({ rate: { basisPoints: 50, basis: 'purchase_tax_excluded' }, minimumJpy: 180 })],
    });
    const unknownFee = anOperator({ id: 'op-unknown' });
    const operators = [knownFee, salesFee, unknownFee];
    const registrations = [
      aRegistration({ operatorId: 'op-known', refundMethod: 'bank_transfer' }),
      aRegistration({
        operatorId: 'op-sales',
        refundMethod: 'credit_card',
        feeOverride: aFee({ rate: { basisPoints: 300, basis: 'refund' }, status: 'unconfirmed' }),
      }),
    ];
    const operatorIds = ['op-known', 'op-sales', 'op-unknown', null] as const;
    const statuses = [
      'logged',
      'registered',
      'refund_pending',
      'refunded',
      'not_claiming',
    ] as const;

    for (let seed = 0; seed < 50; seed += 1) {
      const receipts = Array.from({ length: (seed % 6) + 1 }, (_, index) =>
        ready({
          id: `p${seed}-${index}`,
          operatorId: operatorIds[(seed + index) % operatorIds.length] ?? null,
          status: statuses[(seed * 3 + index) % statuses.length] ?? 'logged',
          amountReceived: 1234,
          purchaseDate: index % 5 === 0 ? '2026-10-31' : '2026-11-10',
          lines: [aLine({ taxExcludedAmount: 1000 * (index + 1) + seed * 37 })],
        }),
      );

      // The receipts a payout can still be expected for, named through the public rules
      // rather than guessed at.
      const awaiting = receipts.filter(
        (receipt) =>
          !isOldSystem(receipt, rules) &&
          isClaimable(receipt, rules) &&
          receipt.status !== 'refunded',
      );
      const groups = new Map<string | null, typeof awaiting>();
      for (const receipt of awaiting) {
        groups.set(receipt.operatorId, [...(groups.get(receipt.operatorId) ?? []), receipt]);
      }

      let expectedNet = 0;
      let expectedIncomplete = false;
      for (const [operatorId, group] of groups) {
        const payout = estimateOperatorPayout(
          group,
          operators.find((candidate) => candidate.id === operatorId) ?? null,
          registrations.find((candidate) => candidate.operatorId === operatorId) ?? null,
          trip,
          rules,
        );
        if (payout.net === null) {
          // TC-DOM-048: the gross still counts. An unknown deduction is not a reason to
          // show nothing, and it is easy to get wrong when one group is unknown and three
          // are known.
          expectedIncomplete = true;
          expectedNet += payout.gross;
        } else {
          expectedNet += payout.net;
        }
      }

      const totals = tripTotalsOf(receipts, operators, registrations, trip, rules);
      expect(totals.estimatedNet, `seed ${seed}`).toBe(expectedNet);
      expect(totals.estimateIncomplete, `seed ${seed}`).toBe(expectedIncomplete);
    }
  });

  it('TC-DOM-048 flags the estimate as incomplete instead of treating an unknown fee as zero', () => {
    const unknownFee = anOperator({ id: 'operator-2' });
    const receipts = [ready({ id: 'a', operatorId: 'operator-2' })];
    const totals = tripTotalsOf(receipts, [unknownFee], [], trip, rules);
    expect(totals.estimateIncomplete).toBe(true);
    // The gross still counts: an unknown deduction is not a reason to show nothing.
    expect(totals.estimatedNet).toBe(2000);
  });

  it('counts an old-system receipt as trip cost and nothing else', () => {
    const old = ready({ id: 'old', purchaseDate: '2026-10-31' });
    const totals = tripTotalsOf([old], [operator], [registration], trip, rules);
    expect(totals.receiptCount).toBe(1);
    expect(totals.taxPaid).toBe(2000);
    expect(totals.awaiting).toBe(0);
    expect(totals.notRefunded).toBe(0);
    expect(totals.estimatedNet).toBe(0);
  });

  it('TC-DOM-050 partitions exactly: per-traveller totals sum to the trip total', () => {
    // 100 seeded receipt sets, split across two travellers and three operators.
    for (let seed = 0; seed < 100; seed += 1) {
      const receipts = Array.from({ length: (seed % 7) + 1 }, (_, index) =>
        ready({
          id: `s${seed}-${index}`,
          travelerId: index % 2 === 0 ? 'traveler-1' : 'traveler-2',
          operatorId: index % 3 === 0 ? 'operator-1' : null,
          lines: [aLine({ taxExcludedAmount: 1000 * (index + 1) + seed })],
        }),
      );
      const whole = tripTotalsOf(receipts, [operator], [registration], trip, rules);
      const parts = ['traveler-1', 'traveler-2'].map((travelerId) =>
        tripTotalsOf(
          receipts.filter((receipt) => receipt.travelerId === travelerId),
          [operator],
          [registration],
          trip,
          rules,
        ),
      );
      expect(parts.reduce((total, part) => total + part.taxPaid, 0)).toBe(whole.taxPaid);
      expect(parts.reduce((total, part) => total + part.spendTaxIncluded, 0)).toBe(
        whole.spendTaxIncluded,
      );
      expect(parts.reduce((total, part) => total + part.awaiting, 0)).toBe(whole.awaiting);
      expect(parts.reduce((total, part) => total + part.receiptCount, 0)).toBe(whole.receiptCount);
    }
  });
});

describe('actionItemsOf (UJ-011)', () => {
  it('TC-DOM-072 ranks a checked bag above a missing photo', () => {
    const items = actionItemsOf(
      trip,
      [withoutPhoto(ready({ id: 'photo' })), ready({ id: 'bag', packingLocation: 'checked_bag' })],
      [],
      rules,
      departureDay,
    );
    const kinds = items.map((item) => item.kind);
    expect(kinds.indexOf('packing_checked_bag')).toBeLessThan(kinds.indexOf('photo_missing'));
  });

  it('orders every kind by the cost of ignoring it, deterministically', () => {
    const items = actionItemsOf(
      trip,
      [
        withoutPhoto(ready({ id: 'photo' })),
        ready({ id: 'nooperator', operatorId: null }),
        ready({ id: 'unregistered', operatorId: 'operator-1' }),
        ready({
          id: 'watch',
          lines: [aLine({ taxExcludedAmount: 1_280_000, maxUnitPriceTaxExcluded: 1_280_000 })],
        }),
        ready({ id: 'unknownbag', packingLocation: 'unknown' }),
        ready({ id: 'bag', packingLocation: 'checked_bag' }),
      ],
      [aRegistration({ operatorId: 'operator-1', registeredAt: null })],
      rules,
      departureDay,
    );
    expect(items.map((item) => item.kind)).toEqual([
      'packing_checked_bag',
      'packing_unknown',
      'documents_needed',
      'operator_not_registered',
      'operator_unknown',
      'photo_missing',
    ]);
  });

  it('sorts more money first within a kind, never by entry order', () => {
    const items = actionItemsOf(
      trip,
      [
        ready({
          id: 'cheap',
          travelerId: 'traveler-2',
          packingLocation: 'checked_bag',
          lines: [aLine({ taxExcludedAmount: 5000 })],
        }),
        ready({
          id: 'dear',
          packingLocation: 'checked_bag',
          lines: [aLine({ taxExcludedAmount: 1_280_000 })],
        }),
      ],
      [],
      rules,
      departureDay,
    );
    const bags = items.filter((item) => item.kind === 'packing_checked_bag');
    // Both receipts are one item, and the weight reflects the combined money at stake.
    expect(bags).toHaveLength(1);
    expect(bags[0]?.receiptIds).toEqual(['cheap', 'dear']);
    expect(bags[0]?.weight).toBeLessThan(10 * 1000);
  });

  it('groups an unregistered operator by operator, because registration is done once', () => {
    const items = actionItemsOf(
      trip,
      [
        ready({ id: 'a', operatorId: 'operator-1' }),
        ready({ id: 'b', operatorId: 'operator-1' }),
        ready({ id: 'c', operatorId: 'operator-2' }),
      ],
      [],
      rules,
      midTrip,
    );
    const registrationItems = items.filter((item) => item.kind === 'operator_not_registered');
    expect(registrationItems).toHaveLength(2);
    expect(registrationItems[0]?.operatorId).toBe('operator-1');
    expect(registrationItems[0]?.receiptIds).toEqual(['a', 'b']);
  });

  it('says nothing about a receipt the traveller has stopped claiming, or an old-system one', () => {
    const items = actionItemsOf(
      trip,
      [
        ready({ id: 'gone', status: 'not_claiming', packingLocation: 'checked_bag' }),
        ready({ id: 'old', purchaseDate: '2026-10-31', packingLocation: 'checked_bag' }),
      ],
      [],
      rules,
      departureDay,
    );
    expect(items).toEqual([]);
  });

  it('raises a deadline with no margin as well as one already missed', () => {
    const tight = aTrip({ departureDate: '2027-01-30' });
    const items = actionItemsOf(
      tight,
      [ready({ id: 'tight', purchaseDate: '2026-11-01' })],
      [],
      rules,
      midTrip,
    );
    expect(items.map((item) => item.kind)).toContain('deadline_at_risk');
  });

  it('produces nothing for a trip where everything is in order', () => {
    expect(
      actionItemsOf(trip, [ready({ operatorId: null })], [], rules, departureDay).map(
        (i) => i.kind,
      ),
    ).toEqual(['operator_unknown']);
    const done = ready({ operatorId: 'operator-1' });
    const registered = [
      aRegistration({ operatorId: 'operator-1', registeredAt: '2026-11-11T09:00:00+09:00' }),
    ];
    expect(actionItemsOf(trip, [done], registered, rules, departureDay)).toEqual([]);
  });
});
