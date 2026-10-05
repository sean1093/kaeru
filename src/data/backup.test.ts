import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { BackupError, exportBackup, importBackup, parseBackup } from './backup.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { loadSettings, saveSettings } from './settings-repository.ts';
import { SCHEMA_VERSION } from './types.ts';

const clock = fixedClock('2026-10-05T08:30:00Z');
let db: KaeruDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-backup-${counter}`, clock);
});

afterEach(() => {
  db.close();
});

describe('exportBackup', () => {
  it('stamps the file with the schema version it was written with', async () => {
    await saveSettings(db, { locale: 'en', theme: 'dark' });
    const backup = await exportBackup(db, clock);
    expect(backup).toEqual({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-10-05T08:30:00.000Z',
      settings: { locale: 'en', theme: 'dark' },
    });
  });
});

describe('export and import round trip', () => {
  it('restores the settings on a device that has none', async () => {
    await saveSettings(db, { locale: 'en', theme: 'light' });
    const file = JSON.stringify(await exportBackup(db, clock));

    const fresh = await openDatabase(`kaeru-backup-fresh-${counter}`, clock);
    await importBackup(fresh, parseBackup(file));
    expect(await loadSettings(fresh)).toEqual({ locale: 'en', theme: 'light' });
    fresh.close();
  });
});

describe('parseBackup', () => {
  it('refuses a backup written by a newer app', () => {
    const future = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION + 1,
      exportedAt: '2027-01-01T00:00:00.000Z',
      settings: { locale: 'en', theme: 'dark' },
    });
    expect(() => parseBackup(future)).toThrow(
      expect.objectContaining({ code: 'unsupported-version' }),
    );
  });

  it('rejects files that are not Kaeru backups', () => {
    expect(() => parseBackup('{')).toThrow(expect.objectContaining({ code: 'invalid-json' }));
    expect(() => parseBackup('"a string"')).toThrow(
      expect.objectContaining({ code: 'not-a-backup' }),
    );
    expect(() => parseBackup('{"format":"something-else"}')).toThrow(BackupError);
    expect(() => parseBackup('null')).toThrow(expect.objectContaining({ code: 'not-a-backup' }));
  });

  it('repairs a backup with corrupted settings instead of importing garbage', () => {
    const tampered = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: 1,
      exportedAt: '2026-10-05T00:00:00.000Z',
      settings: { locale: 'klingon', theme: 'neon' },
    });
    expect(parseBackup(tampered).settings).toEqual({ locale: 'zh-TW', theme: 'system' });
  });
});
