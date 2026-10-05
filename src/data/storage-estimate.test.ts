import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  estimateStorage,
  requestPersistentStorage,
  resetPersistRequestedForTests,
} from './storage-estimate.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  resetPersistRequestedForTests();
});

describe('estimateStorage', () => {
  it('reports usage, quota and persistence from navigator.storage', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        estimate: async () => ({ usage: 4_200_000, quota: 50_000_000 }),
        persisted: async () => true,
      },
    });

    expect(await estimateStorage()).toEqual({
      usageBytes: 4_200_000,
      quotaBytes: 50_000_000,
      persisted: true,
    });
  });

  it('TC-DATA-010: degrades to unknown rather than throwing when the API is absent (R07)', async () => {
    vi.stubGlobal('navigator', {});

    expect(await estimateStorage()).toEqual({
      usageBytes: null,
      quotaBytes: null,
      persisted: false,
    });
  });

  it('reports what the browser knows even when a field is missing', async () => {
    vi.stubGlobal('navigator', {
      storage: { estimate: async () => ({ quota: 50_000_000 }) },
    });

    expect(await estimateStorage()).toEqual({
      usageBytes: null,
      quotaBytes: 50_000_000,
      persisted: false,
    });
  });
});

describe('requestPersistentStorage', () => {
  it('TC-DATA-010: asks the browser once, not on every call', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persist } });

    await requestPersistentStorage();
    await requestPersistentStorage();
    await requestPersistentStorage();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('is a no-op, not a throw, when the API is absent or refuses', async () => {
    vi.stubGlobal('navigator', {});
    await expect(requestPersistentStorage()).resolves.toBeUndefined();

    resetPersistRequestedForTests();
    vi.stubGlobal('navigator', {
      storage: { persist: () => Promise.reject(new Error('denied')) },
    });
    await expect(requestPersistentStorage()).resolves.toBeUndefined();
  });
});
