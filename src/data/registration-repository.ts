import type { OperatorRegistration } from '../domain/model.ts';
import { StorageError } from './errors.ts';
import { normalizeRegistration } from './normalize.ts';
import type { RegistrationRepository } from './repositories.ts';

/**
 * Registration is a property of the operator, not of a receipt: one registration covers
 * every receipt that operator handled on that trip (UJ-013, DR-050). The store is keyed by
 * the `[tripId, operatorId]` pair, so registering twice updates rather than duplicates.
 */
export const registrationRepository: RegistrationRepository = {
  async listByTrip(db, tripId) {
    const stored = await db.getAllFromIndex('registrations', 'by-trip', tripId);
    const registrations: OperatorRegistration[] = [];
    for (const record of stored) {
      const registration = normalizeRegistration(record);
      if (registration) registrations.push(registration);
    }
    return registrations;
  },

  async put(db, registration) {
    const next = normalizeRegistration(registration);
    if (!next) {
      throw new StorageError(
        'invalid-record',
        'A registration needs both a trip and an operator before it can be stored.',
      );
    }
    await db.put('registrations', next);
    return next;
  },
};
