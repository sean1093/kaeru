import type { Trip, TripId } from '../domain/model.ts';
import type { KaeruDatabase } from './db.ts';
import { StorageError } from './errors.ts';
import { normalizeTrip } from './normalize.ts';
import type { TripRepository } from './repositories.ts';
import { nextSequence } from './transaction.ts';
import { type StoredTrip, TRIP_OWNED_STORES } from './types.ts';

/**
 * Most recent trip first. Departure date is what the traveler thinks of as "which trip",
 * and `seq` breaks a tie between two trips leaving the same day in favour of the one
 * added later — the one they were just setting up.
 */
function byDepartureThenAdded(a: StoredTrip, b: StoredTrip): number {
  if (a.departureDate !== b.departureDate) return a.departureDate < b.departureDate ? 1 : -1;
  return b.seq - a.seq;
}

async function readTrips(
  db: KaeruDatabase,
  includeArchived: boolean,
): Promise<readonly StoredTrip[]> {
  const stored = await db.getAllFromIndex('trips', 'by-seq');
  return stored
    .filter((trip) => includeArchived || trip.archived !== true)
    .sort(byDepartureThenAdded);
}

function readable(stored: readonly StoredTrip[]): readonly Trip[] {
  const trips: Trip[] = [];
  for (const record of stored) {
    const trip = normalizeTrip(record);
    if (trip) trips.push(trip);
  }
  return trips;
}

export const tripRepository: TripRepository = {
  async get(db, id) {
    return normalizeTrip(await db.get('trips', id)) ?? undefined;
  },

  async list(db, options) {
    return readable(await readTrips(db, options?.includeArchived === true));
  },

  /**
   * The current trip is the live one with the latest departure: a traveler plans the next
   * trip while the last is still on file, and archiving the old one is optional. Null until
   * onboarding has created a trip.
   */
  async current(db) {
    return readable(await readTrips(db, false))[0] ?? null;
  },

  async put(db, trip) {
    const next = normalizeTrip(trip);
    if (!next) {
      throw new StorageError(
        'invalid-record',
        'A trip needs an id and a valid departure date before it can be stored.',
      );
    }
    const tx = db.transaction('trips', 'readwrite');
    const store = tx.objectStore('trips');
    const existing = await store.get(next.id);
    // An update keeps its place in the list; only a genuinely new trip takes a number.
    const seq = existing?.seq ?? (await nextSequence(store.index('by-seq')));
    await store.put({ ...next, seq });
    await tx.done;
    return next;
  },

  /** Idempotent, and a no-op for a trip that is not there — archiving is not a delete. */
  async archive(db, id, archived) {
    const tx = db.transaction('trips', 'readwrite');
    const store = tx.objectStore('trips');
    const existing = await store.get(id);
    if (existing && existing.archived !== archived) {
      await store.put({ ...existing, archived });
    }
    await tx.done;
  },

  /**
   * One transaction over every store a trip owns, so a delete that fails half way leaves
   * the trip whole rather than a set of orphaned receipts (TC-DATA-006).
   */
  async remove(db, id: TripId) {
    const tx = db.transaction(TRIP_OWNED_STORES, 'readwrite');
    const receipts = tx.objectStore('receipts');
    const photos = tx.objectStore('photos');

    for (const receiptId of await receipts.index('by-trip').getAllKeys(id)) {
      for (const photoId of await photos.index('by-receipt').getAllKeys(receiptId)) {
        await photos.delete(photoId);
      }
      await receipts.delete(receiptId);
    }

    const travelers = tx.objectStore('travelers');
    for (const travelerId of await travelers.index('by-trip').getAllKeys(id)) {
      await travelers.delete(travelerId);
    }

    const registrations = tx.objectStore('registrations');
    for (const key of await registrations.index('by-trip').getAllKeys(id)) {
      await registrations.delete(key);
    }

    await tx.objectStore('trips').delete(id);
    await tx.done;
  },
};
