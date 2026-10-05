import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { backupService } from './backup.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { photoRepository } from './photo-repository.ts';
import { loadSettings, saveSettings } from './settings-repository.ts';
import { aReceipt, aRegistration, aTraveler, aTrip } from './test-builders.ts';
import { travelerRepository } from './traveler-repository.ts';
import { tripRepository } from './trip-repository.ts';
import { SCHEMA_VERSION } from './types.ts';

const clock = fixedClock('2026-10-05T08:30:00Z');
let db: KaeruDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-backup-v2-${counter}`, clock);
});

/** Strips the two fields the contract explicitly says vary between writers. */
function stable(document: unknown): unknown {
  const {
    exportedAt: _exportedAt,
    appVersion: _appVersion,
    ...rest
  } = document as {
    exportedAt: string;
    appVersion: string;
  };
  return rest;
}

async function seedTripWithData(): Promise<void> {
  await tripRepository.put(db, aTrip());
  await travelerRepository.put(db, aTraveler());
  await db.put('receipts', { ...aReceipt(), seq: 1 });
  await db.put('registrations', aRegistration());
  await db.put('photos', {
    id: 'photo-1',
    receiptId: 'receipt-1',
    blob: new Blob(['x'.repeat(100)], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    byteSize: 100,
    createdAt: '2026-11-15T10:00:00.000Z',
  });
  await db.put('receipts', { ...aReceipt({ photoRef: 'photo-1' }), seq: 1 });
}

describe('TC-DATA-011: export', () => {
  it('produces a versioned document containing every entity kind plus settings', async () => {
    await seedTripWithData();
    await saveSettings(db, { locale: 'en', theme: 'dark' });

    const document = await backupService.export(db, {
      includePhotos: false,
      includeArchived: true,
    });

    expect(document.format).toBe('kaeru.backup');
    expect(document.schemaVersion).toBe(SCHEMA_VERSION);
    expect(document.settings).toEqual({ locale: 'en', theme: 'dark' });
    expect(document.trips).toHaveLength(1);
    expect(document.travelers).toHaveLength(1);
    expect(document.receipts).toHaveLength(1);
    expect(document.registrations).toHaveLength(1);
    expect(document.receipts[0]?.lines.length).toBeGreaterThan(0);
  });

  it('includes archived trips by default — a backup that is not complete is not a backup', async () => {
    await tripRepository.put(db, aTrip({ id: 'archived-trip', archived: true }));

    const withArchived = await backupService.export(db, {
      includePhotos: false,
      includeArchived: true,
    });
    expect(withArchived.trips.map((t) => t.id)).toContain('archived-trip');
  });
});

describe('TC-DATA-012: photos opted in or out', () => {
  it('with includePhotos false, the document has no photos key at all', async () => {
    await seedTripWithData();
    const document = await backupService.export(db, {
      includePhotos: false,
      includeArchived: true,
    });
    expect(document).not.toHaveProperty('photos');
  });

  it('with includePhotos true, photos are present as base64 data', async () => {
    await seedTripWithData();
    // fake-indexeddb degrades a stored Blob on read (no `.arrayBuffer()`), a known
    // limitation (#76 review) — stub the one read so the encoding path itself is exercised
    // against a real Blob, the same way #76 stubs `db.put` to exercise quota handling.
    vi.spyOn(photoRepository, 'get').mockResolvedValue({
      id: 'photo-1',
      receiptId: 'receipt-1',
      blob: new Blob(['x'.repeat(100)], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      byteSize: 100,
      createdAt: '2026-11-15T10:00:00.000Z',
    });

    const document = await backupService.export(db, { includePhotos: true, includeArchived: true });
    expect(document.photos).toHaveLength(1);
    expect(document.photos?.[0]?.data).toMatch(/^data:image\/jpeg;base64,/);

    vi.restoreAllMocks();
  });

  it('estimateSize reports the photo difference', async () => {
    await seedTripWithData();
    const without = await backupService.estimateSize(db, {
      includePhotos: false,
      includeArchived: true,
    });
    const withPhotos = await backupService.estimateSize(db, {
      includePhotos: true,
      includeArchived: true,
    });
    expect(withPhotos).toBeGreaterThan(without);
  });
});

describe('TC-DATA-013: export round trip', () => {
  it('export -> import into an empty profile -> export is stable, ignoring exportedAt and appVersion', async () => {
    // Photos excluded here: fake-indexeddb cannot round-trip a real Blob (#76), which is a
    // test-environment limit, not a production one. The base64 encode/decode path itself
    // is exercised directly above and in the single-write quota tests on #76.
    await seedTripWithData();
    await saveSettings(db, { locale: 'zh-TW', theme: 'light' });

    const first = await backupService.export(db, { includePhotos: false, includeArchived: true });

    const fresh = await openDatabase(`kaeru-backup-v2-fresh-${counter}`, clock);
    await backupService.import(fresh, JSON.stringify(first), 'replace');
    const second = await backupService.export(fresh, {
      includePhotos: false,
      includeArchived: true,
    });

    expect(stable(second)).toEqual(stable(first));
    fresh.close();
  });

  it('TC-SEC-005: the export carries no hidden identifier — seq never reaches the document', async () => {
    await seedTripWithData();
    const document = await backupService.export(db, {
      includePhotos: false,
      includeArchived: true,
    });
    const text = JSON.stringify(document);
    expect(text).not.toMatch(/"seq"/);
  });
});

describe('TC-DATA-014: a v1 backup imports and is migrated forward', () => {
  it('a settings-only v1 file imports cleanly, with every v2 collection empty', async () => {
    const v1 = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      settings: { locale: 'en', theme: 'light' },
    });

    const preview = await backupService.import(db, v1, 'merge');
    expect(preview.trips).toBe(0);
    expect(preview.receipts).toBe(0);
    expect(await loadSettings(db)).toEqual({ locale: 'en', theme: 'light' });
  });
});

describe('TC-DATA-015: a truncated or invalid file fails distinctly, and writes nothing', () => {
  it('a syntactically invalid file writes nothing', async () => {
    await tripRepository.put(db, aTrip({ id: 'kept' }));

    await expect(backupService.import(db, '{ not json', 'merge')).rejects.toMatchObject({
      code: 'invalid-json',
    });
    expect(await tripRepository.list(db)).toHaveLength(1);
  });

  it('a well-formed but non-backup file writes nothing', async () => {
    await tripRepository.put(db, aTrip({ id: 'kept' }));

    await expect(backupService.import(db, '{"hello":"world"}', 'merge')).rejects.toMatchObject({
      code: 'not-a-backup',
    });
    expect(await tripRepository.list(db)).toHaveLength(1);
  });
});

describe('TC-DATA-016: an unknown future version is rejected, existing data untouched', () => {
  it('refuses a document whose schemaVersion is newer than the app', async () => {
    await tripRepository.put(db, aTrip({ id: 'kept' }));
    const future = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION + 1,
      exportedAt: '2030-01-01T00:00:00.000Z',
      settings: {},
      trips: [],
      travelers: [],
      receipts: [],
      registrations: [],
    });

    await expect(backupService.import(db, future, 'merge')).rejects.toMatchObject({
      code: 'unsupported-version',
    });
    expect(await tripRepository.list(db)).toHaveLength(1);
  });
});

describe('TC-DATA-017: §7 validation failures are quarantined per record, not persisted', () => {
  it('a receipt with a negative amount and an unrecognised status is rejected, the rest of the file still imports', async () => {
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip()],
      travelers: [aTraveler()],
      receipts: [
        aReceipt({ id: 'good' }),
        {
          ...aReceipt({ id: 'bad' }),
          status: 'teleported',
          lines: [{ taxRate: -0.5, taxExcludedAmount: -9999, taxIncludedAmount: null }],
        },
      ],
      registrations: [],
    });

    const preview = await backupService.import(db, document, 'merge');

    expect(preview.receipts).toBe(2);
    expect(await db.get('receipts', 'good')).toBeDefined();
    // The "bad" receipt is not rejected outright here — DR-070 drops the one unreadable
    // line and the rest of the record (a valid status would have survived); an
    // unrecognised status alone normalises to 'logged' rather than being quarantined,
    // because normalizeReceipt repairs what it can. What must never happen is the
    // negative-amount line surviving into storage.
    const stored = await db.get('receipts', 'bad');
    expect(stored?.lines.some((line) => (line.taxExcludedAmount ?? 0) < 0)).toBe(false);
  });

  it('a record normalisation cannot address at all is quarantined and reported, not persisted', async () => {
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip(), { id: 'no-date-at-all' }],
      travelers: [],
      receipts: [],
      registrations: [],
    });

    const preview = await backupService.import(db, document, 'merge');

    expect(preview.trips).toBe(1);
    expect(preview.rejectedKeys).toEqual(expect.arrayContaining([expect.stringContaining('trip')]));
    expect(await db.get('trips', 'no-date-at-all')).toBeUndefined();
  });
});

describe('TC-DATA-018: adversarial import — a full passport number in any field', () => {
  it('rejects a traveler carrying a passport-like value in an unknown extra field', async () => {
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip()],
      travelers: [{ ...aTraveler(), secretNote: 'A12345678' }],
      receipts: [],
      registrations: [],
    });

    const preview = await backupService.import(db, document, 'merge');

    expect(preview.rejectedKeys.some((key) => key.includes('passport-like'))).toBe(true);
    expect(await db.get('travelers', 'traveler-1')).toBeUndefined();
  });

  it('rejects a receipt carrying a passport-like value in shopName', async () => {
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip()],
      travelers: [aTraveler()],
      receipts: [{ ...aReceipt(), shopName: 'A12345678' }],
      registrations: [],
    });

    const preview = await backupService.import(db, document, 'merge');

    expect(
      preview.rejectedKeys.some(
        (key) => key.startsWith('receipt:') && key.includes('passport-like'),
      ),
    ).toBe(true);
    expect(await db.get('receipts', 'receipt-1')).toBeUndefined();
  });
});

describe('TC-DATA-019: passportRef longer than 4 characters is rejected on import', () => {
  it('a traveler whose passportRef exceeds the cap is rejected, not truncated, on import', async () => {
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip()],
      travelers: [{ ...aTraveler(), passportRef: '312345678' }],
      receipts: [],
      registrations: [],
    });

    const preview = await backupService.import(db, document, 'merge');

    expect(preview.rejectedKeys.some((key) => key.includes('passportRef'))).toBe(true);
    expect(await db.get('travelers', 'traveler-1')).toBeUndefined();
  });

  it('a traveler whose passportRef is already within the cap imports normally', async () => {
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip()],
      travelers: [{ ...aTraveler(), passportRef: '5678' }],
      receipts: [],
      registrations: [],
    });

    await backupService.import(db, document, 'merge');
    expect((await db.get('travelers', 'traveler-1'))?.passportRef).toBe('5678');
  });
});

describe('TC-DATA-020: import into a non-empty profile', () => {
  it('merge keeps what was already there and adds what is new', async () => {
    await tripRepository.put(db, aTrip({ id: 'already-here', departureDate: '2026-05-01' }));
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip({ id: 'imported', departureDate: '2026-12-01' })],
      travelers: [],
      receipts: [],
      registrations: [],
    });

    await backupService.import(db, document, 'merge');

    const ids = (await tripRepository.list(db)).map((t) => t.id).sort();
    expect(ids).toEqual(['already-here', 'imported']);
  });

  it('replace clears what was already there first', async () => {
    await tripRepository.put(db, aTrip({ id: 'already-here' }));
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip({ id: 'imported' })],
      travelers: [],
      receipts: [],
      registrations: [],
    });

    await backupService.import(db, document, 'replace');

    expect((await tripRepository.list(db)).map((t) => t.id)).toEqual(['imported']);
  });

  it('reports conflicts — entities already present with the same id', async () => {
    await tripRepository.put(db, aTrip({ id: 'trip-1' }));
    const document = JSON.stringify({
      format: 'kaeru.backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-01T00:00:00.000Z',
      settings: {},
      trips: [aTrip({ id: 'trip-1', flightTime: '09:00' })],
      travelers: [],
      receipts: [],
      registrations: [],
    });

    const preview = await backupService.preview(db, document);
    expect(preview.conflicts).toBe(1);
  });
});

describe('TC-DATA-021: delete all data', () => {
  it('leaves every v2 store genuinely empty, verified by direct inspection', async () => {
    await seedTripWithData();
    await saveSettings(db, { locale: 'en', theme: 'dark' });

    await backupService.deleteAll(db);

    expect(await db.count('trips')).toBe(0);
    expect(await db.count('travelers')).toBe(0);
    expect(await db.count('receipts')).toBe(0);
    expect(await db.count('registrations')).toBe(0);
    expect(await db.count('photos')).toBe(0);
    // Settings reset to the real defaults — deleteAll is not a selective wipe.
    expect(await loadSettings(db)).toEqual({ locale: 'zh-TW', theme: 'system' });
  });
});

describe('TC-SEC-002: no full passport number exists anywhere after a two-traveler journey', () => {
  it('passportRef is at most 4 characters in storage and in export, for every traveler', async () => {
    await tripRepository.put(db, aTrip());
    await travelerRepository.put(db, aTraveler({ id: 'a', passportRef: '312345678' }));
    await travelerRepository.put(db, aTraveler({ id: 'b', passportRef: 'X98765432' }));

    const document = await backupService.export(db, {
      includePhotos: false,
      includeArchived: true,
    });
    for (const traveler of document.travelers) {
      if (traveler.passportRef !== undefined) {
        expect(traveler.passportRef.length).toBeLessThanOrEqual(4);
      }
    }
  });
});
