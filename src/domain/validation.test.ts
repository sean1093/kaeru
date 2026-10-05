import { describe, expect, it } from 'vitest';
import { aLine, aReceipt, aTrip } from '../test-support/domain.ts';
import type { ValidationFinding } from './api.ts';
import { fixedClock } from './clock.ts';
import { resolveRules } from './resolve-rules.ts';
import { kaeruRules } from './rules-data.ts';
import { validatePurchaseDate, validateReceipt } from './validation.ts';

const rules = resolveRules(kaeruRules, '2026-11-10');
const inTheWindow = resolveRules(kaeruRules, '2027-04-02');
const onTheTrip = fixedClock('2026-11-12T09:00:00+09:00');
const trip = aTrip({ departureDate: '2026-11-20' });

const rulesOf = (findings: readonly ValidationFinding[]) => findings.map((f) => f.rule);
const blocks = (findings: readonly ValidationFinding[]) =>
  findings.filter((f) => f.severity === 'block');

/** A receipt that passes everything, so each test introduces exactly one problem. */
const sound = (overrides = {}) =>
  aReceipt({ lines: [aLine({ taxExcludedAmount: 20_000 })], ...overrides });

describe('what blocks a save (DR-070, DR-070a, DR-071, DR-072)', () => {
  it('TC-DOM-099 blocks a line carrying neither amount', () => {
    const findings = validateReceipt(sound({ lines: [aLine()] }), trip, rules, onTheTrip);
    const blocked = blocks(findings);
    expect(rulesOf(blocked)).toContain('DR-070');
    expect(blocked[0]?.field).toBe('lines.0.taxExcludedAmount');
  });

  it('TC-DOM-100 blocks a negative amount and a fractional one', () => {
    const negative = validateReceipt(
      sound({ lines: [aLine({ taxExcludedAmount: -1 })] }),
      trip,
      rules,
      onTheTrip,
    );
    expect(rulesOf(blocks(negative))).toContain('DR-071');

    // The yen has no minor unit: 1000.5 is not a rounding question, it is a number that
    // cannot exist on a receipt.
    const fractional = validateReceipt(
      sound({ lines: [aLine({ taxExcludedAmount: 1000.5 })] }),
      trip,
      rules,
      onTheTrip,
    );
    expect(rulesOf(blocks(fractional))).toContain('DR-071');
    expect(blocks(fractional)[0]?.field).toBe('lines.0.taxExcludedAmount');
  });

  it('DR-070a blocks a tax-included figure smaller than the tax-excluded one', () => {
    const inverted = sound({
      lines: [aLine({ taxExcludedAmount: 5500, taxIncludedAmount: 5000 })],
    });
    const findings = validateReceipt(inverted, trip, rules, onTheTrip);
    expect(rulesOf(blocks(findings))).toContain('DR-070a');
  });

  it('DR-070a allows the two amounts to be equal, because a zero-tax subtotal is real', () => {
    // Under Japanese per-rate rounding a small enough subtotal genuinely carries no tax:
    // under ¥10 at 10%, under ¥13 at 8%, under ¥100 at the 1% rate. Refusing those would
    // reject a correct receipt.
    const zeroTax = sound({ lines: [aLine({ taxExcludedAmount: 9, taxIncludedAmount: 9 })] });
    expect(rulesOf(blocks(validateReceipt(zeroTax, trip, rules, onTheTrip)))).not.toContain(
      'DR-070a',
    );
  });

  it('TC-DOM-101 @unconfirmed blocks a 1% line dated before the rate exists', () => {
    const early = sound({
      purchaseDate: '2027-03-31',
      lines: [aLine({ taxRate: 0.01, taxExcludedAmount: 20_000 })],
    });
    const findings = validateReceipt(
      early,
      trip,
      resolveRules(kaeruRules, '2027-03-31'),
      onTheTrip,
    );
    expect(rulesOf(blocks(findings))).toContain('DR-072');
    expect(blocks(findings)[0]?.field).toBe('lines.0.taxRate');

    // The same line one day later is fine, and the rule is read from the rate table.
    const later = sound({
      purchaseDate: '2027-04-02',
      lines: [aLine({ taxRate: 0.01, taxExcludedAmount: 20_000 })],
    });
    expect(rulesOf(blocks(validateReceipt(later, trip, inTheWindow, onTheTrip)))).not.toContain(
      'DR-072',
    );
  });

  it('TC-DOM-106 blocks for four rules and nothing else, over every finding it can produce', () => {
    // DR-080: Kaeru never blocks a user from doing something the law permits. Each of
    // these four is Kaeru declining to invent a number instead.
    const hostile = [
      sound({ lines: [aLine()] }),
      sound({ lines: [aLine({ taxExcludedAmount: -5 })] }),
      sound({ lines: [aLine({ taxExcludedAmount: 1.5, taxIncludedAmount: 2 })] }),
      sound({ lines: [aLine({ taxExcludedAmount: 5500, taxIncludedAmount: 5000 })] }),
      sound({ lines: [aLine({ taxRate: 0.05, taxExcludedAmount: 20_000 })] }),
      sound({ purchaseDate: '2027-01-01' }),
      sound({ lines: [aLine({ taxExcludedAmount: 100 })] }),
      sound({ packingLocation: 'checked_bag' }),
      sound({
        lines: [aLine({ taxExcludedAmount: 2_000_000, maxUnitPriceTaxExcluded: 2_000_000 })],
      }),
    ];
    const blocking = new Set<string>();
    for (const receipt of hostile) {
      for (const clock of [onTheTrip, fixedClock('2026-11-20T06:00:00+09:00')]) {
        for (const context of [trip, null]) {
          for (const finding of blocks(validateReceipt(receipt, context, rules, clock))) {
            blocking.add(finding.rule);
          }
        }
      }
    }
    expect([...blocking].sort()).toEqual(['DR-070', 'DR-070a', 'DR-071', 'DR-072']);
  });

  it('TC-DOM-104 leaves the threshold to the shop/day group, which is the only thing that knows', () => {
    // DR-075 is a group rule (DR-012). Firing it per receipt would tell a traveller that
    // each of three ¥3,000 receipts at one shop "does not qualify" while the group of them
    // does, and `inform` would not make that less wrong — they would read it and stop.
    const small = sound({ lines: [aLine({ taxExcludedAmount: 4999 })] });
    const findings = validateReceipt(small, trip, rules, onTheTrip);
    expect(rulesOf(findings)).not.toContain('DR-075');
    expect(blocks(findings)).toEqual([]);
  });
});

describe('validatePurchaseDate (DR-072)', () => {
  it('blocks a date the rules document cannot be resolved for', () => {
    const finding = validatePurchaseDate('2018-05-01', kaeruRules);
    expect(finding?.severity).toBe('block');
    expect(finding?.rule).toBe('DR-072');
    expect(finding?.field).toBe('purchaseDate');
  });

  it('passes a date the document covers, including an old-system one', () => {
    expect(validatePurchaseDate('2026-10-31', kaeruRules)).toBeNull();
    expect(validatePurchaseDate('2026-11-01', kaeruRules)).toBeNull();
    expect(validatePurchaseDate('2030-01-01', kaeruRules)).toBeNull();
  });

  it('can be asked before anything is resolved, which is the whole point', () => {
    // validateReceipt takes ResolvedRules, so it only ever runs once resolution succeeded.
    // A validator that cannot run before the failure is not a validator.
    expect(() => resolveRules(kaeruRules, '2018-05-01')).toThrow();
    expect(validatePurchaseDate('2018-05-01', kaeruRules)).not.toBeNull();
  });
});

describe('what warns but allows (DR-073, DR-074, DR-076 – DR-078)', () => {
  it('TC-DOM-102 warns about a future purchase date without blocking it', () => {
    const future = sound({ purchaseDate: '2026-11-25' });
    const finding = validateReceipt(future, trip, rules, onTheTrip).find(
      (f) => f.rule === 'DR-073',
    );
    expect(finding?.severity).toBe('warn');
    expect(finding?.values?.today).toBe('2026-11-12');
  });

  it('TC-DOM-102 judges "future" in Japan time, not in the device calendar', () => {
    // 2026-11-13 00:30 in Japan is still the 12th in Taipei. Reading the device calendar
    // would warn about a receipt logged five minutes ago in the shop.
    const justAfterMidnight = fixedClock('2026-11-12T23:30:00+08:00');
    const todayInJapan = sound({ purchaseDate: '2026-11-13' });
    expect(rulesOf(validateReceipt(todayInJapan, trip, rules, justAfterMidnight))).not.toContain(
      'DR-073',
    );
  });

  it('TC-DOM-103 warns when the purchase is after the departure date', () => {
    const after = sound({ purchaseDate: '2026-11-25' });
    const finding = validateReceipt(
      after,
      trip,
      rules,
      fixedClock('2026-11-26T09:00:00+09:00'),
    ).find((f) => f.rule === 'DR-074');
    expect(finding?.severity).toBe('warn');
  });

  it('TC-DOM-062 warns prominently when the deadline falls before departure', () => {
    const longStay = aTrip({ departureDate: '2027-03-01' });
    const findings = validateReceipt(
      sound({ purchaseDate: '2026-11-01' }),
      longStay,
      rules,
      onTheTrip,
    );
    const finding = findings.find((f) => f.rule === 'DR-076');
    expect(finding?.severity).toBe('warn');
    expect(finding?.messageKey).toBe('validation.deadlineBeforeDeparture');
  });

  it('TC-DOM-062 uses a different message for no margin, not merely a lower severity', () => {
    // "You have lost this one" and "your deadline is your departure day" are different
    // things to tell someone, and the split exists so they do not look the same.
    const exact = aTrip({ departureDate: '2027-01-30' });
    const findings = validateReceipt(
      sound({ purchaseDate: '2026-11-01' }),
      exact,
      rules,
      onTheTrip,
    );
    const finding = findings.find((f) => f.rule === 'DR-076a');
    expect(finding?.messageKey).toBe('validation.deadlineNoMargin');
    expect(finding?.values?.slackDays).toBe(0);
    expect(rulesOf(findings)).not.toContain('DR-076');
  });

  it('TC-DOM-063 says nothing about deadlines on a five-day trip', () => {
    const findings = validateReceipt(sound({ purchaseDate: '2026-11-10' }), trip, rules, onTheTrip);
    expect(rulesOf(findings)).not.toContain('DR-076');
    expect(rulesOf(findings)).not.toContain('DR-076a');
  });

  it('TC-DOM-072 warns about goods in a checked bag, on the last day and on departure day', () => {
    const checked = sound({ packingLocation: 'checked_bag' });
    for (const instant of ['2026-11-19T20:00:00+09:00', '2026-11-20T06:00:00+09:00']) {
      const finding = validateReceipt(checked, trip, rules, fixedClock(instant)).find(
        (f) => f.rule === 'DR-077',
      );
      expect(finding?.messageKey, instant).toBe('validation.goodsInCheckedBag');
      expect(finding?.severity).toBe('warn');
    }
    // Earlier in the trip the bag is not packed yet and the warning would be noise.
    expect(rulesOf(validateReceipt(checked, trip, rules, onTheTrip))).not.toContain('DR-077');
  });

  it('TC-DOM-073 treats an unknown location as at risk, not as safe', () => {
    const unknown = sound({ packingLocation: 'unknown' });
    const finding = validateReceipt(
      unknown,
      trip,
      rules,
      fixedClock('2026-11-20T06:00:00+09:00'),
    ).find((f) => f.rule === 'DR-077');
    // Same rule and severity as a checked bag; a different message, because not knowing
    // where the goods are needs different advice from knowing they are in the hold.
    expect(finding?.severity).toBe('warn');
    expect(finding?.messageKey).toBe('validation.goodsLocationUnknown');

    const withMe = sound({ packingLocation: 'with_me' });
    expect(
      rulesOf(validateReceipt(withMe, trip, rules, fixedClock('2026-11-20T06:00:00+09:00'))),
    ).not.toContain('DR-077');
  });

  it('TC-DOM-105 reminds about documents the night before, for a high-value receipt', () => {
    // UJ-020: Alex's certificate and warranty are in the box in his suitcase, and he needs
    // to hear about it while there is still time to move them.
    const watch = sound({
      lines: [aLine({ taxExcludedAmount: 1_280_000, maxUnitPriceTaxExcluded: 1_280_000 })],
    });
    const lastNight = validateReceipt(watch, trip, rules, fixedClock('2026-11-19T20:00:00+09:00'));
    const finding = lastNight.find((f) => f.rule === 'DR-078');
    expect(finding?.severity).toBe('warn');
    expect(rulesOf(validateReceipt(watch, trip, rules, onTheTrip))).not.toContain('DR-078');
  });

  it('says nothing about customs for an old-system receipt', () => {
    // It has no customs step, so advice about checked bags or documents would be about a
    // procedure it will never go through (DR-003, DR-064).
    const old = sound({
      purchaseDate: '2026-10-31',
      packingLocation: 'checked_bag',
      lines: [aLine({ taxExcludedAmount: 1_280_000, maxUnitPriceTaxExcluded: 1_280_000 })],
    });
    const findings = validateReceipt(
      old,
      trip,
      resolveRules(kaeruRules, '2026-10-31'),
      fixedClock('2026-11-20T06:00:00+09:00'),
    );
    expect(rulesOf(findings)).not.toContain('DR-077');
    expect(rulesOf(findings)).not.toContain('DR-078');
    expect(rulesOf(findings)).not.toContain('DR-076');
  });

  it('says nothing about customs for a receipt the traveller has stopped claiming', () => {
    const abandoned = sound({ status: 'not_claiming', packingLocation: 'checked_bag' });
    expect(
      rulesOf(validateReceipt(abandoned, trip, rules, fixedClock('2026-11-20T06:00:00+09:00'))),
    ).not.toContain('DR-077');
  });

  it('still validates the amounts when there is no trip yet', () => {
    const findings = validateReceipt(sound({ lines: [aLine()] }), null, rules, onTheTrip);
    expect(rulesOf(blocks(findings))).toContain('DR-070');
    expect(rulesOf(findings)).not.toContain('DR-074');
  });

  it('TC-DOM-071 never produces a per-item finding, because customs confirms whole receipts', () => {
    // Every field path addresses a line, which is a per-rate subtotal, never an item.
    const findings = validateReceipt(
      sound({ lines: [aLine({ taxExcludedAmount: -1 }), aLine({ taxIncludedAmount: 500 })] }),
      trip,
      rules,
      onTheTrip,
    );
    for (const finding of findings) {
      expect(finding.field ?? '').not.toMatch(/item/i);
    }
    expect(findings.some((f) => f.field === 'lines.0.taxExcludedAmount')).toBe(true);
  });
});
