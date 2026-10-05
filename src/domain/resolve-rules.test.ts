import { describe, expect, it } from 'vitest';
import { fixedClock } from './clock.ts';
import { JAPAN_TIME_ZONE, TAIWAN_TIME_ZONE, today } from './dates.ts';
import {
  RulesGapError,
  resolveDated,
  resolveRules,
  resolveSystem,
  rulesReviewAgeDays,
  systemStatus,
} from './resolve-rules.ts';
import type { Dated } from './rules.ts';
import { kaeruRules, RATE_LABEL_KEYS } from './rules-data.ts';

const ratesOn = (on: string): readonly number[] =>
  resolveRules(kaeruRules, on).rates.map((o) => o.rate);

const labelOfRate = (on: string, rate: number): string | undefined =>
  resolveRules(kaeruRules, on).rates.find((option) => option.rate === rate)?.labelKey;

describe('resolveSystem — which system applies (DR-001, DR-002, DR-003)', () => {
  it('TC-DOM-001 resolves a 2026-10-31 purchase to the old system', () => {
    expect(resolveSystem(kaeruRules, '2026-10-31')).toBe('old');
  });

  it('TC-DOM-002 resolves a 2026-11-01 purchase to the refund system', () => {
    expect(resolveSystem(kaeruRules, '2026-11-01')).toBe('refund');
  });

  it('TC-DOM-003 resolves two receipts in one trip independently, with no transitional blend', () => {
    // One trip, two receipts, one day apart. There is no trip-level system flag to set.
    expect(resolveSystem(kaeruRules, '2026-10-31')).toBe('old');
    expect(resolveSystem(kaeruRules, '2026-11-01')).toBe('refund');
    // And no third answer anywhere near the boundary: the change is a step, not a ramp.
    const answers = new Set(
      ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'].map((on) =>
        resolveSystem(kaeruRules, on),
      ),
    );
    expect([...answers].sort()).toEqual(['old', 'refund']);
  });

  it('TC-DOM-005 decides from the purchase date alone, never from departure or logging date', () => {
    expect(resolveSystem(kaeruRules, '2026-10-31')).toBe('old');
    expect(resolveSystem(kaeruRules, kaeruRules.system.refundSystemStart)).toBe('refund');
    // The prohibition, structurally: resolution takes (rules, purchaseDate) and nothing
    // else — no trip, no clock, no "logged at" — so editing a departure date or logging a
    // receipt a week late has no input to change.
    expect(resolveSystem.length).toBe(2);
  });

  it('TC-DOM-004 @unconfirmed resolves from the JST calendar date, not the device one (UR-07)', () => {
    // 2026-10-31 23:30 in Taipei is already 2026-11-01 00:30 in Japan.
    const inTaipei = fixedClock('2026-10-31T23:30:00+08:00');
    expect(today(inTaipei, TAIWAN_TIME_ZONE)).toBe('2026-10-31');
    expect(today(inTaipei, JAPAN_TIME_ZONE)).toBe('2026-11-01');
    expect(resolveSystem(kaeruRules, today(inTaipei, JAPAN_TIME_ZONE))).toBe('refund');
    // The bug this guards: defaulting the purchase date from the device calendar would
    // file the same purchase under the old system and drop it out of Airport Mode.
    expect(resolveSystem(kaeruRules, today(inTaipei, TAIWAN_TIME_ZONE))).toBe('old');
  });

  it('TC-DOM-004 @unconfirmed holds across a 16-hour offset (America/Los_Angeles)', () => {
    const inLosAngeles = fixedClock('2026-10-31T08:30:00-07:00');
    expect(today(inLosAngeles, 'America/Los_Angeles')).toBe('2026-10-31');
    expect(today(inLosAngeles, JAPAN_TIME_ZONE)).toBe('2026-11-01');
    expect(resolveSystem(kaeruRules, today(inLosAngeles, JAPAN_TIME_ZONE))).toBe('refund');
  });
});

describe('resolveRules — the rate table (DR-023, UR-08)', () => {
  it('resolves the 10% / 8% pair for a purchase under the new system today', () => {
    expect(ratesOn('2026-11-01')).toEqual([0.1, 0.08]);
    expect(resolveRules(kaeruRules, '2026-11-01').status.rates).toBe('confirmed-official');
  });

  it('TC-DOM-041 @unconfirmed offers 1% for food on 2027-04-02, not 8%', () => {
    expect(labelOfRate('2027-04-02', 0.01)).toBe(RATE_LABEL_KEYS.food);
    expect(labelOfRate('2027-04-02', 0.08)).toBe(RATE_LABEL_KEYS.newspapers);
  });

  it('TC-DOM-042 @unconfirmed switches food from 8% to 1% on the effective-from day itself', () => {
    expect(ratesOn('2027-03-31')).toEqual([0.1, 0.08]);
    expect(labelOfRate('2027-03-31', 0.08)).toBe(RATE_LABEL_KEYS.foodAndNewspapers);
    expect(ratesOn('2027-04-01')).toContain(0.01);
    expect(labelOfRate('2027-04-01', 0.01)).toBe(RATE_LABEL_KEYS.food);
  });

  it('TC-DOM-043 @unconfirmed returns food to 8% the day after the window closes', () => {
    expect(ratesOn('2029-03-31')).toContain(0.01);
    expect(ratesOn('2029-04-01')).toEqual([0.1, 0.08]);
    expect(labelOfRate('2029-04-01', 0.08)).toBe(RATE_LABEL_KEYS.foodAndNewspapers);
  });

  it('TC-DOM-044 @unconfirmed keeps subscribed newspapers at 8% while food is at 1%', () => {
    const rates = resolveRules(kaeruRules, '2028-01-01').rates;
    expect(rates).toContainEqual({ rate: 0.08, labelKey: RATE_LABEL_KEYS.newspapers });
    expect(rates).toContainEqual({ rate: 0.01, labelKey: RATE_LABEL_KEYS.food });
  });

  it('reports the status of each series separately, so a screen caveats only what needs it', () => {
    const atLaunch = resolveRules(kaeruRules, '2026-11-01');
    // The threshold is official; the fee-warning floor is our judgement sized to reported
    // evidence. A single flag would either caveat both or neither, and both are wrong.
    expect(atLaunch.status.threshold).toBe('confirmed-official');
    expect(atLaunch.status.rates).toBe('confirmed-official');
    expect(atLaunch.status.fee).toBe('reported-media');

    const inTheWindow = resolveRules(kaeruRules, '2027-05-01');
    expect(inTheWindow.status.rates).toBe('pending-legislation');
    expect(inTheWindow.status.threshold).toBe('confirmed-official');

    // The row that reopens 8% on 2029-04-01 shares the pending row's fate: that date
    // exists only as the tail of the 1% window.
    expect(resolveRules(kaeruRules, '2029-04-01').status.rates).toBe('pending-legislation');
  });

  it('carries the system boundary through so a receipt set can be classified per receipt', () => {
    // One ResolvedRules is shared across a receipt set, so the boundary travels with it
    // and is compared against each receipt's own purchase date, never against `on`.
    const rules = resolveRules(kaeruRules, '2026-11-10');
    expect(rules.system.refundSystemStart).toBe('2026-11-01');
    expect(rules.on).toBe('2026-11-10');
  });

  it('resolves the threshold, window, high-value and fee rules for an old-system purchase', () => {
    // A trip may hold receipts from either side of the boundary and the app renders both.
    const rules = resolveRules(kaeruRules, '2026-10-31');
    expect(rules.threshold.minTaxExcludedJpy).toBeGreaterThan(0);
    expect(rules.deadline.exportWindowDays).toBeGreaterThan(0);
    expect(rules.highValue.unitPriceJpy).toBeGreaterThan(0);
    expect(rules.fee.warnBelowJpy).toBeGreaterThan(0);
  });
});

describe('resolveDated', () => {
  const series: readonly Dated<string>[] = [
    {
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-06-30',
      value: 'first',
      status: 'confirmed-official',
      source: 'test',
    },
    {
      effectiveFrom: '2026-08-01',
      effectiveTo: null,
      value: 'second',
      status: 'confirmed-official',
      source: 'test',
    },
  ];

  it('treats both bounds as inclusive', () => {
    expect(resolveDated(series, '2026-01-01').value).toBe('first');
    expect(resolveDated(series, '2026-06-30').value).toBe('first');
    expect(resolveDated(series, '2026-08-01').value).toBe('second');
    expect(resolveDated(series, '2030-12-31').value).toBe('second');
  });

  it('throws on a gap rather than resolving to a neighbouring row', () => {
    expect(() => resolveDated(series, '2026-07-15')).toThrow(RulesGapError);
    expect(() => resolveDated(series, '2025-12-31')).toThrow(RulesGapError);
    expect(() => resolveDated([], '2026-07-15')).toThrow(RulesGapError);
  });

  it('names the date and the covered ranges in the error, with a code for the message layer', () => {
    try {
      resolveDated(series, '2026-07-15');
      expect.unreachable('expected a RulesGapError');
    } catch (error) {
      expect(error).toBeInstanceOf(RulesGapError);
      const gap = error as RulesGapError;
      expect(gap.code).toBe('rules.gap');
      expect(gap.on).toBe('2026-07-15');
      expect(gap.message).toContain('2026-01-01..2026-06-30');
      expect(gap.message).toContain('2026-08-01..open');
    }
  });

  it('refuses a purchase date older than the rules document covers', () => {
    expect(() => resolveRules(kaeruRules, '2019-09-30')).toThrow(RulesGapError);
  });
});

describe('systemStatus', () => {
  it('counts down in Japan time before the system starts', () => {
    expect(systemStatus(fixedClock('2026-10-05T00:00:00+09:00'))).toEqual({
      phase: 'before',
      start: '2026-11-01',
      daysUntilStart: 27,
    });
  });

  it('flips to active on the start date itself', () => {
    expect(systemStatus(fixedClock('2026-11-01T00:00:00+09:00')).phase).toBe('active');
    expect(systemStatus(fixedClock('2026-10-31T23:59:00+09:00')).phase).toBe('before');
  });

  it('stays active afterwards with a negative count', () => {
    expect(systemStatus(fixedClock('2026-11-11T09:00:00+09:00')).daysUntilStart).toBe(-10);
  });

  it('honours an explicit time zone', () => {
    const lateInTaipei = fixedClock('2026-10-31T23:30:00+08:00');
    expect(systemStatus(lateInTaipei, kaeruRules, TAIWAN_TIME_ZONE).phase).toBe('before');
    expect(systemStatus(lateInTaipei).phase).toBe('active');
  });

  it('reads the start date from the rules document, not from a module constant', () => {
    const moved = { ...kaeruRules, system: { refundSystemStart: '2027-01-01' } };
    const status = systemStatus(fixedClock('2026-11-01T00:00:00+09:00'), moved);
    expect(status).toEqual({ phase: 'before', start: '2027-01-01', daysUntilStart: 61 });
  });
});

describe('rulesReviewAgeDays', () => {
  it('TC-DOM-052 reports the age of the review date in Japan time', () => {
    const rules = { ...kaeruRules, lastReviewed: '2026-10-05' };
    expect(rulesReviewAgeDays(fixedClock('2026-10-05T10:00:00+09:00'), rules)).toBe(0);
    expect(rulesReviewAgeDays(fixedClock('2027-04-03T10:00:00+09:00'), rules)).toBe(180);
    expect(rulesReviewAgeDays(fixedClock('2027-04-04T10:00:00+09:00'), rules)).toBe(181);
  });
  it('TC-DOM-052 counts in Japan time by default, never in the device calendar', () => {
    const rules = { ...kaeruRules, lastReviewed: '2026-10-05' };
    // 2027-04-03 08:00 in Japan is still 2027-04-02 in Los Angeles.
    const instant = fixedClock('2027-04-03T08:00:00+09:00');
    expect(rulesReviewAgeDays(instant, rules)).toBe(180);
    expect(rulesReviewAgeDays(instant, rules, 'America/Los_Angeles')).toBe(179);
  });
});
