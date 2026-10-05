/**
 * `navigator.storage` wrappers — not implemented in jsdom, so every call here is
 * feature-detected and degrades to "unknown" rather than throwing (QA risk R07, iOS
 * eviction). Nothing in this module blocks a write: persistence is requested, never waited
 * on for its result to matter to the caller.
 */
import type { EstimateStorage, StorageEstimate } from './repositories.ts';

function storageManager(): StorageManager | undefined {
  return typeof navigator === 'object' ? navigator.storage : undefined;
}

/** Usage, quota and whether `persist()` has been granted, for the data/privacy screen. */
export const estimateStorage: EstimateStorage = async (): Promise<StorageEstimate> => {
  const storage = storageManager();
  const estimate = (await storage?.estimate?.()) ?? {};
  const persisted = (await storage?.persisted?.()) ?? false;
  return {
    usageBytes: estimate.usage ?? null,
    quotaBytes: estimate.quota ?? null,
    persisted,
  };
};

let persistRequested = false;

/**
 * Asks the browser not to evict this origin's storage under pressure. Requested once per
 * session, at the first photo write (ADR 0005) — not on every write, and not eagerly on
 * boot, because the request is a heuristic signal to the browser and spamming it changes
 * nothing. A browser without the API, or one that refuses, is silently a no-op: the result
 * is only ever read back through `estimateStorage().persisted`.
 */
export async function requestPersistentStorage(): Promise<void> {
  if (persistRequested) return;
  persistRequested = true;
  await storageManager()
    ?.persist?.()
    .catch(() => false);
}

/** Test-only: lets a spec request persistence again within the same module instance. */
export function resetPersistRequestedForTests(): void {
  persistRequested = false;
}
