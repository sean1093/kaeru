/**
 * The shipped rules document.
 *
 * Every rate, threshold, window and money constant Kaeru knows lives here, dated, sourced
 * and reviewed. Nothing under `src/domain` may repeat one of these values in a
 * conditional — `rules-data.test.ts` asserts that mechanically — because the rules are
 * still moving: the whole tax-free system changes on 2026-11-01 (`DR-001`) and the
 * consumption tax on food and drink is scheduled to fall to 1% for two years from
 * 2027-04-01 on a bill that has not passed (`DR-023`, `UR-08`). Changing a rule is a
 * change to this file plus a review by the travel expert, never a code change.
 *
 * Source of truth: `docs/product/domain-rules.md`. Source IDs resolve in
 * `docs/research/tax-free-system-2026.md`.
 */
import type { CalendarDate } from './dates.ts';
import type { RulesData } from './rules.ts';

/**
 * Earliest purchase date this document covers: the day the current 10% / 8% pair took
 * effect. Before it Kaeru cannot compute tax at all, so a purchase dated earlier fails
 * resolution loudly rather than being costed against the wrong rate.
 *
 * Every series is continuous from here, including the two that are refund-system rules
 * (`deadline`, `highValue`). They have to be: a trip may hold receipts from either side of
 * the 2026-11-01 boundary (`TC-DOM-003`) and the caller resolves on each receipt's own
 * purchase date, so a pre-reform gap would throw on a receipt the app must still render.
 * Resolving them before the reform is harmless because old-system receipts never reach
 * customs and never consult a deadline or a documents flag (`DR-003`, `DR-064`).
 */
const RULES_EPOCH: CalendarDate = '2019-10-01';

/**
 * Message keys for the rate picker, owned by the content layer. They name what a rate
 * covers rather than its number, because the number is what changes.
 */
export const RATE_LABEL_KEYS = {
  mostGoods: 'rates.mostGoods',
  foodAndNewspapers: 'rates.foodAndNewspapers',
  food: 'rates.food',
  newspapers: 'rates.newspapers',
} as const;

export const kaeruRules: RulesData = {
  version: 1,
  lastReviewed: '2026-10-05',

  system: {
    // DR-001: no transitional period. A purchase on 2026-10-31 is an old-system purchase.
    refundSystemStart: '2026-11-01',
  },

  rates: [
    {
      effectiveFrom: RULES_EPOCH,
      effectiveTo: '2027-03-31',
      status: 'confirmed-official',
      source: 'DR-023 [S6][S8] — 10% standard, 8% reduced since 2019-10-01',
      value: [
        { rate: 0.1, labelKey: RATE_LABEL_KEYS.mostGoods },
        { rate: 0.08, labelKey: RATE_LABEL_KEYS.foodAndNewspapers },
      ],
    },
    {
      effectiveFrom: '2027-04-01',
      effectiveTo: '2029-03-31',
      status: 'pending-legislation',
      source: 'DR-023, UR-08 [S10] — cabinet decision 2026-09-15, bill not yet passed',
      value: [
        { rate: 0.1, labelKey: RATE_LABEL_KEYS.mostGoods },
        // Food and drink drop to 1% for two years; subscribed newspapers stay at 8%,
        // which is why this window needs two reduced rates rather than one (TC-DOM-044).
        { rate: 0.01, labelKey: RATE_LABEL_KEYS.food },
        { rate: 0.08, labelKey: RATE_LABEL_KEYS.newspapers },
      ],
    },
    {
      effectiveFrom: '2029-04-01',
      effectiveTo: null,
      // Pending for the same reason row 2 is: 8% survives the bill failing, but a rate
      // *change* on 2029-04-01 exists only as the tail of the 1% window. The two rows
      // share a fate — if the bill fails, both are deleted and row 1 reopens — and
      // matching statuses make deleting both the obvious edit rather than leaving a
      // two-year gap that throws on resolution.
      status: 'pending-legislation',
      source: 'DR-023, UR-08 [S10] — the 1% window ends and the reduced rate returns to 8%',
      value: [
        { rate: 0.1, labelKey: RATE_LABEL_KEYS.mostGoods },
        { rate: 0.08, labelKey: RATE_LABEL_KEYS.foodAndNewspapers },
      ],
    },
  ],

  threshold: [
    {
      effectiveFrom: RULES_EPOCH,
      effectiveTo: null,
      status: 'confirmed-official',
      source: 'DR-010, DR-011 [S1][S5][S7] — tax-excluded, inclusive boundary',
      value: { minTaxExcludedJpy: 5000 },
    },
  ],

  deadline: [
    {
      effectiveFrom: RULES_EPOCH,
      effectiveTo: null,
      status: 'confirmed-official',
      source:
        'DR-031, DR-076a [S1][S7] — day after purchase to the 90th day, inclusive; a ' +
        'margin of 3 days or less against the departure date counts as none, because a ' +
        '90-day visa-free stay and a 90-day export window land on exactly zero; ' +
        'refund-method ' +
        'rule, rows before 2026-11-01 exist only so resolution is total and are never read ' +
        'for an old-system receipt (DR-003, DR-064)',
      value: { exportWindowDays: 90, slackWarnDays: 3 },
    },
  ],

  highValue: [
    {
      effectiveFrom: RULES_EPOCH,
      effectiveTo: null,
      status: 'confirmed-official',
      source:
        'DR-016 [S2][S5][S7] — serial numbers transmitted, documents may be requested; ' +
        'refund-method rule, rows before 2026-11-01 exist only so resolution is total and ' +
        'are never read for an old-system receipt (DR-003, DR-064)',
      value: { unitPriceJpy: 1000000 },
    },
  ],

  fee: [
    {
      effectiveFrom: RULES_EPOCH,
      effectiveTo: null,
      status: 'reported-media',
      source:
        'DR-027 [S3][S18][S19][S20] — no legal cap on fees; floor sized to the reported ' +
        'NT$200-400 inbound band; Kaeru product decision',
      value: { warnBelowJpy: 2000 },
    },
  ],
};

/**
 * How stale `lastReviewed` may get before a machine files an issue (`TC-DOM-052`).
 *
 * It lives beside the data it governs rather than in the workflow that enforces it, so
 * changing the review cadence is still a change to the rules document. The check runs on a
 * weekly schedule, deliberately not in the pull-request pipeline: a stale review date is a
 * reason to look at the rules, never a reason to red a pull request on a day nobody pushed.
 */
export const RULES_REVIEW_MAX_AGE_DAYS = 180;

/**
 * How far ahead the same weekly check looks for a `pending-legislation` row that is about
 * to take effect, in days.
 *
 * The review-age check alone is not enough: `lastReviewed` plus the review window falls
 * due on 2027-04-03, two days *after* the 1% food window opens, so the one scheduled
 * prompt to look at the rules would arrive just too late to catch the largest change in
 * the file. This one fires while there is still time to act, and it generalises to the
 * next pending rule rather than being a fix for this one.
 */
export const RULES_PENDING_LOOKAHEAD_DAYS = 60;
