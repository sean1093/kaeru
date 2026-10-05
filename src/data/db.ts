import { type IDBPDatabase, openDB } from 'idb';
import type { Clock } from '../domain/index.ts';
import { systemClock } from '../domain/index.ts';
import { runMigrations } from './migrations.ts';
import { DB_NAME, type KaeruDB, META_KEY, SCHEMA_VERSION } from './types.ts';

export type KaeruDatabase = IDBPDatabase<KaeruDB>;

let instance: Promise<KaeruDatabase> | null = null;

/**
 * Open (and upgrade) a database. Repositories take a handle so they can run against a
 * throwaway instance in tests; the app uses the shared `getDatabase()`.
 */
export function openDatabase(
  name: string = DB_NAME,
  clock: Clock = systemClock,
): Promise<KaeruDatabase> {
  return openDB<KaeruDB>(name, SCHEMA_VERSION, {
    upgrade(db, oldVersion, newVersion, tx) {
      runMigrations(db, tx, oldVersion, newVersion ?? SCHEMA_VERSION);
      tx.objectStore('meta').put(
        { schemaVersion: SCHEMA_VERSION, createdAt: clock.now().toISOString() },
        META_KEY,
      );
    },
    blocking() {
      // Another tab is upgrading: release this handle so it is not stuck behind us.
      closeDatabase();
    },
  });
}

export function getDatabase(): Promise<KaeruDatabase> {
  instance ??= openDatabase();
  return instance;
}

/** Releases the shared handle; the next `getDatabase()` reopens. */
export function closeDatabase(): void {
  const open = instance;
  instance = null;
  void open?.then((database) => database.close());
}
