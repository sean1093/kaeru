import { openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { StorageError } from './errors.ts';
import {
  migrations,
  pendingMigrations,
  runMigrations,
  type UpgradeTransaction,
} from './migrations.ts';
import { aTrip } from './test-builders.ts';
import { type KaeruDB, META_KEY, SCHEMA_VERSION } from './types.ts';

let dbName = '';
let counter = 0;

beforeEach(() => {
  counter += 1;
  dbName = `kaeru-test-${counter}`;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function open(): Promise<KaeruDatabase> {
  return openDatabase(dbName, fixedClock('2026-10-05T00:00:00Z'));
}

/** A device that last ran the v1 build, built through the released v1 migration itself. */
function openAtV1(): Promise<KaeruDatabase> {
  return openDB<KaeruDB>(dbName, 1, {
    upgrade(db, oldVersion, _newVersion, tx) {
      runMigrations(db, tx as UpgradeTransaction, oldVersion, 1);
      tx.objectStore('meta').put(
        { schemaVersion: 1, createdAt: '2026-02-03T04:05:06.000Z' },
        META_KEY,
      );
    },
  });
}

describe('pendingMigrations', () => {
  it('selects only the steps between the old and the new version', () => {
    expect(pendingMigrations(0, SCHEMA_VERSION).map((m) => m.version)).toEqual([1, 2]);
    expect(pendingMigrations(1, SCHEMA_VERSION).map((m) => m.version)).toEqual([2]);
    expect(pendingMigrations(SCHEMA_VERSION, SCHEMA_VERSION)).toEqual([]);
  });

  it('is append-only and strictly increasing, so a released step is never re-run', () => {
    const versions = migrations.map((m) => m.version);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(new Set(versions).size).toBe(versions.length);
    expect(versions.at(-1)).toBe(SCHEMA_VERSION);
  });
});

describe('opening the database', () => {
  it('creates every v2 store with the indexes the repositories read', async () => {
    const db = await open();
    expect([...db.objectStoreNames].sort()).toEqual([
      'meta',
      'photos',
      'receipts',
      'registrations',
      'settings',
      'travelers',
      'trips',
    ]);
    const tx = db.transaction(['receipts', 'travelers', 'registrations', 'photos'], 'readonly');
    expect([...tx.objectStore('receipts').indexNames].sort()).toEqual([
      'by-seq',
      'by-trip',
      'by-trip-date',
      'by-trip-shop',
      'by-trip-traveler',
    ]);
    expect([...tx.objectStore('travelers').indexNames].sort()).toEqual(['by-seq', 'by-trip']);
    expect([...tx.objectStore('registrations').indexNames]).toEqual(['by-trip']);
    expect([...tx.objectStore('photos').indexNames]).toEqual(['by-receipt']);
    await tx.done;
    expect(await db.get('meta', META_KEY)).toEqual({
      schemaVersion: SCHEMA_VERSION,
      createdAt: '2026-10-05T00:00:00.000Z',
    });
    db.close();
  });

  it('TC-DATA-004: upgrades a populated v1 device without losing a field', async () => {
    const v1 = await openAtV1();
    await v1.put('settings', { locale: 'zh-TW', theme: 'dark' }, 'app');
    v1.close();

    const db = await open();
    expect(await db.get('settings', 'app')).toEqual({ locale: 'zh-TW', theme: 'dark' });
    expect(await db.get('meta', META_KEY)).toEqual({
      schemaVersion: 2,
      // An upgrade is not a creation: the date the database was first made survives it.
      createdAt: '2026-02-03T04:05:06.000Z',
    });
    expect(db.objectStoreNames).toContain('receipts');
    db.close();
  });

  it('TC-DATA-004: is idempotent — a second open at the same version re-runs nothing', async () => {
    const first = await open();
    await first.put('trips', { ...aTrip(), seq: 1 });
    first.close();

    const second = await openDatabase(dbName, fixedClock('2027-01-01T00:00:00Z'));
    expect((await second.get('meta', META_KEY))?.createdAt).toBe('2026-10-05T00:00:00.000Z');
    expect(await second.count('trips')).toBe(1);
    second.close();
  });

  it('TC-DATA-005: refuses a database written by a newer build and deletes nothing', async () => {
    const current = await open();
    await current.put('trips', { ...aTrip(), seq: 1 });
    current.close();

    const future = await openDB<KaeruDB>(dbName, 99, { upgrade() {} });
    future.close();

    const failure = await open().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(StorageError);
    expect(failure).toMatchObject({ code: 'schema-too-new', foundVersion: 99 });

    const survivor = await openDB<KaeruDB>(dbName, 99, { upgrade() {} });
    expect(await survivor.count('trips')).toBe(1);
    expect([...survivor.objectStoreNames]).toContain('receipts');
    survivor.close();
  });

  it('TC-DATA-009: reports blocked storage as a storage error, not a DOMException', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const failure = await openDatabase(dbName).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(StorageError);
    expect(failure).toMatchObject({ code: 'unavailable' });
  });

  it('TC-DATA-006: an aborted transaction leaves no partial write', async () => {
    const db = await open();
    await db.put('trips', { ...aTrip({ id: 'trip-kept' }), seq: 1 });

    const tx = db.transaction('trips', 'readwrite');
    await tx.store.put({ ...aTrip({ id: 'trip-aborted' }), seq: 2 });
    tx.abort();
    await expect(tx.done).rejects.toThrow();

    expect(await db.getAllKeys('trips')).toEqual(['trip-kept']);
    db.close();
  });
});
