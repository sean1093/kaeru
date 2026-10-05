/**
 * Backup v2 — export, preview, import, delete all.
 *
 * Export/import is the only way data leaves the device (DR-040, DR-043). Every function
 * here either writes nothing (export, preview) or validates everything before writing
 * anything (import), because a backup that can half-write is worse than no backup.
 */
import packageJson from '../../package.json' with { type: 'json' };
import type { Clock } from '../domain/index.ts';
import type {
  OperatorRegistration,
  PhotoId,
  Receipt,
  ReceiptId,
  Traveler,
  Trip,
} from '../domain/model.ts';
import type { KaeruDatabase } from './db.ts';
import {
  normalizeReceipt,
  normalizeRegistration,
  normalizeTraveler,
  normalizeTrip,
  PASSPORT_REF_MAX_LENGTH,
} from './normalize.ts';
import { photoRepository } from './photo-repository.ts';
import { receiptRepository } from './receipt-repository.ts';
import { registrationRepository } from './registration-repository.ts';
import type {
  BackupDocumentV2,
  BackupOptions,
  BackupService,
  ImportMode,
  ImportPreview,
} from './repositories.ts';
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings } from './settings-repository.ts';
import { abortTransaction, nextSequence } from './transaction.ts';
import { travelerRepository } from './traveler-repository.ts';
import { tripRepository } from './trip-repository.ts';
import { type AppSettings, SCHEMA_VERSION, SETTINGS_KEY } from './types.ts';

export const BACKUP_FORMAT = 'kaeru.backup';
export const APP_VERSION: string = packageJson.version;

// --- Errors -----------------------------------------------------------------

export type BackupErrorCode = 'not-a-backup' | 'unsupported-version' | 'invalid-json';

export class BackupError extends Error {
  readonly code: BackupErrorCode;

  constructor(message: string, code: BackupErrorCode) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
  }
}

// --- v1 compatibility (kept so an old export still reads) -------------------

/** The v1 shape: settings only. A v1 file imports and is migrated forward (TC-DATA-014). */
export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  settings: AppSettings;
}

// --- Passport-number heuristic (DR-041, DR-043, TC-DATA-018) ----------------

/**
 * "Looks like a full passport number" has no fixed format in the domain rules — passports
 * vary 6-9 characters across issuing countries — so this is deliberately a heuristic, not a
 * checksum. An alphanumeric run of 6-9 characters containing at least one digit catches a
 * Taiwan passport (9 digits) and the common letter-prefixed formats, while requiring a
 * digit excludes a short alphabetic token like an operator id (`tourego`, `wamazing`).
 * False positives on free text are an accepted trade-off against the alternative, which is
 * missing a real one (R17).
 */
const PASSPORT_LIKE = /^[A-Za-z0-9]{6,9}$/;

function looksLikePassportNumber(value: string): boolean {
  return PASSPORT_LIKE.test(value) && /\d/.test(value);
}

/**
 * Walks an arbitrary parsed JSON value — including a field no normaliser recognises — and
 * reports every string leaf that looks like a full passport number. `excludePaths` lets the
 * caller carve out the one field that is allowed to hold a passport fragment
 * (`Traveler.passportRef`, already capped separately); everywhere else, in every entity,
 * is in scope (TC-DATA-018: "including an unknown extra field").
 */
function findPassportLikeValues(
  value: unknown,
  path: string,
  excludePaths: ReadonlySet<string>,
): string[] {
  if (excludePaths.has(path)) return [];
  if (typeof value === 'string') {
    return looksLikePassportNumber(value) ? [path] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      findPassportLikeValues(entry, `${path}[${index}]`, excludePaths),
    );
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, entry]) =>
      findPassportLikeValues(entry, path === '' ? key : `${path}.${key}`, excludePaths),
    );
  }
  return [];
}

/**
 * Best-effort id for a record that failed to normalise at all, so a rejection reads
 * `receipt:r-1 (unreadable)` rather than `receipt (unreadable)` — the difference between a
 * user being able to find the record in their own backup file and not (QA review, #93).
 */
function rawIdOf(entry: unknown): string | null {
  const id = (entry as { id?: unknown } | null)?.id;
  return typeof id === 'string' && id.trim() !== '' ? id.trim() : null;
}

// --- Raw document shape (what `JSON.parse` can hand back) -------------------

interface RawDocument {
  format?: unknown;
  schemaVersion?: unknown;
  exportedAt?: unknown;
  appVersion?: unknown;
  settings?: unknown;
  trips?: unknown;
  travelers?: unknown;
  receipts?: unknown;
  registrations?: unknown;
  photos?: unknown;
}

function parseDocument(text: string): RawDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('The file is not valid JSON.', 'invalid-json');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new BackupError('The file is not a Kaeru backup.', 'not-a-backup');
  }
  const candidate = parsed as RawDocument;
  if (candidate.format !== BACKUP_FORMAT || typeof candidate.schemaVersion !== 'number') {
    throw new BackupError('The file is not a Kaeru backup.', 'not-a-backup');
  }
  if (candidate.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError(
      `The backup was written by a newer version of Kaeru (schema ${candidate.schemaVersion}).`,
      'unsupported-version',
    );
  }
  return candidate;
}

// --- Per-record validation, folding structural and security checks together --

interface ValidatedDocument {
  schemaVersion: number;
  exportedAt: string;
  settings: AppSettings;
  trips: Trip[];
  travelers: Traveler[];
  receipts: Receipt[];
  registrations: OperatorRegistration[];
  photos: readonly { id: PhotoId; receiptId: ReceiptId; mimeType: string; data: string }[];
  rejectedKeys: string[];
}

const TRAVELER_PASSPORT_REF_EXCLUDE = new Set(['passportRef']);

function validateTravelers(raw: unknown, rejectedKeys: string[]): Traveler[] {
  if (!Array.isArray(raw)) return [];
  const travelers: Traveler[] = [];
  for (const entry of raw) {
    const traveler = normalizeTraveler(entry);
    if (!traveler) {
      rejectedKeys.push(`traveler:${rawIdOf(entry) ?? 'unknown'} (unreadable)`);
      continue;
    }
    // A passportRef over the cap is rejected outright on import, not truncated: an import
    // file is untrusted input, and the conservative read of DR-041 is that no import path
    // ever even transiently represents more than the cap, let alone writes it.
    const rawPassportRef = (entry as { passportRef?: unknown }).passportRef;
    if (
      typeof rawPassportRef === 'string' &&
      rawPassportRef.trim().length > PASSPORT_REF_MAX_LENGTH
    ) {
      rejectedKeys.push(
        `traveler:${traveler.id} (passportRef longer than ${PASSPORT_REF_MAX_LENGTH} characters)`,
      );
      continue;
    }
    const findings = findPassportLikeValues(entry, '', TRAVELER_PASSPORT_REF_EXCLUDE);
    if (findings.length > 0) {
      rejectedKeys.push(`traveler:${traveler.id} (passport-like value in ${findings.join(', ')})`);
      continue;
    }
    travelers.push(traveler);
  }
  return travelers;
}

function validateEntities<T extends { id: string }>(
  raw: unknown,
  normalize: (value: unknown) => T | null,
  kind: string,
  rejectedKeys: string[],
): T[] {
  if (!Array.isArray(raw)) return [];
  const entities: T[] = [];
  for (const entry of raw) {
    const entity = normalize(entry);
    if (!entity) {
      rejectedKeys.push(`${kind}:${rawIdOf(entry) ?? 'unknown'} (unreadable)`);
      continue;
    }
    const findings = findPassportLikeValues(entry, '', new Set());
    if (findings.length > 0) {
      rejectedKeys.push(`${kind}:${entity.id} (passport-like value in ${findings.join(', ')})`);
      continue;
    }
    entities.push(entity);
  }
  return entities;
}

function validateRegistrations(raw: unknown, rejectedKeys: string[]): OperatorRegistration[] {
  if (!Array.isArray(raw)) return [];
  const registrations: OperatorRegistration[] = [];
  for (const entry of raw) {
    const registration = normalizeRegistration(entry);
    if (!registration) {
      const rawTripId = (entry as { tripId?: unknown } | null)?.tripId;
      const rawOperatorId = (entry as { operatorId?: unknown } | null)?.operatorId;
      rejectedKeys.push(
        `registration:${typeof rawTripId === 'string' ? rawTripId : 'unknown'}/${typeof rawOperatorId === 'string' ? rawOperatorId : 'unknown'} (unreadable)`,
      );
      continue;
    }
    const findings = findPassportLikeValues(entry, '', new Set());
    if (findings.length > 0) {
      rejectedKeys.push(
        `registration:${registration.tripId}/${registration.operatorId} (passport-like value in ${findings.join(', ')})`,
      );
      continue;
    }
    registrations.push(registration);
  }
  return registrations;
}

function validatePhotos(
  raw: unknown,
): readonly { id: PhotoId; receiptId: ReceiptId; mimeType: string; data: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is { id: PhotoId; receiptId: ReceiptId; mimeType: string; data: string } =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as { id?: unknown }).id === 'string' &&
      typeof (entry as { receiptId?: unknown }).receiptId === 'string' &&
      typeof (entry as { mimeType?: unknown }).mimeType === 'string' &&
      typeof (entry as { data?: unknown }).data === 'string',
  );
}

function validateDocument(doc: RawDocument): ValidatedDocument {
  const rejectedKeys: string[] = [];
  return {
    schemaVersion: doc.schemaVersion as number,
    exportedAt: typeof doc.exportedAt === 'string' ? doc.exportedAt : '',
    settings: normalizeSettings(doc.settings, DEFAULT_SETTINGS),
    trips: validateEntities(doc.trips, normalizeTrip, 'trip', rejectedKeys),
    travelers: validateTravelers(doc.travelers, rejectedKeys),
    receipts: validateEntities(doc.receipts, normalizeReceipt, 'receipt', rejectedKeys),
    registrations: validateRegistrations(doc.registrations, rejectedKeys),
    photos: validatePhotos(doc.photos),
    rejectedKeys,
  };
}

// --- Conflict counting --------------------------------------------------------

async function countConflicts(db: KaeruDatabase, validated: ValidatedDocument): Promise<number> {
  let conflicts = 0;
  for (const trip of validated.trips) if (await db.get('trips', trip.id)) conflicts += 1;
  for (const traveler of validated.travelers)
    if (await db.get('travelers', traveler.id)) conflicts += 1;
  for (const receipt of validated.receipts)
    if (await db.get('receipts', receipt.id)) conflicts += 1;
  for (const registration of validated.registrations) {
    if (await db.get('registrations', [registration.tripId, registration.operatorId]))
      conflicts += 1;
  }
  return conflicts;
}

function toPreview(validated: ValidatedDocument): ImportPreview {
  return {
    schemaVersion: validated.schemaVersion,
    exportedAt: validated.exportedAt,
    trips: validated.trips.length,
    receipts: validated.receipts.length,
    photos: validated.photos.length,
    conflicts: 0,
    rejectedKeys: validated.rejectedKeys,
  };
}

// --- Photo encoding -----------------------------------------------------------

async function blobToDataUrl(blob: Blob, mimeType: string): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.includes(',') ? (dataUrl.split(',')[1] ?? '') : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** Base64 inflates by roughly 4/3 — the estimate the UI shows before the user opts in. */
const BASE64_OVERHEAD = 4 / 3;

// --- The service ---------------------------------------------------------------

async function collectTripScopedData(
  db: KaeruDatabase,
  trips: readonly Trip[],
): Promise<{
  travelers: Traveler[];
  receipts: Receipt[];
  registrations: OperatorRegistration[];
}> {
  const travelers: Traveler[] = [];
  const receipts: Receipt[] = [];
  const registrations: OperatorRegistration[] = [];
  for (const trip of trips) {
    travelers.push(...(await travelerRepository.listByTrip(db, trip.id)));
    receipts.push(...(await receiptRepository.list(db, { tripId: trip.id })));
    registrations.push(...(await registrationRepository.listByTrip(db, trip.id)));
  }
  return { travelers, receipts, registrations };
}

async function buildDocument(
  db: KaeruDatabase,
  options: BackupOptions,
  clock: Clock,
): Promise<BackupDocumentV2> {
  const trips = await tripRepository.list(db, { includeArchived: options.includeArchived });
  const { travelers, receipts, registrations } = await collectTripScopedData(db, trips);

  const document: BackupDocumentV2 = {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: clock.now().toISOString(),
    appVersion: APP_VERSION,
    settings: await loadSettings(db),
    trips,
    travelers,
    receipts,
    registrations,
  };

  if (!options.includePhotos) return document;

  const photoRefs = receipts
    .map((receipt) => receipt.photoRef)
    .filter((ref): ref is PhotoId => ref !== undefined);
  const photos: { id: PhotoId; receiptId: ReceiptId; mimeType: string; data: string }[] = [];
  for (const id of photoRefs) {
    const stored = await photoRepository.get(db, id);
    if (!stored) continue;
    photos.push({
      id: stored.id,
      receiptId: stored.receiptId,
      mimeType: stored.mimeType,
      data: await blobToDataUrl(stored.blob, stored.mimeType),
    });
  }
  return { ...document, photos };
}

const V2_STORE_NAMES = [
  'photos',
  'receipts',
  'registrations',
  'travelers',
  'trips',
  'settings',
] as const;

export const backupService: BackupService = {
  /**
   * Structural size without reading a single photo blob — `photoRepository.totalBytes()`
   * already sums over an index (#76) rather than materialising them, and this stays
   * cheap for the same reason: the whole point is to show a size *before* the user
   * commits to including photos, on the device that is asking because it is short of room.
   */
  async estimateSize(db, options) {
    const document = await buildDocument(
      db,
      { ...options, includePhotos: false },
      { now: () => new Date() },
    );
    const structuralBytes = new TextEncoder().encode(JSON.stringify(document)).length;
    if (!options.includePhotos) return structuralBytes;
    const photoBytes = await photoRepository.totalBytes(db);
    return structuralBytes + Math.ceil(photoBytes * BASE64_OVERHEAD);
  },

  async export(db, options) {
    return buildDocument(db, options, { now: () => new Date() });
  },

  async preview(db, text) {
    const validated = validateDocument(parseDocument(text));
    return { ...toPreview(validated), conflicts: await countConflicts(db, validated) };
  },

  /**
   * Validates the whole file before writing anything — the same discipline as
   * `receiptRepository.putMany` (#69): a batch that fails half way is worse than one that
   * fails outright. `replace` clears every v2 store first; `merge` upserts, so an imported
   * record with an id already on the device overwrites it (the import is explicit user
   * intent, confirmed by the preview shown first).
   */
  async import(db: KaeruDatabase, text: string, mode: ImportMode): Promise<ImportPreview> {
    const validated = validateDocument(parseDocument(text));
    const conflicts = await countConflicts(db, validated);

    await writeImportedCore(db, validated, mode);

    for (const photo of validated.photos) {
      try {
        await photoRepository.put(db, {
          id: photo.id,
          receiptId: photo.receiptId,
          mimeType: photo.mimeType,
          blob: dataUrlToBlob(photo.data, photo.mimeType),
          byteSize: 0,
          createdAt: validated.exportedAt || new Date().toISOString(),
        });
      } catch {
        // A photo is optional field (DR-042): one that is oversized, or arrives when the
        // device is already out of room, must not cost the core data that already wrote
        // successfully in one transaction below. Recorded so the user is told, not just
        // silently short a photo.
        validated.rejectedKeys.push(`photo:${photo.id} (could not be stored)`);
      }
    }

    return { ...toPreview(validated), conflicts };
  },

  /** The only destructive action in the app. Clears every v2 store; `meta` is untouched. */
  async deleteAll(db) {
    await clearV2Stores(db);
  },
};

const CORE_STORE_NAMES = ['trips', 'travelers', 'receipts', 'registrations', 'settings'] as const;

/**
 * One transaction over every core store, covering the `replace` clear and every write.
 * QA review on #93: the previous shape cleared in its own committed transaction and then
 * wrote through the repositories, each opening its own — so a `QuotaExceededError`, an
 * aborted transaction, or the tab dying mid-import left the device with neither the data
 * it had nor the file it was given, and there is no copy left to recover from, because the
 * copy was what the user just imported. One transaction makes that failure roll back
 * instead: either the whole import lands, or none of it does, same as `putMany` for the
 * ordinary per-traveler case (`TC-DATA-006`). Photos stay a separate best-effort step
 * after this returns — they are optional data (`DR-042`) and were never the risk.
 */
async function writeImportedCore(
  db: KaeruDatabase,
  validated: ValidatedDocument,
  mode: ImportMode,
): Promise<void> {
  const tx = db.transaction(CORE_STORE_NAMES, 'readwrite');
  try {
    const trips = tx.objectStore('trips');
    const travelers = tx.objectStore('travelers');
    const receipts = tx.objectStore('receipts');
    const registrations = tx.objectStore('registrations');

    if (mode === 'replace') {
      await Promise.all(CORE_STORE_NAMES.map((name) => tx.objectStore(name).clear()));
    }

    let tripSeq = await nextSequence(trips.index('by-seq'));
    for (const trip of validated.trips) {
      const existing = await trips.get(trip.id);
      await trips.put({ ...trip, seq: existing?.seq ?? tripSeq++ });
    }

    let travelerSeq = await nextSequence(travelers.index('by-seq'));
    for (const traveler of validated.travelers) {
      const existing = await travelers.get(traveler.id);
      await travelers.put({ ...traveler, seq: existing?.seq ?? travelerSeq++ });
    }

    let receiptSeq = await nextSequence(receipts.index('by-seq'));
    for (const receipt of validated.receipts) {
      const existing = await receipts.get(receipt.id);
      await receipts.put({ ...receipt, seq: existing?.seq ?? receiptSeq++ });
    }

    for (const registration of validated.registrations) {
      await registrations.put(registration);
    }

    await tx.objectStore('settings').put(validated.settings, SETTINGS_KEY);
    await tx.done;
  } catch (cause) {
    // Nothing is durable until `tx.done` resolves, but idb only auto-aborts on a genuine
    // IDBRequest failure — a JS error raised between two successful requests (a bad
    // record, a thrown mock in a test) would otherwise leave every write already queued
    // free to commit anyway. Explicit abort is what makes "the whole import lands, or
    // none of it does" actually true rather than true only for the failure modes
    // IndexedDB happens to catch on its own.
    await abortTransaction(tx);
    throw cause;
  }
}

async function clearV2Stores(db: KaeruDatabase): Promise<void> {
  const tx = db.transaction(V2_STORE_NAMES, 'readwrite');
  await Promise.all(V2_STORE_NAMES.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}

// --- v1 compatibility surface, kept so existing callers do not break --------

export function parseBackup(text: string): BackupFile {
  const doc = parseDocument(text);
  return {
    format: BACKUP_FORMAT,
    schemaVersion: doc.schemaVersion as number,
    exportedAt: typeof doc.exportedAt === 'string' ? doc.exportedAt : '',
    settings: normalizeSettings(doc.settings, DEFAULT_SETTINGS),
  };
}

export async function exportBackup(db: KaeruDatabase, clock: Clock): Promise<BackupFile> {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: clock.now().toISOString(),
    settings: await loadSettings(db),
  };
}

export async function importBackup(db: KaeruDatabase, backup: BackupFile): Promise<void> {
  const tx = db.transaction('settings', 'readwrite');
  await tx.objectStore('settings').put(backup.settings, SETTINGS_KEY);
  await tx.done;
}
