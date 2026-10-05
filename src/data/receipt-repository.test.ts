import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import type { Receipt } from '../domain/model.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { StorageError } from './errors.ts';
import { receiptRepository } from './receipt-repository.ts';
import { aLine, aReceipt } from './test-builders.ts';

let db: KaeruDatabase;
let dbName = '';
let counter = 0;
const deviceTimeZone = process.env.TZ;

beforeEach(async () => {
  counter += 1;
  dbName = `kaeru-receipts-${counter}`;
  db = await openDatabase(dbName, fixedClock('2026-10-05T00:00:00Z'));
});

afterEach(() => {
  process.env.TZ = deviceTimeZone;
});

/** Records which stores each transaction touched, so "one transaction" can be asserted. */
function watchTransactions(handle: KaeruDatabase): { db: KaeruDatabase; opened: string[][] } {
  const opened: string[][] = [];
  const proxy = new Proxy(handle, {
    get(target, property) {
      const value = Reflect.get(target, property);
      if (property !== 'transaction' || typeof value !== 'function') return value;
      return (names: string | string[], ...rest: unknown[]) => {
        opened.push(typeof names === 'string' ? [names] : [...names]);
        return value.call(target, names, ...rest);
      };
    },
  });
  return { db: proxy as KaeruDatabase, opened };
}

async function seed(receipts: readonly Receipt[]): Promise<void> {
  for (const receipt of receipts) await receiptRepository.put(db, receipt);
}

describe('receiptRepository', () => {
  it('TC-DATA-001: a saved receipt comes back identical, status and flags included', async () => {
    const receipt = aReceipt({
      status: 'customs_confirmed',
      packingLocation: 'checked_bag',
      allItemsPresent: true,
      willUseInJapan: false,
      hasHighValueItem: true,
      operatorId: 'global-tax-free',
      amountReceived: 880,
      photoRef: 'photo-1',
      lines: [aLine(), aLine({ taxRate: 0.08, taxExcludedAmount: 5000, taxIncludedAmount: 5400 })],
    });

    expect(await receiptRepository.put(db, receipt)).toEqual(receipt);
    expect(await receiptRepository.get(db, receipt.id)).toEqual(receipt);
  });

  it('TC-DOM-065: a purchase date survives a device timezone change unchanged', async () => {
    process.env.TZ = 'Asia/Taipei';
    await receiptRepository.put(db, aReceipt({ purchaseDate: '2026-10-31' }));

    process.env.TZ = 'Asia/Tokyo';
    const reopened = await openDatabase(dbName, fixedClock('2026-10-05T00:00:00Z'));
    const stored = await reopened.get('receipts', 'receipt-1');

    // Stored as a calendar date, never as an instant: there is nothing here to re-interpret.
    expect(typeof stored?.purchaseDate).toBe('string');
    expect(stored?.purchaseDate).toBe('2026-10-31');
    expect((await receiptRepository.get(reopened, 'receipt-1'))?.purchaseDate).toBe('2026-10-31');
    reopened.close();
  });

  it('lists newest purchase first, and within a day the one logged most recently', async () => {
    await seed([
      aReceipt({ id: 'a', purchaseDate: '2026-11-15' }),
      aReceipt({ id: 'b', purchaseDate: '2026-11-17' }),
      aReceipt({ id: 'c', purchaseDate: '2026-11-15' }),
    ]);

    expect((await receiptRepository.list(db, { tripId: 'trip-1' })).map((r) => r.id)).toEqual([
      'b',
      'c',
      'a',
    ]);

    // Editing a receipt must not move it within its day — it keeps its own seq.
    await receiptRepository.put(
      db,
      aReceipt({ id: 'a', purchaseDate: '2026-11-15', shopName: 'ドン・キホーテ' }),
    );
    expect((await receiptRepository.list(db, { tripId: 'trip-1' })).map((r) => r.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('narrows by traveler, shop and day, and never crosses trips', async () => {
    await seed([
      aReceipt({ id: 'a', travelerId: 'mum', shopKey: 'bic', purchaseDate: '2026-11-15' }),
      aReceipt({ id: 'b', travelerId: 'mum', shopKey: 'donki', purchaseDate: '2026-11-16' }),
      aReceipt({ id: 'c', travelerId: 'dad', shopKey: 'bic', purchaseDate: '2026-11-15' }),
      aReceipt({ id: 'd', tripId: 'trip-2', travelerId: 'mum', shopKey: 'bic' }),
    ]);

    const ids = async (query: Parameters<typeof receiptRepository.list>[1]) =>
      (await receiptRepository.list(db, query)).map((r) => r.id);

    expect(await ids({ tripId: 'trip-1' })).toEqual(['b', 'c', 'a']);
    expect(await ids({ tripId: 'trip-1', travelerId: 'mum' })).toEqual(['b', 'a']);
    expect(await ids({ tripId: 'trip-1', shopKey: 'bic' })).toEqual(['c', 'a']);
    expect(await ids({ tripId: 'trip-1', purchaseDate: '2026-11-15' })).toEqual(['c', 'a']);
    expect(await ids({ tripId: 'trip-1', travelerId: 'mum', purchaseDate: '2026-11-15' })).toEqual([
      'a',
    ]);
  });

  it("TC-DATA-002: Yi-chun's trip — 14 receipts, 2 travelers, 4 operators, mixed rates", async () => {
    const operators = ['global-tax-free', 'japan-tax-free', 'tourist-pay', null];
    await seed(
      Array.from({ length: 14 }, (_, index) =>
        aReceipt({
          id: `r${index}`,
          travelerId: index % 2 === 0 ? 'yi-chun' : 'mother',
          operatorId: operators[index % 4] ?? null,
          purchaseDate: `2026-11-${String(10 + (index % 5)).padStart(2, '0')}`,
          shopKey: `shop-${index % 6}`,
          lines: [
            aLine({ taxRate: 0.1, taxExcludedAmount: 1000 * (index + 1) }),
            aLine({ taxRate: 0.08, taxExcludedAmount: 500, taxIncludedAmount: 540 }),
          ],
        }),
      ),
    );

    expect(await db.count('receipts')).toBe(14);
    expect(
      await receiptRepository.list(db, { tripId: 'trip-1', travelerId: 'yi-chun' }),
    ).toHaveLength(7);
    expect(
      await receiptRepository.list(db, { tripId: 'trip-1', travelerId: 'mother' }),
    ).toHaveLength(7);
    const everyLineKept = (await receiptRepository.list(db, { tripId: 'trip-1' })).every(
      (receipt) => receipt.lines.length === 2,
    );
    expect(everyLineKept).toBe(true);
  });

  it('TC-DATA-003: lists a 300-receipt trip in one transaction, without touching the photos', async () => {
    const receipts = Array.from({ length: 300 }, (_, index) =>
      aReceipt({ id: `r${index}`, photoRef: `photo-${index}` }),
    );
    await receiptRepository.putMany(db, receipts);
    await db.put('photos', {
      id: 'photo-0',
      receiptId: 'r0',
      blob: new Blob(['x'.repeat(2048)]),
      mimeType: 'image/jpeg',
      byteSize: 2048,
      createdAt: '2026-11-15T10:00:00.000Z',
    });

    const watched = watchTransactions(db);
    const listed = await receiptRepository.list(watched.db, { tripId: 'trip-1' });

    expect(listed).toHaveLength(300);
    expect(watched.opened).toEqual([['receipts']]);
  });

  it('putMany is atomic: one bad record in the batch writes none of them', async () => {
    await seed([aReceipt({ id: 'kept' })]);

    await expect(
      receiptRepository.putMany(db, [
        aReceipt({ id: 'new-1' }),
        aReceipt({ id: 'new-2', purchaseDate: 'whenever' }),
      ]),
    ).rejects.toBeInstanceOf(StorageError);

    expect(await db.getAllKeys('receipts')).toEqual(['kept']);
  });

  it('putMany confirms a whole traveler at once and keeps each receipt in place', async () => {
    await seed([
      aReceipt({ id: 'a', purchaseDate: '2026-11-15' }),
      aReceipt({ id: 'b', purchaseDate: '2026-11-15' }),
    ]);
    const confirmed = (await receiptRepository.list(db, { tripId: 'trip-1' })).map((receipt) => ({
      ...receipt,
      status: 'customs_confirmed' as const,
      statusChangedAt: '2026-11-20T08:00:00.000Z',
    }));

    await receiptRepository.putMany(db, confirmed);

    const after = await receiptRepository.list(db, { tripId: 'trip-1' });
    expect(after.map((r) => r.id)).toEqual(['b', 'a']);
    expect(after.every((receipt) => receipt.status === 'customs_confirmed')).toBe(true);
  });

  it('TC-DATA-008: a second connection sees the first write instead of clobbering it', async () => {
    const tabA = db;
    const tabB = await openDatabase(dbName, fixedClock('2026-10-05T00:00:00Z'));

    await receiptRepository.put(tabA, aReceipt({ id: 'shared', status: 'logged' }));
    const seenByB = await receiptRepository.get(tabB, 'shared');
    expect(seenByB?.status).toBe('logged');

    await Promise.all([
      receiptRepository.put(tabA, aReceipt({ id: 'from-a' })),
      receiptRepository.put(tabB, aReceipt({ id: 'from-b' })),
    ]);

    expect(
      (await receiptRepository.list(tabB, { tripId: 'trip-1' })).map((r) => r.id).sort(),
    ).toEqual(['from-a', 'from-b', 'shared']);
    // Concurrent inserts take different numbers, so the list order stays total.
    const seqs = (await tabB.getAll('receipts')).map((record) => record.seq);
    expect(new Set(seqs).size).toBe(3);
    tabB.close();
  });

  it('deleting a receipt deletes the photo it owns', async () => {
    await seed([aReceipt({ id: 'r1', photoRef: 'photo-1' })]);
    await db.put('photos', {
      id: 'photo-1',
      receiptId: 'r1',
      blob: new Blob(['photo']),
      mimeType: 'image/jpeg',
      byteSize: 5,
      createdAt: '2026-11-15T10:00:00.000Z',
    });

    await receiptRepository.remove(db, 'r1');

    expect(await db.count('receipts')).toBe(0);
    expect(await db.count('photos')).toBe(0);
  });

  it('suggests the shops of this trip, most recently logged first and each one once', async () => {
    await seed([
      aReceipt({ id: 'a', shopName: 'ビックカメラ', shopKey: 'bic' }),
      aReceipt({ id: 'b', shopName: 'ドン・キホーテ', shopKey: 'donki' }),
      aReceipt({ id: 'c', shopName: 'ビックカメラ 新宿', shopKey: 'bic' }),
      aReceipt({ id: 'd', shopName: 'マツキヨ', shopKey: 'matsukiyo' }),
      aReceipt({ id: 'e', tripId: 'trip-2', shopName: 'ユニクロ', shopKey: 'uniqlo' }),
    ]);

    expect(await receiptRepository.recentShops(db, 'trip-1', 5)).toEqual([
      'マツキヨ',
      'ビックカメラ 新宿',
      'ドン・キホーテ',
    ]);
    expect(await receiptRepository.recentShops(db, 'trip-1', 2)).toEqual([
      'マツキヨ',
      'ビックカメラ 新宿',
    ]);
    expect(await receiptRepository.recentShops(db, 'trip-1', 0)).toEqual([]);
  });

  it('repairs a damaged record rather than handing the domain nonsense, and deletes nothing', async () => {
    await db.put('receipts', {
      ...aReceipt({ id: 'damaged' }),
      status: 'teleported',
      packingLocation: 'in the bin',
      notClaimingReason: 'because',
      lines: [aLine(), { taxRate: 0.1, taxExcludedAmount: null, taxIncludedAmount: null }],
      seq: 1,
    } as never);
    await db.put('receipts', {
      ...aReceipt({ id: 'undated' }),
      purchaseDate: '2026-13-45',
      seq: 2,
    });

    expect(await receiptRepository.get(db, 'damaged')).toMatchObject({
      status: 'logged',
      packingLocation: 'with_me',
      notClaimingReason: null,
      lines: [aLine()],
    });
    expect(await receiptRepository.get(db, 'undated')).toBeUndefined();
    expect((await receiptRepository.list(db, { tripId: 'trip-1' })).map((r) => r.id)).toEqual([
      'damaged',
    ]);
    expect(await db.count('receipts')).toBe(2);
  });

  it('refuses a receipt with no traveler and writes nothing', async () => {
    await expect(receiptRepository.put(db, aReceipt({ travelerId: '' }))).rejects.toMatchObject({
      code: 'invalid-record',
    });
    expect(await db.count('receipts')).toBe(0);
  });
});
