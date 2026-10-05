import type { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import type { KaeruDB } from './types.ts';

export type UpgradeTransaction = IDBPTransaction<
  KaeruDB,
  readonly StoreNames<KaeruDB>[],
  'versionchange'
>;

export interface Migration {
  readonly version: number;
  /**
   * Runs inside the `versionchange` transaction. Create or reshape stores here only;
   * anything async beyond the transaction will abort the upgrade.
   */
  upgrade(db: IDBPDatabase<KaeruDB>, tx: UpgradeTransaction): void;
}

/**
 * Append-only list, ordered by version. A released migration is never edited: a
 * browser that already ran it will not run it again.
 */
export const migrations: readonly Migration[] = [
  {
    version: 1,
    upgrade(db) {
      db.createObjectStore('meta');
      db.createObjectStore('settings');
    },
  },
  {
    /**
     * The real model. Every store is new, so this step only creates — it reads nothing and
     * rewrites nothing, which is why a populated v1 device upgrades without risk.
     */
    version: 2,
    upgrade(db) {
      const trips = db.createObjectStore('trips', { keyPath: 'id' });
      trips.createIndex('by-seq', 'seq');

      const travelers = db.createObjectStore('travelers', { keyPath: 'id' });
      travelers.createIndex('by-trip', 'tripId');
      travelers.createIndex('by-seq', 'seq');

      const receipts = db.createObjectStore('receipts', { keyPath: 'id' });
      receipts.createIndex('by-trip', 'tripId');
      // The compound indexes are what let the list screen and the airport flow read one
      // traveller, one shop or one day without scanning the trip.
      receipts.createIndex('by-trip-traveler', ['tripId', 'travelerId']);
      receipts.createIndex('by-trip-date', ['tripId', 'purchaseDate']);
      receipts.createIndex('by-trip-shop', ['tripId', 'shopKey']);
      receipts.createIndex('by-seq', 'seq');

      // Registration is per operator per trip (UJ-013, DR-050), so that pair is the key.
      const registrations = db.createObjectStore('registrations', {
        keyPath: ['tripId', 'operatorId'],
      });
      registrations.createIndex('by-trip', 'tripId');

      const photos = db.createObjectStore('photos', { keyPath: 'id' });
      photos.createIndex('by-receipt', 'receiptId');
    },
  },
];

/** The migrations an upgrade from `oldVersion` to `newVersion` must apply, in order. */
export function pendingMigrations(oldVersion: number, newVersion: number): readonly Migration[] {
  return migrations.filter((m) => m.version > oldVersion && m.version <= newVersion);
}

export function runMigrations(
  db: IDBPDatabase<KaeruDB>,
  tx: UpgradeTransaction,
  oldVersion: number,
  newVersion: number,
): void {
  for (const migration of pendingMigrations(oldVersion, newVersion)) {
    migration.upgrade(db, tx);
  }
}
