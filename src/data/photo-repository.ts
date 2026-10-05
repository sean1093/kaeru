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

  async totalBytes(db) {
    let total = 0;
    for (const photo of await db.getAll('photos')) total += photo.byteSize;
    return total;
  },
};
