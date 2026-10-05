/**
 * A tally of stored records normalisation could not address or date.
 *
 * Normalisation never deletes an unreadable record — it stays on disk — but a silent drop
 * is indistinguishable from data loss from the user's side: a receipt they logged is
 * simply absent from the list, with nothing anywhere saying why (Architect review, #67).
 * Nothing in M1 reads this yet; it exists so the count is not thrown away before the data
 * screen (M2-A) has somewhere to show it — "1 record on this device could not be read"
 * instead of the app quietly disagreeing with the user about what they entered.
 */
export type UnreadableRecordStore = 'trips' | 'travelers' | 'receipts' | 'registrations';

const counts: Record<UnreadableRecordStore, number> = {
  trips: 0,
  travelers: 0,
  receipts: 0,
  registrations: 0,
};

/** Called by a normaliser when a record exists but could not be turned into a domain value. */
export function recordUnreadable(store: UnreadableRecordStore): void {
  counts[store] += 1;
}

export function unreadableRecordCounts(): Readonly<Record<UnreadableRecordStore, number>> {
  return { ...counts };
}

/** Test-only: specs share this module instance, so each one starts from zero. */
export function resetUnreadableRecordCountsForTests(): void {
  for (const store of Object.keys(counts) as UnreadableRecordStore[]) counts[store] = 0;
}
