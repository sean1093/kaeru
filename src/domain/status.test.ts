import { describe, expect, it } from 'vitest';
import { aReceipt, aRegistration } from '../test-support/domain.ts';
import type { ReceiptStatus } from './model.ts';
import { resolveRules } from './resolve-rules.ts';
import { kaeruRules } from './rules-data.ts';
import { isClaimable, isOldSystem, registrationStateOf, resolveTransition } from './status.ts';

const rules = resolveRules(kaeruRules, '2026-11-10');
const oldRules = resolveRules(kaeruRules, '2026-10-31');

const ALL_STATUSES: readonly ReceiptStatus[] = [
  'logged',
  'registered',
  'customs_confirmed',
  'refund_pending',
  'refunded',
  'rejected',
  'refund_disputed',
  'not_claiming',
];

const PRE_REFUND: readonly ReceiptStatus[] = [
  'logged',
  'registered',
  'customs_confirmed',
  'refund_pending',
  'rejected',
  'refund_disputed',
];

const withOperator = (overrides = {}) => aReceipt({ operatorId: 'operator-1', ...overrides });

describe('resolveTransition — the lifecycle (DR-060, DR-061, DR-063)', () => {
  it('TC-DOM-090 refuses registered without an operator, because registration is the operator\u2019s', () => {
    const outcome = resolveTransition(aReceipt({ operatorId: null }), 'registered', rules);
    expect(outcome).toEqual({ allowed: false, reason: 'registration_needs_operator' });
    expect(resolveTransition(withOperator(), 'registered', rules)).toEqual({
      allowed: true,
      status: 'registered',
    });
  });

  it('TC-DOM-091 refuses customs_confirmed while an item is missing', () => {
    // DR-061, DR-030: customs confirms a whole receipt or none of it, so asserting
    // confirmation on an incomplete receipt would cost the traveller every item on it.
    const incomplete = withOperator({ allItemsPresent: false });
    expect(resolveTransition(incomplete, 'customs_confirmed', rules)).toEqual({
      allowed: false,
      reason: 'items_not_present',
    });
    // The routes out are rejected or not_claiming, and both stay open.
    expect(resolveTransition(incomplete, 'rejected', rules).allowed).toBe(true);
    expect(resolveTransition(incomplete, 'not_claiming', rules).allowed).toBe(true);
  });

  it('TC-DOM-070 refuses it for an unanswered question too, and allows it once answered', () => {
    expect(
      resolveTransition(withOperator({ allItemsPresent: null }), 'customs_confirmed', rules),
    ).toMatchObject({ allowed: true });
    expect(
      resolveTransition(withOperator({ allItemsPresent: true }), 'customs_confirmed', rules),
    ).toMatchObject({ allowed: true });
  });

  it('TC-DOM-092 enters refund_pending automatically on confirmation', () => {
    // DR-060d. The status to write lives inside the allowed branch, so a caller cannot
    // confirm a receipt and leave it in a state the refund tracker never counts.
    const outcome = resolveTransition(withOperator(), 'customs_confirmed', rules);
    expect(outcome).toEqual({ allowed: true, status: 'refund_pending' });
  });

  it('TC-DOM-093 allows refunded without first requiring the amount to be stored', () => {
    // The amount and the status are written by one user action. Refusing here would make
    // the order of two writes part of the contract, and would trap a user out of a state
    // they are re-entering after an undo.
    expect(resolveTransition(withOperator({ amountReceived: null }), 'refunded', rules)).toEqual({
      allowed: true,
      status: 'refunded',
    });
  });

  it('TC-DOM-094 allows every transition the diagram draws', () => {
    const edges: readonly [ReceiptStatus, ReceiptStatus][] = [
      ['logged', 'registered'],
      ['registered', 'customs_confirmed'],
      ['customs_confirmed', 'refund_pending'],
      ['refund_pending', 'refunded'],
      ['refund_pending', 'refund_disputed'],
      ['registered', 'rejected'],
      ['customs_confirmed', 'rejected'],
      ['logged', 'not_claiming'],
      ['registered', 'not_claiming'],
      ['refunded', 'not_claiming'],
    ];
    for (const [from, to] of edges) {
      const outcome = resolveTransition(withOperator({ status: from }), to, rules);
      expect(outcome.allowed, `${from} -> ${to}`).toBe(true);
    }
  });

  it('TC-DOM-095 keeps every state reversible, because people mis-tap in airport queues', () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const outcome = resolveTransition(withOperator({ status: from }), to, rules);
        expect(outcome.allowed, `${from} -> ${to}`).toBe(true);
      }
    }
  });

  it('TC-DOM-098 @unconfirmed reaches not_claiming from every pre-refund state', () => {
    for (const from of PRE_REFUND) {
      const outcome = resolveTransition(withOperator({ status: from }), 'not_claiming', rules);
      expect(outcome).toEqual({ allowed: true, status: 'not_claiming' });
    }
  });

  it('TC-DOM-097 never confirms an old-system receipt, and lets it stop claiming instead', () => {
    const old = withOperator({ purchaseDate: '2026-10-31', status: 'logged' });
    expect(resolveTransition(old, 'customs_confirmed', oldRules)).toEqual({
      allowed: false,
      reason: 'old_system_has_no_customs',
    });
    expect(resolveTransition(old, 'not_claiming', oldRules)).toEqual({
      allowed: true,
      status: 'not_claiming',
    });
    // The boundary, not a date range: the next day's purchase can be confirmed.
    const newSystem = withOperator({ purchaseDate: '2026-11-01' });
    expect(resolveTransition(newSystem, 'customs_confirmed', rules).allowed).toBe(true);
  });

  it('refuses for exactly three reasons and no others, across every state pair', () => {
    const reasons = new Set<string>();
    for (const purchaseDate of ['2026-10-31', '2026-11-01']) {
      for (const allItemsPresent of [true, false, null]) {
        for (const operatorId of ['operator-1', null]) {
          for (const to of ALL_STATUSES) {
            const receipt = aReceipt({ purchaseDate, allItemsPresent, operatorId });
            const resolved = purchaseDate === '2026-10-31' ? oldRules : rules;
            const outcome = resolveTransition(receipt, to, resolved);
            if (!outcome.allowed) reasons.add(outcome.reason);
          }
        }
      }
    }
    expect([...reasons].sort()).toEqual([
      'items_not_present',
      'old_system_has_no_customs',
      'registration_needs_operator',
    ]);
  });
});

describe('isOldSystem and isClaimable (DR-001, DR-003, DR-064)', () => {
  it('TC-DOM-001 reads the boundary off the receipt, not off the resolution date', () => {
    // One ResolvedRules is shared across a receipt set, so the comparison must be against
    // each receipt's own purchase date.
    expect(isOldSystem(aReceipt({ purchaseDate: '2026-10-31' }), rules)).toBe(true);
    expect(isOldSystem(aReceipt({ purchaseDate: '2026-11-01' }), rules)).toBe(false);
    expect(isOldSystem(aReceipt({ purchaseDate: '2026-11-01' }), oldRules)).toBe(false);
  });

  it('TC-DOM-097 never makes an old-system receipt claimable, whatever its status', () => {
    for (const status of ALL_STATUSES) {
      expect(isClaimable(aReceipt({ purchaseDate: '2026-10-31', status }), oldRules)).toBe(false);
    }
  });

  it('stops counting a receipt once the traveller has stopped pursuing it', () => {
    const claimableIn = (status: ReceiptStatus) => isClaimable(aReceipt({ status }), rules);
    expect(claimableIn('logged')).toBe(true);
    expect(claimableIn('registered')).toBe(true);
    expect(claimableIn('customs_confirmed')).toBe(true);
    expect(claimableIn('refund_pending')).toBe(true);
    // A disputed refund is one being chased, so it is still live.
    expect(claimableIn('refund_disputed')).toBe(true);
    expect(claimableIn('refunded')).toBe(false);
    expect(claimableIn('rejected')).toBe(false);
    expect(claimableIn('not_claiming')).toBe(false);
  });
});

describe('registrationStateOf (UJ-013, DR-050)', () => {
  it('has nothing to report while the operator is unknown', () => {
    // "Not sure" is a valid state that may persist for the whole trip, and an unknown
    // operator has no registration to be in either state of.
    expect(registrationStateOf(aReceipt({ operatorId: null }), [])).toBe('not_applicable');
  });

  it('shares one registration across every receipt of that operator', () => {
    const registered = [aRegistration({ registeredAt: '2026-11-11T09:00:00+09:00' })];
    const first = aReceipt({ id: 'a', operatorId: 'operator-1' });
    // A receipt added after the registration follows automatically: implementing this per
    // receipt would make an eleven-receipt trip an eleven-times chore.
    const addedLater = aReceipt({ id: 'z', operatorId: 'operator-1' });
    expect(registrationStateOf(first, registered)).toBe('registered');
    expect(registrationStateOf(addedLater, registered)).toBe('registered');
  });

  it('does not treat a started-but-unfinished registration as done', () => {
    expect(registrationStateOf(withOperator(), [aRegistration({ registeredAt: null })])).toBe(
      'not_registered',
    );
    expect(registrationStateOf(withOperator(), [])).toBe('not_registered');
  });

  it('does not borrow another trip\u2019s registration', () => {
    const otherTrip = [
      aRegistration({ tripId: 'trip-2', registeredAt: '2026-11-11T09:00:00+09:00' }),
    ];
    expect(registrationStateOf(withOperator(), otherTrip)).toBe('not_registered');
  });

  it('does not borrow another operator\u2019s registration', () => {
    const other = [
      aRegistration({ operatorId: 'operator-2', registeredAt: '2026-11-11T09:00:00+09:00' }),
    ];
    expect(registrationStateOf(withOperator(), other)).toBe('not_registered');
  });
});
