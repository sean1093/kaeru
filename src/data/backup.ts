import type { Clock } from '../domain/index.ts';
import type { KaeruDatabase } from './db.ts';
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings } from './settings-repository.ts';
import { type AppSettings, SCHEMA_VERSION, SETTINGS_KEY } from './types.ts';

export const BACKUP_FORMAT = 'kaeru.backup';

/**
 * Export / import is the only way data leaves the device, so the file carries the
 * schema version it was written with. An older file is migrated on import; a newer one
 * is refused rather than silently misread.
 */
export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  settings: AppSettings;
}

export async function exportBackup(db: KaeruDatabase, clock: Clock): Promise<BackupFile> {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: clock.now().toISOString(),
    settings: await loadSettings(db),
  };
}

export type BackupErrorCode = 'not-a-backup' | 'unsupported-version' | 'invalid-json';

export class BackupError extends Error {
  readonly code: BackupErrorCode;

  constructor(message: string, code: BackupErrorCode) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
  }
}

export function parseBackup(text: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('The file is not valid JSON.', 'invalid-json');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new BackupError('The file is not a Kaeru backup.', 'not-a-backup');
  }
  const candidate = parsed as Partial<BackupFile>;
  if (candidate.format !== BACKUP_FORMAT || typeof candidate.schemaVersion !== 'number') {
    throw new BackupError('The file is not a Kaeru backup.', 'not-a-backup');
  }
  if (candidate.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError(
      `The backup was written by a newer version of Kaeru (schema ${candidate.schemaVersion}).`,
      'unsupported-version',
    );
  }
  return {
    format: BACKUP_FORMAT,
    schemaVersion: candidate.schemaVersion,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : '',
    settings: normalizeSettings(candidate.settings, DEFAULT_SETTINGS),
  };
}

/** Replace the device's data with the contents of a backup. */
export async function importBackup(db: KaeruDatabase, backup: BackupFile): Promise<void> {
  const tx = db.transaction('settings', 'readwrite');
  await tx.objectStore('settings').put(backup.settings, SETTINGS_KEY);
  await tx.done;
}
