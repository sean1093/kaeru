import type { IDBPDatabase, IDBPTransaction } from 'idb';
import type { KaeruDB } from './types.ts';

export type UpgradeTransaction = IDBPTransaction<
  KaeruDB,
  readonly ('meta' | 'settings')[],
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
