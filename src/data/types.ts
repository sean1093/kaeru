import type { DBSchema } from 'idb';
import type { Locale } from '../i18n/index.ts';

export const DB_NAME = 'kaeru';

/** Bump together with a new entry in `migrations.ts`. Never reuse a version number. */
export const SCHEMA_VERSION = 1;

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
 * v1 holds only what the shell needs. Trips, travellers, receipts and refunds arrive
 * in M1 as new stores plus a new migration — existing stores are never rewritten.
 */
export interface KaeruDB extends DBSchema {
  meta: { key: string; value: MetaRecord };
  settings: { key: string; value: AppSettings };
}

export const META_KEY = 'schema';
export const SETTINGS_KEY = 'app';
