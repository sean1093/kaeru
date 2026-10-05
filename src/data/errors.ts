/**
 * Storage failures the UI has to say something true about.
 *
 * Every one of these is recoverable from the user's point of view, so each carries a code
 * rather than only a message: the feature layer maps the code to translated copy, and no
 * English string from this module is ever rendered.
 */

export type StorageErrorCode =
  /** IndexedDB is missing or refused — Private Browsing, blocked storage (TC-DATA-009). */
  | 'unavailable'
  /** The database on this device was written by a newer build (TC-DATA-005). */
  | 'schema-too-new'
  /** A value the repository refuses to write, because storing it would lose information. */
  | 'invalid-record'
  /** Deleting a traveller who still owns receipts without saying where they go. */
  | 'reassignment-required'
  /** The write target is gone — a stale id from another tab or a deleted parent. */
  | 'not-found';

export interface StorageErrorOptions {
  cause?: unknown;
  /** The schema version found on the device, when `schema-too-new` could read it. */
  foundVersion?: number;
}

export class StorageError extends Error {
  readonly code: StorageErrorCode;
  readonly foundVersion?: number;

  constructor(code: StorageErrorCode, message: string, options: StorageErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'StorageError';
    this.code = code;
    if (options.foundVersion !== undefined) this.foundVersion = options.foundVersion;
  }
}

export function isStorageError(value: unknown): value is StorageError {
  return value instanceof StorageError;
}
