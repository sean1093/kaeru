import type { DBSchema } from 'idb';
import type { CalendarDate } from '../domain/dates.ts';
import type {
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
import type { Locale } from '../i18n/index.ts';
import type { StoredPhoto } from './repositories.ts';

export const DB_NAME = 'kaeru';

/** Bump together with a new entry in `migrations.ts`. Never reuse a version number. */
export const SCHEMA_VERSION = 2;

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export interface AppSettings {
  locale: Locale;
  theme: ThemePreference;
}

export interface MetaRecord {
  schemaVersion: number;
  createdAt: string;
}

/**
 * The one field storage adds to a domain entity: a per-store insertion counter.
 *
 * IndexedDB orders by key, and our keys are opaque ids, so without this a list would
 * reorder itself between reads. `seq` gives every list a stable, cheap tie-break
 * ("the order they were added") that survives edits, and it is stripped on read so the
 * domain model never sees it.
 */
export interface Sequenced {
  seq: number;
}

export type StoredTrip = Trip & Sequenced;
export type StoredTraveler = Traveler & Sequenced;
export type StoredReceipt = Receipt & Sequenced;

/**
 * v1 held only what the shell needs. v2 adds the real model as new stores: trips,
 * travelers, receipts, registrations and photos. Existing stores are never rewritten.
 *
 * Photos live in their own store, keyed from the receipt, so reading a receipt list never
 * deserialises megabytes of blob (ADR 0005).
 */
export interface KaeruDB extends DBSchema {
  meta: { key: string; value: MetaRecord };
  settings: { key: string; value: AppSettings };
  trips: {
    key: TripId;
    value: StoredTrip;
    indexes: { 'by-seq': number };
  };
  travelers: {
    key: TravelerId;
    value: StoredTraveler;
    indexes: { 'by-trip': TripId; 'by-seq': number };
  };
  receipts: {
    key: ReceiptId;
    value: StoredReceipt;
    indexes: {
      'by-trip': TripId;
      'by-trip-traveler': [TripId, TravelerId];
      'by-trip-date': [TripId, CalendarDate];
      'by-trip-shop': [TripId, string];
      'by-seq': number;
    };
  };
  registrations: {
    key: [TripId, OperatorId];
    value: OperatorRegistration;
    indexes: { 'by-trip': TripId };
  };
  photos: {
    key: PhotoId;
    value: StoredPhoto;
    indexes: { 'by-receipt': ReceiptId };
  };
}

export const META_KEY = 'schema';
export const SETTINGS_KEY = 'app';

/** Everything a trip owns, in the order a cascading delete must clear it. */
export const TRIP_OWNED_STORES = [
  'photos',
  'receipts',
  'registrations',
  'travelers',
  'trips',
] as const satisfies readonly (keyof KaeruDB)[];
