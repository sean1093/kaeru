import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeLine, normalizeReceipt } from './normalize.ts';
import { aLine, aReceipt } from './test-builders.ts';
import { droppedLineCount, resetUnreadableRecordCountsForTests } from './unreadable-records.ts';

beforeEach(() => {
  resetUnreadableRecordCountsForTests();
});

describe('normalizeLine', () => {
  it('rejects a value with no tax rate at all', () => {
    expect(normalizeLine({ taxExcludedAmount: 1000 })).toBeNull();
  });

  it('rejects a negative or non-finite tax rate', () => {
    expect(normalizeLine({ taxRate: -0.1, taxExcludedAmount: 1000 })).toBeNull();
    expect(normalizeLine({ taxRate: Number.NaN, taxExcludedAmount: 1000 })).toBeNull();
  });

  it('DR-070: rejects a line with neither amount — nothing here can be totalled', () => {
    expect(
      normalizeLine({ taxRate: 0.1, taxExcludedAmount: null, taxIncludedAmount: null }),
    ).toBeNull();
  });

  it('accepts a line with only one of the two amounts present', () => {
    expect(normalizeLine({ taxRate: 0.1, taxIncludedAmount: 1100 })).toMatchObject({
      taxExcludedAmount: null,
      taxIncludedAmount: 1100,
    });
  });
});

describe('normalizeReceipt', () => {
  it('returns null for a value that is not a record at all', () => {
    expect(normalizeReceipt(null)).toBeNull();
    expect(normalizeReceipt('not a receipt')).toBeNull();
    expect(normalizeReceipt(42)).toBeNull();
  });

  it('TC-DATA-017: drops a corrupt line but keeps the receipt, and tallies the drop so the amount is not silently trusted', () => {
    // Yi-chun's drugstore receipt: ¥3,000 @ 8% + ¥2,500 @ 10%, the second line corrupted.
    const stored = {
      ...aReceipt(),
      lines: [
        aLine({ taxRate: 0.08, taxExcludedAmount: 3000, taxIncludedAmount: 3240 }),
        { taxRate: 'ten percent', taxExcludedAmount: 2500, taxIncludedAmount: 2750 },
      ],
    };

    expect(droppedLineCount()).toBe(0);
    const receipt = normalizeReceipt(stored);

    // The receipt is not withheld — the shop, traveler and status are real — but it is
    // down to one line, and that is recorded rather than silently absorbed.
    expect(receipt?.lines).toEqual([
      aLine({ taxRate: 0.08, taxExcludedAmount: 3000, taxIncludedAmount: 3240 }),
    ]);
    expect(droppedLineCount()).toBe(1);
  });

  it('does not tally a drop for a receipt with no lines at all — there was nothing to drop', () => {
    normalizeReceipt({ ...aReceipt(), lines: [] });
    expect(droppedLineCount()).toBe(0);
  });

  it('tallies once per corrupt line, not once per receipt', () => {
    normalizeReceipt({
      ...aReceipt(),
      lines: [
        { taxRate: 0.1 }, // no amount at all
        { taxExcludedAmount: 500 }, // no tax rate at all
        aLine(),
      ],
    });
    expect(droppedLineCount()).toBe(2);
  });

  it('DR-012a: withholds a receipt with no usable shopKey rather than grouping it on the raw, un-normalised name', () => {
    const { shopKey: _omit, ...withoutShopKey } = aReceipt();
    expect(normalizeReceipt(withoutShopKey)).toBeNull();
    expect(normalizeReceipt({ ...aReceipt(), shopKey: '   ' })).toBeNull();
  });
});
