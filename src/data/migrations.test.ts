import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { migrations, pendingMigrations } from './migrations.ts';
import { META_KEY, SCHEMA_VERSION } from './types.ts';

let dbName = '';
let counter = 0;

beforeEach(() => {
  counter += 1;
  dbName = `kaeru-test-${counter}`;
});

function open(): Promise<KaeruDatabase> {
  return openDatabase(dbName, fixedClock('2026-10-05T00:00:00Z'));
}

describe('pendingMigrations', () => {
  it('selects only the steps between the old and the new version', () => {
    expect(pendingMigrations(0, SCHEMA_VERSION).map((m) => m.version)).toEqual([1]);
    expect(pendingMigrations(1, 1)).toEqual([]);
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
  it('creates the v1 stores and records the schema version', async () => {
    const db = await open();
    expect([...db.objectStoreNames].sort()).toEqual(['meta', 'settings']);
    expect(await db.get('meta', META_KEY)).toEqual({
      schemaVersion: SCHEMA_VERSION,
      createdAt: '2026-10-05T00:00:00.000Z',
    });
    db.close();
  });

  it('keeps stored data across a close and reopen', async () => {
    const first = await open();
    await first.put('settings', { locale: 'en', theme: 'dark' }, 'app');
    first.close();

    const second = await open();
    expect(await second.get('settings', 'app')).toEqual({ locale: 'en', theme: 'dark' });
    second.close();
  });

  it('does not run the upgrade again when the version is unchanged', async () => {
    const first = await open();
    await first.put('meta', { schemaVersion: SCHEMA_VERSION, createdAt: 'original' }, META_KEY);
    first.close();

    const second = await openDatabase(dbName, fixedClock('2027-01-01T00:00:00Z'));
    expect((await second.get('meta', META_KEY))?.createdAt).toBe('original');
    second.close();
  });
});
