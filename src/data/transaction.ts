/**
 * Transaction helpers shared by the repositories.
 *
 * Both of these exist because IndexedDB's own behaviour is easy to get subtly wrong on the
 * one layer where a mistake destroys user data.
 */

/** The shape of a `by-seq` index; structural so no repository has to spell out idb's generics. */
interface SequenceIndex {
  openCursor(query: null, direction: 'prev'): Promise<{ key: number } | null>;
}

interface AbortableTransaction {
  abort(): void;
  readonly done: Promise<unknown>;
}

/**
 * The next insertion number for a store, read from its `by-seq` index inside the caller's
 * transaction so two concurrent writers cannot be handed the same number (TC-DATA-008).
 */
export async function nextSequence(index: SequenceIndex): Promise<number> {
  const newest = await index.openCursor(null, 'prev');
  return (newest?.key ?? 0) + 1;
}

/**
 * Roll back and swallow the rejection `abort()` raises on `done`. A repository that
 * refuses a write must leave no partial record *and* no unhandled rejection (TC-DATA-006).
 */
export async function abortTransaction(tx: AbortableTransaction): Promise<void> {
  tx.abort();
  await tx.done.catch(() => undefined);
}
