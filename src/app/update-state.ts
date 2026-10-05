import { signal } from '@preact/signals';

/**
 * Service-worker state, kept in a plain module so the shell can render an update
 * affordance without importing the `virtual:pwa-register` module. Only `main.tsx`
 * touches the virtual module, which keeps component tests free of build-time magic.
 */
export const needRefresh = signal(false);
export const offlineReady = signal(false);

type Updater = (reload?: boolean) => Promise<void>;

let updater: Updater | null = null;

export function setUpdater(next: Updater): void {
  updater = next;
}

/** Activate the waiting worker and reload into the new build. */
export async function applyUpdate(): Promise<void> {
  needRefresh.value = false;
  await updater?.(true);
}
