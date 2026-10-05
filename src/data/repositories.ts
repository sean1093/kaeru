/**
 * Storage contracts for schema v2.
 *
 * Contract module: types only. Implemented by M1-2.
 *
 * Repositories take a database handle rather than reaching for a singleton, so a test can
 * run them against a throwaway database (ADR 0005). Nothing here returns a live cursor or
 * a transaction: a repository call is a complete unit of work.
 */

import type { CalendarDate } from '../domain/dates.ts';
import type {
  Operator,
  OperatorId,
  OperatorRegistration,
  PhotoId,
  Receipt,
  ReceiptId,
  Traveler,
  TravelerId,
  Trip,
  TripId,
} from '../domain/model.ts';
import type { KaeruDatabase } from './db.ts';
import type { AppSettings } from './types.ts';

/** Object stores added by migration v2. `meta` and `settings` already exist from v1. */
export type V2StoreName = 'trips' | 'travelers' | 'receipts' | 'registrations' | 'photos';

export interface TripRepository {
  get(db: KaeruDatabase, id: TripId): Promise<Trip | undefined>;
  list(db: KaeruDatabase, options?: { includeArchived?: boolean }): Promise<readonly Trip[]>;
  /** The trip the app is currently about; null before onboarding finishes. */
  current(db: KaeruDatabase): Promise<Trip | null>;
  put(db: KaeruDatabase, trip: Trip): Promise<Trip>;
  /** Archiving keeps the trip readable and exportable; it is not a delete. */
  archive(db: KaeruDatabase, id: TripId, archived: boolean): Promise<void>;
  /** Removes the trip and everything that belongs to it, in one transaction. */
  remove(db: KaeruDatabase, id: TripId): Promise<void>;
}

export interface TravelerRepository {
  listByTrip(db: KaeruDatabase, tripId: TripId): Promise<readonly Traveler[]>;
  put(db: KaeruDatabase, traveler: Traveler): Promise<Traveler>;
  /**
   * Deleting a traveller must not orphan receipts: the caller supplies where they go.
   * Passing `null` is only valid when the traveller has no receipts.
   */
  remove(db: KaeruDatabase, id: TravelerId, reassignTo: TravelerId | null): Promise<void>;
}

export interface ReceiptQuery {
  tripId: TripId;
  travelerId?: TravelerId;
  shopKey?: string;
  purchaseDate?: CalendarDate;
}

export interface ReceiptRepository {
  get(db: KaeruDatabase, id: ReceiptId): Promise<Receipt | undefined>;
  /** Ordered by `purchaseDate` descending, then by insertion order, so lists are stable. */
  list(db: KaeruDatabase, query: ReceiptQuery): Promise<readonly Receipt[]>;
  put(db: KaeruDatabase, receipt: Receipt): Promise<Receipt>;
  /** One transaction, for the airport flow that confirms a whole traveller at once (S34). */
  putMany(db: KaeruDatabase, receipts: readonly Receipt[]): Promise<readonly Receipt[]>;
  remove(db: KaeruDatabase, id: ReceiptId): Promise<void>;
  /** Shop names seen on this trip, most recent first, for the suggestion list (UJ-005). */
  recentShops(db: KaeruDatabase, tripId: TripId, limit: number): Promise<readonly string[]>;
}

export interface RegistrationRepository {
  listByTrip(db: KaeruDatabase, tripId: TripId): Promise<readonly OperatorRegistration[]>;
  put(db: KaeruDatabase, registration: OperatorRegistration): Promise<OperatorRegistration>;
}

export interface StoredPhoto {
  id: PhotoId;
  receiptId: ReceiptId;
  blob: Blob;
  mimeType: string;
  byteSize: number;
  createdAt: string;
}

export interface PhotoRepository {
  get(db: KaeruDatabase, id: PhotoId): Promise<StoredPhoto | undefined>;
  /** Rejects with a `StorageQuotaError` rather than failing silently (TC-DATA quota cases). */
  put(db: KaeruDatabase, photo: StoredPhoto): Promise<StoredPhoto>;
  remove(db: KaeruDatabase, id: PhotoId): Promise<void>;
  totalBytes(db: KaeruDatabase): Promise<number>;
}

/** Thrown when the browser refuses a write because the origin is out of room. */
export interface StorageQuotaError extends Error {
  name: 'StorageQuotaError';
  /** Bytes the write needed, when the browser tells us. */
  requiredBytes?: number;
}

export interface StorageEstimate {
  usageBytes: number | null;
  quotaBytes: number | null;
  /** True once `navigator.storage.persist()` has been granted (iOS eviction, QA R07). */
  persisted: boolean;
}

export type EstimateStorage = () => Promise<StorageEstimate>;

// --- Backup (DR-042, DR-043, IA flow I) ------------------------------------

export interface BackupOptions {
  /** Photos are opt-in and off by default; the UI shows the size first (DR-042, IA Q1). */
  includePhotos: boolean;
  /** Archived trips are included by default: a backup that is not complete is not a backup. */
  includeArchived: boolean;
}

/** Schema v2 backup envelope. v1 files carry only `settings` and are migrated on import. */
export interface BackupDocumentV2 {
  format: 'kaeru.backup';
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  settings: AppSettings;
  trips: readonly Trip[];
  travelers: readonly Traveler[];
  receipts: readonly Receipt[];
  registrations: readonly OperatorRegistration[];
  /** Base64 data URLs, present only when `includePhotos` was set. */
  photos?: readonly { id: PhotoId; receiptId: ReceiptId; mimeType: string; data: string }[];
}

/** What an import would do, shown to the user before anything is written (IA flow I). */
export interface ImportPreview {
  schemaVersion: number;
  exportedAt: string;
  trips: number;
  receipts: number;
  photos: number;
  /** Entities already present with the same id. */
  conflicts: number;
  /** Findings that made the importer drop or repair data, e.g. a passport-like value (DR-043). */
  rejectedKeys: readonly string[];
}

export type ImportMode = 'merge' | 'replace';

export interface BackupService {
  estimateSize(db: KaeruDatabase, options: BackupOptions): Promise<number>;
  export(db: KaeruDatabase, options: BackupOptions): Promise<BackupDocumentV2>;
  /** Parses and validates without writing; throws `BackupError` for a file we will not accept. */
  preview(text: string): Promise<ImportPreview>;
  import(db: KaeruDatabase, text: string, mode: ImportMode): Promise<ImportPreview>;
  /** The only destructive action in the app; the UI offers Export first in the same sheet. */
  deleteAll(db: KaeruDatabase): Promise<void>;
}

/** Shipped operator catalogue, read-only at runtime. Lives in `src/content`, not in storage. */
export type OperatorCatalog = Readonly<Record<OperatorId, Operator>>;
