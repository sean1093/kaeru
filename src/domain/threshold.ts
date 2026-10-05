/**
 * The ¥5,000 threshold, as an indicator rather than a verdict.
 *
 * Three things this module is careful about:
 *
 * - **It judges the tax-excluded figure, never the tax-inclusive one** (`DR-011`). A
 *   ¥5,000 tax-included purchase is ¥4,545 excluded and does not qualify, which is the
 *   traveller misconception the product exists to correct rather than repeat.
 * - **It groups by shop, JST day and traveller** (`DR-012`, `UR-01`). Eligibility attaches
 *   to one passport, so two travellers at one shop on one day do not combine.
 * - **It never promises anything.** Whether a shop actually aggregates two receipts is
 *   unsettled (`UR-02`), so the group reports a total and an arithmetic comparison, and
 *   the copy that renders it says aggregation depends on the shop. `DR-075` informs and
 *   `DR-080` never blocks.
 */
import type { GroupByShopDay, ShopDayGroup } from './api.ts';
import type { CalendarDate } from './dates.ts';
import type { Receipt, TravelerId } from './model.ts';
import { taxExcludedTotalOf } from './money.ts';
import { shopKeyOf } from './shop-key.ts';

interface Bucket {
  shopKey: string;
  purchaseDate: CalendarDate;
  travelerId: TravelerId;
  receipts: Receipt[];
}

/**
 * Group a receipt set for the threshold indicator.
 *
 * Grouping uses the stored `shopKey`, not a key recomputed from `shopName`, because that
 * is the field a manual merge rewrites — recomputing would silently undo the user's
 * correction on the next render.
 *
 * Order is deterministic and newest first: purchase date descending, then shop, then
 * traveller. Receipts keep their input order within a group, so a caller that sorted them
 * sees its own order preserved.
 */
export const groupByShopDay: GroupByShopDay = (receipts, rules): readonly ShopDayGroup[] => {
  const buckets = new Map<string, Bucket>();
  for (const receipt of receipts) {
    // A receipt whose shop name normalises to nothing has no identity to share, so it gets
    // a bucket of its own keyed by its id. Merging unnamed receipts would invent a total
    // neither of them earned — an error in the optimistic direction, which is the one
    // direction this indicator must never err in.
    const identity =
      shopKeyOf(receipt.shopKey) === null ? `\u0000id:${receipt.id}` : receipt.shopKey;
    // NUL joins the three parts so no shop name can forge a key boundary.
    const key = `${identity}\u0000${receipt.purchaseDate}\u0000${receipt.travelerId}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.receipts.push(receipt);
      continue;
    }
    buckets.set(key, {
      shopKey: receipt.shopKey,
      purchaseDate: receipt.purchaseDate,
      travelerId: receipt.travelerId,
      receipts: [receipt],
    });
  }

  const minimum = rules.threshold.minTaxExcludedJpy;
  return [...buckets.values()]
    .map((bucket) => {
      const taxExcludedTotal = bucket.receipts.reduce(
        (total, receipt) => total + taxExcludedTotalOf(receipt),
        0,
      );
      return {
        ...bucket,
        taxExcludedTotal,
        meetsThreshold: taxExcludedTotal >= minimum,
        shortfall: Math.max(0, minimum - taxExcludedTotal),
      };
    })
    .sort(
      (a, b) =>
        b.purchaseDate.localeCompare(a.purchaseDate) ||
        a.shopKey.localeCompare(b.shopKey) ||
        a.travelerId.localeCompare(b.travelerId),
    );
};
