import type { MessageBundle, MessageModule } from './bundle.ts';

/**
 * Every message bundle in the app, collected at build time.
 *
 * Adding a feature adds `src/features/<feature>/messages.ts`; nothing central changes,
 * and the parity test in `catalogs.test.ts` picks the new bundle up automatically.
 */
const modules = import.meta.glob<{ messages: MessageBundle }>('/src/**/messages.ts', {
  eager: true,
});

export const allBundles: readonly MessageModule[] = Object.entries(modules)
  .map(([path, module]) => ({ id: path, messages: module.messages }))
  .sort((a, b) => a.id.localeCompare(b.id));
