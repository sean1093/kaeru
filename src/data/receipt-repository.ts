import type { Receipt, ReceiptId } from '../domain/model.ts';
import type { KaeruDatabase } from './db.ts';
import { StorageError } from './errors.ts';
import { normalizeReceipt } from './normalize.ts';
import type { ReceiptQuery, ReceiptRepository } from './repositories.ts';
import { nextSequence } from './transaction.ts';
import type { StoredReceipt } from './types.ts';

/**
 * Newest purchase first, and within one day the order they were logged.
 *
 * A trip is read as a reverse diary, but two receipts from the same afternoon must not
 * swap places between renders — that is the difference between a list and a shuffle.
 */
function byPurchaseDateThenLogged(a: StoredReceipt, b: StoredReceipt): number {
  if (a.purchaseDate !== b.purchaseDate) return a.purchaseDate < b.purchaseDate ? 1 : -1;
  return a.seq - b.seq;
}

/**
 * One index read per query, chosen by whichever criterion is narrowest. Anything left over
 * is filtered in memory: a trip is a few hundred rows, and a second index lookup costs more
 * than the filter does.
 */
async function readQuery(
  db: KaeruDatabase,
  query: ReceiptQuery,
): Promise<readonly StoredReceipt[]> {
  const { tripId, travelerId, shopKey, purchaseDate } = query;
  let stored: StoredReceipt[];
  if (travelerId !== undefined) {
    stored = await db.getAllFromIndex('receipts', 'by-trip-traveler', [tripId, travelerId]);
  } else if (shopKey !== undefined) {
    stored = await db.getAllFromIndex('receipts', 'by-trip-shop', [tripId, shopKey]);
  } else if (purchaseDate !== undefined) {
    stored = await db.getAllFromIndex('receipts', 'by-trip-date', [tripId, purchaseDate]);
  } else {
    stored = await db.getAllFromIndex('receipts', 'by-trip', tripId);
  }
  return stored.filter(
    (receipt) =>
      (shopKey === undefined || receipt.shopKey === shopKey) &&
      (purchaseDate === undefined || receipt.purchaseDate === purchaseDate),
  );
}

function readable(stored: readonly StoredReceipt[]): readonly Receipt[] {
  const receipts: Receipt[] = [];
  for (const record of [...stored].sort(byPurchaseDateThenLogged)) {
    const receipt = normalizeReceipt(record);
    if (receipt) receipts.push(receipt);
  }
  return receipts;
}

function checked(receipt: Receipt): Receipt {
  const next = normalizeReceipt(receipt);
  if (!next) {
    throw new StorageError(
      'invalid-record',
      'A receipt needs an id, a trip, a traveller and a valid purchase date.',
    );
  }
  return next;
}

export const receiptRepository: ReceiptRepository = {
  async get(db, id) {
    return normalizeReceipt(await db.get('receipts', id)) ?? undefined;
  },

  /** One transaction, one store: a list never touches the photo blobs it references. */
  async list(db, query) {
    return readable(await readQuery(db, query));
  },

  async put(db, receipt) {
    const next = checked(receipt);
    const tx = db.transaction('receipts', 'readwrite');
    const store = tx.objectStore('receipts');
    const existing = await store.get(next.id);
    const seq = existing?.seq ?? (await nextSequence(store.index('by-seq')));
    await store.put({ ...next, seq });
    await tx.done;
    return next;
  },

  /**
   * All or nothing, for the airport screen that confirms a whole traveller at once (S34).
   * Every record is validated before the first write, so a bad one in the middle of the
   * batch cannot leave half a traveller confirmed.
   */
  async putMany(db, receipts) {
    const validated = receipts.map(checked);
    const tx = db.transaction('receipts', 'readwrite');
    const store = tx.objectStore('receipts');
    let next = await nextSequence(store.index('by-seq'));
    for (const receipt of validated) {
      const existing = await store.get(receipt.id);
      await store.put({ ...receipt, seq: existing?.seq ?? next++ });
    }
    await tx.done;
    return validated;
  },

  /** A receipt owns its photo: deleting the receipt deletes the blob with it (DR-042). */
  async remove(db, id: ReceiptId) {
    const tx = db.transaction(['receipts', 'photos'], 'readwrite');
    const photos = tx.objectStore('photos');
    for (const photoId of await photos.index('by-receipt').getAllKeys(id)) {
      await photos.delete(photoId);
    }
    const receipt = await tx.objectStore('receipts').get(id);
    if (receipt?.photoRef) await photos.delete(receipt.photoRef);
    await tx.objectStore('receipts').delete(id);
    await tx.done;
  },

  /**
   * The suggestion list under the shop field (UJ-005). Distinct by `shopKey` so a repeat
   * visit reuses one spelling rather than creating a second group (DR-012a), and most
   * recently logged first because that is what the next receipt is most likely to be.
   */
  async recentShops(db, tripId, limit) {
    if (limit <= 0) return [];
    const stored = await db.getAllFromIndex('receipts', 'by-trip', tripId);
    const names: string[] = [];
    const seen = new Set<string>();
    for (const record of [...stored].sort((a, b) => b.seq - a.seq)) {
      const receipt = normalizeReceipt(record);
      if (!receipt || receipt.shopName === '' || seen.has(receipt.shopKey)) continue;
      seen.add(receipt.shopKey);
      names.push(receipt.shopName);
      if (names.length === limit) break;
    }
    return names;
  },
};
