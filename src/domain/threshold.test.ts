import { describe, expect, it } from 'vitest';
import { aLine, aReceipt } from '../test-support/domain.ts';
import type { Receipt } from './model.ts';
import { resolveRules } from './resolve-rules.ts';
import { kaeruRules } from './rules-data.ts';
import { shopKeyOf } from './shop-key.ts';
import { groupByShopDay } from './threshold.ts';

const rules = resolveRules(kaeruRules, '2026-11-10');

/** One receipt at one shop on one day, for a total the test names. */
function receiptFor(overrides: Partial<Receipt> & { excluded?: number } = {}): Receipt {
  const { excluded, ...rest } = overrides;
  return aReceipt({
    ...(excluded === undefined ? {} : { lines: [aLine({ taxExcludedAmount: excluded })] }),
    ...rest,
  });
}

const totalOf = (receipts: readonly Receipt[]): number =>
  groupByShopDay(receipts, rules)[0]?.taxExcludedTotal ?? -1;

const onlyGroup = (receipts: readonly Receipt[]) => {
  const groups = groupByShopDay(receipts, rules);
  expect(groups).toHaveLength(1);
  return groups[0];
};

describe('the ¥5,000 boundary (DR-010, DR-011)', () => {
  it('TC-DOM-011 does not qualify at 4,999 and says one yen is missing', () => {
    const group = onlyGroup([receiptFor({ excluded: 4999 })]);
    expect(group?.taxExcludedTotal).toBe(4999);
    expect(group?.meetsThreshold).toBe(false);
    expect(group?.shortfall).toBe(1);
  });

  it('TC-DOM-012 qualifies at exactly 5,000: the boundary is inclusive', () => {
    const group = onlyGroup([receiptFor({ excluded: 5000 })]);
    expect(group?.meetsThreshold).toBe(true);
    expect(group?.shortfall).toBe(0);
  });

  it('TC-DOM-013 qualifies at 5,001', () => {
    expect(onlyGroup([receiptFor({ excluded: 5001 })])?.meetsThreshold).toBe(true);
  });

  it('TC-DOM-014 refuses a tax-included 5,000 at 10%, which is 4,545 excluded', () => {
    // The traveller misconception that must not become a bug.
    const group = onlyGroup([
      receiptFor({ lines: [aLine({ taxRate: 0.1, taxIncludedAmount: 5000 })] }),
    ]);
    expect(group?.taxExcludedTotal).toBe(4545);
    expect(group?.meetsThreshold).toBe(false);
    expect(group?.shortfall).toBe(455);
  });

  it('TC-DOM-015 qualifies on a tax-included 5,500 at 10%, from a derived figure', () => {
    const line = aLine({ taxRate: 0.1, taxIncludedAmount: 5500 });
    const group = onlyGroup([receiptFor({ lines: [line] })]);
    expect(group?.taxExcludedTotal).toBe(5000);
    expect(group?.meetsThreshold).toBe(true);
    // The figure is derived, so whatever renders it must say so (DR-022).
    expect(group?.receipts[0]?.lines[0]?.taxIncludedAmount).toBe(5500);
    expect(group?.receipts[0]?.lines[0]?.taxExcludedAmount).toBeNull();
  });

  it('TC-DOM-016 qualifies on a tax-included 5,400 at 8%, from a derived figure', () => {
    const group = onlyGroup([
      receiptFor({ lines: [aLine({ taxRate: 0.08, taxIncludedAmount: 5400 })] }),
    ]);
    expect(group?.taxExcludedTotal).toBe(5000);
    expect(group?.meetsThreshold).toBe(true);
  });

  it('TC-DOM-022 qualifies at 700,000: there is no upper limit and no consumables cap', () => {
    const group = onlyGroup([receiptFor({ excluded: 700_000 })]);
    expect(group?.meetsThreshold).toBe(true);
    expect(group?.shortfall).toBe(0);
  });

  it('reads the boundary from the rules document rather than knowing it', () => {
    const moved = resolveRules(
      {
        ...kaeruRules,
        threshold: [
          {
            effectiveFrom: '2019-10-01',
            effectiveTo: null,
            status: 'confirmed-official',
            source: 'fixture',
            value: { minTaxExcludedJpy: 8000 },
          },
        ],
      },
      '2026-11-10',
    );
    const groups = groupByShopDay([receiptFor({ excluded: 5000 })], moved);
    expect(groups[0]?.meetsThreshold).toBe(false);
    expect(groups[0]?.shortfall).toBe(3000);
  });
});

describe('grouping by shop, day and traveller (DR-012, UR-01, UR-02)', () => {
  it('TC-DOM-018 @unconfirmed aggregates two receipts at one shop on one day, keeping both figures', () => {
    const groups = groupByShopDay(
      [receiptFor({ id: 'a', excluded: 3000 }), receiptFor({ id: 'b', excluded: 2500 })],
      rules,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.taxExcludedTotal).toBe(5500);
    expect(groups[0]?.meetsThreshold).toBe(true);
    // The per-receipt figures survive, because the copy has to show both and never
    // promise that the shop will combine them.
    expect(groups[0]?.receipts.map((receipt) => receipt.id)).toEqual(['a', 'b']);
  });

  it('TC-DOM-017 @unconfirmed keeps two travellers at one shop on one day apart', () => {
    const groups = groupByShopDay(
      [
        receiptFor({ id: 'a', travelerId: 'traveler-1', excluded: 3000 }),
        receiptFor({ id: 'b', travelerId: 'traveler-2', excluded: 2500 }),
      ],
      rules,
    );
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.meetsThreshold)).toEqual([false, false]);
    expect(groups.map((group) => group.travelerId)).toEqual(['traveler-1', 'traveler-2']);
  });

  it('TC-DOM-019 does not aggregate the same shop across two days', () => {
    const groups = groupByShopDay(
      [
        receiptFor({ id: 'a', purchaseDate: '2026-11-10', excluded: 3000 }),
        receiptFor({ id: 'b', purchaseDate: '2026-11-11', excluded: 2500 }),
      ],
      rules,
    );
    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.meetsThreshold)).toBe(false);
    // Newest first, deterministically.
    expect(groups.map((group) => group.purchaseDate)).toEqual(['2026-11-11', '2026-11-10']);
  });

  it('TC-DOM-020 does not aggregate two shops on one day', () => {
    const groups = groupByShopDay(
      [
        receiptFor({ id: 'a', shopKey: 'bic camera shinjuku', excluded: 3000 }),
        receiptFor({ id: 'b', shopKey: 'donki shibuya', excluded: 2500 }),
      ],
      rules,
    );
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.shopKey)).toEqual(['bic camera shinjuku', 'donki shibuya']);
  });

  it('TC-DOM-030 @unconfirmed treats two tenants of one department store as two shops', () => {
    const groups = groupByShopDay(
      [
        receiptFor({ id: 'a', shopKey: shopKeyOf('伊勢丹新宿 ユニクロ'), excluded: 3000 }),
        receiptFor({ id: 'b', shopKey: shopKeyOf('伊勢丹新宿 無印良品'), excluded: 2500 }),
      ],
      rules,
    );
    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.meetsThreshold)).toBe(false);
  });

  it('groups by the stored shopKey, so a manual merge survives a re-render', () => {
    // The user merged two spellings by rewriting one receipt's key; recomputing from
    // shopName would silently undo that on the next render.
    const groups = groupByShopDay(
      [
        receiptFor({ id: 'a', shopName: 'マツキヨ', shopKey: 'matsumotokiyoshi', excluded: 3000 }),
        receiptFor({ id: 'b', shopName: '松本清', shopKey: 'matsumotokiyoshi', excluded: 2500 }),
      ],
      rules,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.taxExcludedTotal).toBe(5500);
  });

  it('returns nothing for no receipts rather than an empty group', () => {
    expect(groupByShopDay([], rules)).toEqual([]);
  });

  it('sums a mixed-rate receipt on its tax-excluded figures', () => {
    expect(
      totalOf([
        receiptFor({
          lines: [
            aLine({ taxRate: 0.08, taxExcludedAmount: 3000 }),
            aLine({ taxRate: 0.1, taxExcludedAmount: 2500 }),
          ],
        }),
      ]),
    ).toBe(5500);
  });
});

describe('shopKeyOf (DR-012a)', () => {
  it('collapses full-width and half-width forms to one key', () => {
    expect(shopKeyOf('ＢＩＣ ＣＡＭＥＲＡ')).toBe(shopKeyOf('BIC CAMERA'));
    expect(shopKeyOf('ﾄﾞﾝ･ｷﾎｰﾃ')).toBe(shopKeyOf('ドン・キホーテ'));
  });

  it('collapses case and spacing differences', () => {
    expect(shopKeyOf('  Bic   Camera  ')).toBe('bic camera');
    expect(shopKeyOf('BIC CAMERA')).toBe(shopKeyOf('bic camera'));
    expect(shopKeyOf('Bic\u3000Camera')).toBe('bic camera');
    expect(shopKeyOf('Bic\tCamera\n')).toBe('bic camera');
  });

  it('keeps different scripts and branch names apart, because guessing would invent a fact', () => {
    const keys = ['松本清', 'マツキヨ', '松本清 新宿東口店'].map(shopKeyOf);
    expect(new Set(keys).size).toBe(3);
  });

  it('survives an empty name without producing a key that merges everything', () => {
    expect(shopKeyOf('   ')).toBe('');
  });
});

describe('the indicator is advice, not a verdict (UR-02, DR-075, DR-080)', () => {
  it('reports an arithmetic comparison and nothing that reads as a guarantee', () => {
    const group = onlyGroup([receiptFor({ excluded: 5000 })]);
    expect(Object.keys(group ?? {}).sort()).toEqual([
      'meetsThreshold',
      'purchaseDate',
      'receipts',
      'shopKey',
      'shortfall',
      'taxExcludedTotal',
      'travelerId',
    ]);
    // No `qualifies`, `eligible`, `guaranteed` or `refundable`: a caller cannot render a
    // promise it was never given, and whether a shop aggregates is unsettled.
    for (const forbidden of ['qualifies', 'eligible', 'guaranteed', 'refundable', 'approved']) {
      expect(group).not.toHaveProperty(forbidden);
    }
  });
  it('TC-DOM-023 models no quantity anywhere, because the rule is not a number', () => {
    // DR-015 limits quantity to what the traveller can personally carry out, which is a
    // judgement and must never be implemented as a number. The model holds one line per
    // tax rate and no item list, so there is nothing to count.
    const receipt = receiptFor({ excluded: 5000 });
    const fields = [...Object.keys(receipt), ...Object.keys(receipt.lines[0] ?? {})];
    for (const field of fields) {
      expect(field).not.toMatch(/quantity|qty|units|pieces/i);
    }
    expect(receipt.lines.every((line) => !('quantity' in line))).toBe(true);
  });

  it('TC-DOM-029 models no separate shipment or direct shipping', () => {
    const receipt = receiptFor({ excluded: 5000 });
    for (const field of Object.keys(receipt)) {
      expect(field).not.toMatch(/shipping|shipment|forward|送/i);
    }
  });
});
