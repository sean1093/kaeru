import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { StorageQuotaError } from './errors.ts';
import { MAX_PHOTO_BYTES, photoRepository } from './photo-repository.ts';
import * as storageEstimate from './storage-estimate.ts';

let db: KaeruDatabase;
let counter = 0;

function aPhoto(overrides: Partial<Parameters<typeof photoRepository.put>[1]> = {}) {
  return {
    id: 'photo-1',
    receiptId: 'receipt-1',
    blob: new Blob(['x'.repeat(2048)], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    byteSize: 2048,
    createdAt: '2026-11-15T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-photos-${counter}`, fixedClock('2026-10-05T00:00:00Z'));
  storageEstimate.resetPersistRequestedForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('photoRepository', () => {
  it('a stored photo comes back with byteSize taken from the actual blob', async () => {
    const saved = await photoRepository.put(db, aPhoto({ byteSize: 1 }));
    expect(saved.byteSize).toBe(2048);

    const fetched = await photoRepository.get(db, 'photo-1');
    expect(fetched).toMatchObject({
      id: 'photo-1',
      receiptId: 'receipt-1',
      mimeType: 'image/jpeg',
      byteSize: 2048,
      createdAt: '2026-11-15T10:00:00.000Z',
    });
  });

  it('reports a photo that is not there as undefined', async () => {
    expect(await photoRepository.get(db, 'no-such-photo')).toBeUndefined();
  });

  it('TC-PWA-007: rejects an oversized photo clearly, writing nothing and blowing no quota', async () => {
    const oversized = aPhoto({ blob: new Blob(['x'.repeat(MAX_PHOTO_BYTES + 1)]) });

    const failure = await photoRepository.put(db, oversized).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(StorageQuotaError);
    expect(failure).toMatchObject({
      name: 'StorageQuotaError',
      requiredBytes: MAX_PHOTO_BYTES + 1,
    });
    expect(await db.count('photos')).toBe(0);
  });

  it('TC-DATA-007: a QuotaExceededError on write rejects with StorageQuotaError, leaving the store untouched', async () => {
    await photoRepository.put(db, aPhoto({ id: 'kept' }));

    const quotaExceeded = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    vi.spyOn(db, 'put').mockRejectedValueOnce(quotaExceeded);

    const failure = await photoRepository
      .put(db, aPhoto({ id: 'rejected' }))
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(StorageQuotaError);
    expect(failure).toMatchObject({ name: 'StorageQuotaError', requiredBytes: 2048 });
    expect((failure as StorageQuotaError).cause).toBe(quotaExceeded);
    expect(await db.getAllKeys('photos')).toEqual(['kept']);
  });

  it('lets an unrelated database failure through unwrapped', async () => {
    const boom = new Error('disk on fire');
    vi.spyOn(db, 'put').mockRejectedValueOnce(boom);

    await expect(photoRepository.put(db, aPhoto())).rejects.toBe(boom);
  });

  it('requests persistent storage once, on the first successful write only', async () => {
    const request = vi.spyOn(storageEstimate, 'requestPersistentStorage');

    await photoRepository.put(db, aPhoto({ id: 'a' }));
    await photoRepository.put(db, aPhoto({ id: 'b' }));

    expect(request).toHaveBeenCalled();
  });

  it('does not request persistence when the write itself failed', async () => {
    const request = vi.spyOn(storageEstimate, 'requestPersistentStorage');
    const oversized = aPhoto({ blob: new Blob(['x'.repeat(MAX_PHOTO_BYTES + 1)]) });

    await photoRepository.put(db, oversized).catch(() => undefined);

    expect(request).not.toHaveBeenCalled();
  });

  it('deletes a photo, and is a no-op for one already gone', async () => {
    await photoRepository.put(db, aPhoto());
    await photoRepository.remove(db, 'photo-1');
    await photoRepository.remove(db, 'photo-1');

    expect(await db.count('photos')).toBe(0);
  });

  it('sums the bytes of every photo, zero when there are none', async () => {
    expect(await photoRepository.totalBytes(db)).toBe(0);

    await photoRepository.put(db, aPhoto({ id: 'a', blob: new Blob(['x'.repeat(100)]) }));
    await photoRepository.put(db, aPhoto({ id: 'b', blob: new Blob(['x'.repeat(250)]) }));

    expect(await photoRepository.totalBytes(db)).toBe(350);

    await photoRepository.remove(db, 'a');
    expect(await photoRepository.totalBytes(db)).toBe(250);
  });
});
