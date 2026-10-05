import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveRules, resolveSystem } from './resolve-rules.ts';
import type { Dated, RulesData } from './rules.ts';
import { kaeruRules, RULES_REVIEW_MAX_AGE_DAYS } from './rules-data.ts';

const DOMAIN_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Rule constants that may appear in `rules-data.ts` and nowhere else under `src/domain`
 * (`DR-022`, R19). The point is not tidiness: a threshold inlined into a conditional is a
 * rule change that needs a code change, which is how a stale rate ships.
 */
const FORBIDDEN_CONSTANTS: readonly { rule: string; what: string; pattern: RegExp }[] = [
  { rule: 'DR-010', what: 'the 5,000 yen threshold', pattern: /\b5_?000\b/ },
  { rule: 'DR-016', what: 'the 1,000,000 yen unit price', pattern: /\b1_?000_?000\b/ },
  { rule: 'DR-027', what: 'the 2,000 yen fee warning floor', pattern: /\b2_?000\b/ },
  { rule: 'DR-031', what: 'the 90-day export window', pattern: /\b90\b/ },
  { rule: 'DR-023', what: 'a tax rate', pattern: /\b\d*\.\d+\b/ },
  { rule: 'DR-001', what: 'an effective date', pattern: /\b\d{4}-\d{2}-\d{2}\b/ },
];

/** Comments quote the rules on purpose; only executable text is scanned. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('the rules document is the only place a rule constant lives', () => {
  const sources = readdirSync(DOMAIN_DIR)
    .filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.test.ts') && name !== 'rules-data.ts',
    )
    .map((name) => ({ name, code: withoutComments(readFileSync(join(DOMAIN_DIR, name), 'utf8')) }));

  it('finds domain sources to scan', () => {
    expect(sources.length).toBeGreaterThan(3);
  });

  for (const { rule, what, pattern } of FORBIDDEN_CONSTANTS) {
    it(`${rule} keeps ${what} out of every other module under src/domain`, () => {
      const offenders = sources
        .filter(({ code }) => pattern.test(code))
        .map(({ name }) => `${name} (${rule}: ${what})`);
      expect(offenders).toEqual([]);
    });
  }
});

describe('the shipped rules document', () => {
  it('TC-DOM-006 carries no eligibility rule, so no input from section 2 can gate a save (DR-008)', () => {
    // Kaeru informs; the shop decides. Adding a residency, entry-date or document rule to
    // the document would be the first step towards blocking a save, so the shape is pinned.
    expect(Object.keys(kaeruRules).sort()).toEqual([
      'deadline',
      'fee',
      'highValue',
      'lastReviewed',
      'rates',
      'system',
      'threshold',
      'version',
    ]);
  });

  it('states the values domain-rules.md section 1 publishes', () => {
    const rules = resolveRules(kaeruRules, '2026-11-01');
    expect(rules.threshold.minTaxExcludedJpy).toBe(5000);
    expect(rules.deadline.exportWindowDays).toBe(90);
    expect(rules.highValue.unitPriceJpy).toBe(1000000);
    expect(rules.fee.warnBelowJpy).toBe(2000);
    expect(kaeruRules.system.refundSystemStart).toBe('2026-11-01');
  });

  it('cites a source and a status on every dated row', () => {
    const series: readonly (readonly Dated<unknown>[])[] = [
      kaeruRules.rates,
      kaeruRules.threshold,
      kaeruRules.deadline,
      kaeruRules.highValue,
      kaeruRules.fee,
    ];
    for (const rows of series) {
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.source).not.toBe('');
        expect(row.status).toBeTruthy();
      }
    }
  });

  it('leaves no gap between consecutive rows of a series', () => {
    for (const rows of [kaeruRules.rates, kaeruRules.threshold, kaeruRules.deadline]) {
      for (let i = 1; i < rows.length; i += 1) {
        const previous = rows[i - 1];
        const current = rows[i];
        if (!previous || !current || previous.effectiveTo === null) continue;
        // Previous row ends the day before the next begins: no hole, no overlap.
        const dayAfter = new Date(`${previous.effectiveTo}T00:00:00Z`);
        dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
        expect(current.effectiveFrom).toBe(dayAfter.toISOString().slice(0, 10));
      }
    }
  });

  it('keeps the review policy with the data it governs', () => {
    expect(RULES_REVIEW_MAX_AGE_DAYS).toBe(180);
    expect(kaeruRules.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('TC-DOM-045 the rate table is data, not code', () => {
  /** A rules document nobody has ever shipped, to prove the resolver reads rather than knows. */
  const fixture: RulesData = {
    version: 99,
    lastReviewed: '2030-01-01',
    system: { refundSystemStart: '2030-06-01' },
    rates: [
      {
        effectiveFrom: '2030-01-01',
        effectiveTo: '2030-12-31',
        status: 'pending-legislation',
        source: 'fixture',
        value: [{ rate: 0.05, labelKey: 'rates.invented' }],
      },
      {
        effectiveFrom: '2031-01-01',
        effectiveTo: null,
        status: 'confirmed-official',
        source: 'fixture',
        value: [{ rate: 0.07, labelKey: 'rates.invented' }],
      },
    ],
    threshold: [
      {
        effectiveFrom: '2030-01-01',
        effectiveTo: null,
        status: 'confirmed-official',
        source: 'fixture',
        value: { minTaxExcludedJpy: 12345 },
      },
    ],
    deadline: [
      {
        effectiveFrom: '2030-01-01',
        effectiveTo: null,
        status: 'confirmed-official',
        source: 'fixture',
        value: { exportWindowDays: 7 },
      },
    ],
    highValue: [
      {
        effectiveFrom: '2030-01-01',
        effectiveTo: null,
        status: 'confirmed-official',
        source: 'fixture',
        value: { unitPriceJpy: 42 },
      },
    ],
    fee: [
      {
        effectiveFrom: '2030-01-01',
        effectiveTo: null,
        status: 'confirmed-official',
        source: 'fixture',
        value: { warnBelowJpy: 1 },
      },
    ],
  };

  it('resolves an invented rate table with no change under src/domain', () => {
    expect(resolveRules(fixture, '2030-02-02').rates).toEqual([
      { rate: 0.05, labelKey: 'rates.invented' },
    ]);
    expect(resolveRules(fixture, '2031-02-02').rates).toEqual([
      { rate: 0.07, labelKey: 'rates.invented' },
    ]);
  });

  it('resolves an invented threshold, window, unit price and fee floor', () => {
    const rules = resolveRules(fixture, '2030-02-02');
    expect(rules.threshold.minTaxExcludedJpy).toBe(12345);
    expect(rules.deadline.exportWindowDays).toBe(7);
    expect(rules.highValue.unitPriceJpy).toBe(42);
    expect(rules.fee.warnBelowJpy).toBe(1);
    expect(rules.provisional).toBe(true);
  });

  it('moves the system boundary with the document', () => {
    expect(resolveSystem(fixture, '2030-05-31')).toBe('old');
    expect(resolveSystem(fixture, '2030-06-01')).toBe('refund');
  });
});
