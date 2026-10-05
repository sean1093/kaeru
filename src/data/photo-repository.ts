import { StorageQuotaError } from './errors.ts';
import type { PhotoRepository, StoredPhoto } from './repositories.ts';
import { requestPersistentStorage } from './storage-estimate.ts';

/**
 * A single photo this large would make export, Airport Mode and the gallery screen all
 * slow for one oversized file, and it would eat a disproportionate share of a device's
 * quota before the user ever sees a quota error. The camera capture flow (M2-B) is
 * expected to downscale before calling `put`; this is the floor underneath it so a bug or
 * a bypassed capture path fails clearly instead of quietly blowing the budget
 * (`TC-PWA-007`).
 */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function isQuotaExceeded(cause: unknown): boolean {
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'name' in cause &&
    (cause.name === 'QuotaExceededError' || cause.name === 'QuotaExceededException')
  );
}

export const photoRepository: PhotoRepository = {
  async get(db, id) {
    return db.get('photos', id);
  },

  /**
   * Rejects with `StorageQuotaError` rather than a raw `DOMException`, whether the browser
   * refused the write or the blob itself is oversized. Either way the receipt the photo
   * belongs to is untouched: this store never touches `receipts`.
   */
  async put(db, photo) {
    const byteSize = photo.blob.size;
    if (byteSize > MAX_PHOTO_BYTES) {
      throw new StorageQuotaError(
        `Photo is ${byteSize} bytes, over the ${MAX_PHOTO_BYTES} byte limit.`,
        { requiredBytes: byteSize },
      );
    }

    const stored: StoredPhoto = { ...photo, byteSize };
    try {
      await db.put('photos', stored);
    } catch (cause) {
      if (!isQuotaExceeded(cause)) throw cause;
      throw new StorageQuotaError('Not enough storage left on this device for this photo.', {
        cause,
        requiredBytes: byteSize,
      });
    }

    // Requested once per session at the first successful write (ADR 0005); a browser
    // without the API, or one that refuses, leaves the write itself unaffected.
    void requestPersistentStorage();
    return stored;
  },

  async remove(db, id) {
    await db.delete('photos', id);
  },

  /**
   * Sums over the `by-size` index's keys, never its values: `openKeyCursor` does not
   * fetch the record, so this never deserialises a photo blob to read the number sitting
   * beside it. This runs on the data/privacy screen a user opens specifically because
   * they are near quota — the moment the device is least able to absorb reading megabytes
   * of images into memory just to add them up (QA review, #76).
   */
  async totalBytes(db) {
    let total = 0;
    let cursor = await db.transaction('photos').store.index('by-size').openKeyCursor();
    while (cursor) {
      total += cursor.key;
      cursor = await cursor.continue();
    }
    return total;
  },
};
