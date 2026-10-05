import { type IDBPDatabase, openDB } from 'idb';
import type { Clock } from '../domain/index.ts';
import { systemClock } from '../domain/index.ts';
import { StorageError } from './errors.ts';
import { runMigrations } from './migrations.ts';
import { DB_NAME, type KaeruDB, META_KEY, SCHEMA_VERSION } from './types.ts';

export type KaeruDatabase = IDBPDatabase<KaeruDB>;

let instance: Promise<KaeruDatabase> | null = null;

async function describeOpenFailure(
  cause: unknown,
  factory: IDBFactory,
  name: string,
): Promise<StorageError> {
  // `DOMException` is not an `Error` subclass everywhere it matters, so go by the name.
  const failure =
    typeof cause === 'object' && cause !== null && 'name' in cause ? String(cause.name) : '';
  if (failure === 'VersionError') {
    // The device holds a database from a newer build. Downgrading would mean guessing what
    // a schema we have never seen meant, so we refuse and delete nothing (TC-DATA-005).
    const databases = factory.databases ? await factory.databases() : [];
    const found = databases.find((entry) => entry.name === name)?.version;
    return new StorageError(
      'schema-too-new',
      `The data on this device was written by a newer version of Kaeru (schema ${found ?? 'unknown'}).`,
      found === undefined ? { cause } : { cause, foundVersion: found },
    );
  }
  return new StorageError('unavailable', 'The database could not be opened.', { cause });
}

/**
 * Open (and upgrade) a database. Repositories take a handle so they can run against a
 * throwaway instance in tests; the app uses the shared `getDatabase()`.
 *
 * Rejects with a `StorageError` rather than a raw `DOMException`, because both failure
 * modes here — storage blocked, and a database from a newer build — are things the user
 * must be told about in their own language (TC-DATA-005, TC-DATA-009).
 */
export async function openDatabase(
  name: string = DB_NAME,
  clock: Clock = systemClock,
): Promise<KaeruDatabase> {
  let factory: IDBFactory | undefined;
  try {
    // Reading the property itself throws in a sandboxed frame with storage blocked.
    factory = globalThis.indexedDB;
  } catch {
    factory = undefined;
  }
  if (!factory) {
    throw new StorageError('unavailable', 'IndexedDB is not available in this browser context.');
  }

  try {
    return await openDB<KaeruDB>(name, SCHEMA_VERSION, {
      async upgrade(db, oldVersion, newVersion, tx) {
        runMigrations(db, tx, oldVersion, newVersion ?? SCHEMA_VERSION);
        const meta = tx.objectStore('meta');
        const existing = await meta.get(META_KEY);
        await meta.put(
          {
            schemaVersion: SCHEMA_VERSION,
            // An upgrade is not a creation: the original date is part of the record.
            createdAt: existing?.createdAt ?? clock.now().toISOString(),
          },
          META_KEY,
        );
      },
      blocking() {
        // Another tab is upgrading: release this handle so it is not stuck behind us.
        closeDatabase();
      },
    });
  } catch (cause) {
    throw await describeOpenFailure(cause, factory, name);
  }
}

export function getDatabase(): Promise<KaeruDatabase> {
  if (!instance) {
    const opening = openDatabase();
    instance = opening;
    // A failed open must not be cached: Private Browsing aside, the next attempt may be
    // after the user closed the other tab that was blocking us.
    opening.catch(() => {
      if (instance === opening) instance = null;
    });
  }
  return instance;
}

/** Releases the shared handle; the next `getDatabase()` reopens. */
export function closeDatabase(): void {
  const open = instance;
  instance = null;
  void open?.then(
    (database) => database.close(),
    () => undefined,
  );
}
