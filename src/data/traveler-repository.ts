import type { Traveler } from '../domain/model.ts';
import { StorageError } from './errors.ts';
import { normalizeTraveler } from './normalize.ts';
import type { TravelerRepository } from './repositories.ts';
import { abortTransaction, nextSequence } from './transaction.ts';

export const travelerRepository: TravelerRepository = {
  /** Insertion order: the list is "me, then the people I am travelling with". */
  async listByTrip(db, tripId) {
    const stored = await db.getAllFromIndex('travelers', 'by-trip', tripId);
    const travelers: Traveler[] = [];
    for (const record of [...stored].sort((a, b) => a.seq - b.seq)) {
      const traveler = normalizeTraveler(record);
      if (traveler) travelers.push(traveler);
    }
    return travelers;
  },

  async put(db, traveler) {
    const next = normalizeTraveler(traveler);
    if (!next) {
      throw new StorageError(
        'invalid-record',
        'A traveler needs an id and a trip before they can be stored.',
      );
    }
    const tx = db.transaction('travelers', 'readwrite');
    const store = tx.objectStore('travelers');
    const existing = await store.get(next.id);
    const seq = existing?.seq ?? (await nextSequence(store.index('by-seq')));
    await store.put({ ...next, seq });
    await tx.done;
    return next;
  },

  /**
   * Deleting a traveler never orphans a receipt: either they own none, or the caller says
   * who takes them over. Everything is read and checked before anything is written, so a
   * refusal writes nothing at all.
   */
  async remove(db, id, reassignTo) {
    const tx = db.transaction(['travelers', 'receipts'], 'readwrite');
    const travelers = tx.objectStore('travelers');
    const receipts = tx.objectStore('receipts');

    const existing = await travelers.get(id);
    if (!existing) {
      await tx.done;
      return;
    }

    const owned = await receipts.index('by-trip-traveler').getAllKeys([existing.tripId, id]);
    if (owned.length > 0) {
      if (reassignTo === null) {
        await abortTransaction(tx);
        throw new StorageError(
          'reassignment-required',
          `Traveler ${id} still owns ${owned.length} receipt(s); say who they move to.`,
        );
      }
      if (reassignTo === id) {
        await abortTransaction(tx);
        throw new StorageError('invalid-record', 'A traveler cannot inherit their own receipts.');
      }
      const target = await travelers.get(reassignTo);
      if (!target || target.tripId !== existing.tripId) {
        await abortTransaction(tx);
        throw new StorageError(
          'not-found',
          `Traveler ${reassignTo} is not on trip ${existing.tripId}.`,
        );
      }
      for (const receiptId of owned) {
        const receipt = await receipts.get(receiptId);
        if (receipt) await receipts.put({ ...receipt, travelerId: reassignTo });
      }
    }

    await travelers.delete(id);
    await tx.done;
  },
};
