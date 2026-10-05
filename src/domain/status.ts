/**
 * The receipt lifecycle (`DR-060`).
 *
 * Two principles shape every decision here, and they pull in opposite directions:
 *
 * - **Every state is user-asserted and every state is reversible** (`DR-062`, `DR-063`).
 *   The user is standing in an airport queue with bags and will mis-tap. A lifecycle that
 *   refuses to go backwards turns a mis-tap into a lost refund, which is strictly worse
 *   than a wrong status they can see and correct.
 * - **Three transitions are genuinely impossible**, and each is a rule rather than a
 *   tidiness preference. They are refused with a reason the screen can explain.
 *
 * Nothing here mutates: a transition is resolved, and the caller writes the result.
 */
import type {
  IsClaimable,
  IsOldSystem,
  RegistrationStateOf,
  ResolveTransition,
  TransitionOutcome,
} from './api.ts';

/**
 * Whether a purchase falls under the old system (`DR-001`, `DR-003`).
 *
 * Compared against the receipt's own `purchaseDate` and never against `rules.on`, because
 * one `ResolvedRules` is deliberately shared across a receipt set.
 */
export const isOldSystem: IsOldSystem = (receipt, rules) =>
  receipt.purchaseDate < rules.system.refundSystemStart;

export const resolveTransition: ResolveTransition = (receipt, to, rules): TransitionOutcome => {
  if (to === 'customs_confirmed') {
    // DR-003, DR-064: an old-system purchase was tax-free at the till and has no customs
    // step to complete. Enforced here rather than left to "Airport Mode never lists one",
    // which holds only until a bulk action, an import or an undo adds a second route in.
    if (isOldSystem(receipt, rules)) {
      return { allowed: false, reason: 'old_system_has_no_customs' };
    }
    // DR-061, DR-030: customs confirms a whole receipt or none of it. A receipt with an
    // item missing cannot be confirmed, and saying it was is the one lie that costs the
    // traveller the whole receipt rather than the missing item.
    if (receipt.allItemsPresent === false) {
      return { allowed: false, reason: 'items_not_present' };
    }
    // DR-060d: confirmation is the moment the money starts being owed, so the receipt
    // lands in refund_pending. Returning it here is what stops a caller writing
    // `customs_confirmed` and leaving the receipt in a state the tracker never counts.
    return { allowed: true, status: 'refund_pending' };
  }

  // DR-060b: registration is a property of the operator, so an unknown operator cannot
  // have been registered with. Nothing else about the receipt matters.
  if (to === 'registered' && receipt.operatorId === null) {
    return { allowed: false, reason: 'registration_needs_operator' };
  }

  return { allowed: true, status: to };
};

/**
 * A receipt the traveller is still trying to get money back for.
 *
 * Old-system receipts are never claimable: there is nothing to claim, the tax was never
 * charged in the first place (`DR-003`). `refunded` is not claimable because the money
 * arrived; `rejected` and `not_claiming` because the traveller has stopped. `refund_pending`
 * and `refund_disputed` are both still live — a disputed refund is one being chased.
 */
export const isClaimable: IsClaimable = (receipt, rules) => {
  if (isOldSystem(receipt, rules)) return false;
  return (
    receipt.status !== 'not_claiming' &&
    receipt.status !== 'rejected' &&
    receipt.status !== 'refunded'
  );
};

/**
 * The operator's registration state, which every receipt of that operator shares
 * (`UJ-013`, `DR-060b`).
 *
 * Registration belongs to the operator, not the receipt: marking one receipt registered
 * marks the operator, and every other receipt of that operator follows — including ones
 * added later. Implementing it per receipt would make an eleven-receipt trip an
 * eleven-times chore.
 */
export const registrationStateOf: RegistrationStateOf = (receipt, registrations) => {
  // "Not sure" is a valid state that may persist for the whole trip (DR-050), and an
  // unknown operator has no registration to be in either state of.
  if (receipt.operatorId === null) return 'not_applicable';
  const registration = registrations.find(
    (candidate) =>
      candidate.operatorId === receipt.operatorId && candidate.tripId === receipt.tripId,
  );
  return registration?.registeredAt != null ? 'registered' : 'not_registered';
};
