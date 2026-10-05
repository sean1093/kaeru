import { describe, expect, it } from 'vitest';
import { aFee, aLine, anOperator, aReceipt, aRegistration, aTrip } from '../test-support/domain.ts';
import {
  estimateOperatorPayout,
  estimateRefund,
  grossRefundOf,
  hasHighValueItemOf,
  lineAmountsOf,
  taxExcludedTotalOf,
  taxOfLine,
} from './money.ts';
import { resolveRules } from './resolve-rules.ts';
import { kaeruRules } from './rules-data.ts';

const atLaunch = resolveRules(kaeruRules, '2026-11-01');
const inTheOnePercentWindow = resolveRules(kaeruRules, '2027-04-02');

describe('lineAmountsOf — extracting tax from a price (DR-021, DR-024)', () => {
  it('TC-DOM-031 derives 648 yen of tax and 7,128 included from 6,480 excluded at 10%', () => {
    expect(lineAmountsOf(aLine({ taxExcludedAmount: 6480 }))).toEqual({
      taxExcluded: 6480,
      taxIncluded: 7128,
      tax: 648,
      derived: true,
    });
  });

  it('TC-DOM-032 derives 6,480 excluded and 648 tax from 7,128 included at 10%', () => {
    expect(lineAmountsOf(aLine({ taxIncludedAmount: 7128 }))).toEqual({
      taxExcluded: 6480,
      taxIncluded: 7128,
      tax: 648,
      derived: true,
    });
  });

  it('TC-DOM-033 derives 1,000 excluded and 80 tax from 1,080 included at 8%', () => {
    expect(lineAmountsOf(aLine({ taxRate: 0.08, taxIncludedAmount: 1080 }))).toEqual({
      taxExcluded: 1000,
      taxIncluded: 1080,
      tax: 80,
      derived: true,
    });
  });

  it('TC-DOM-034 floors 925.925… to 925 excluded and 75 tax from 1,000 included at 8%', () => {
    expect(lineAmountsOf(aLine({ taxRate: 0.08, taxIncludedAmount: 1000 }))).toEqual({
      taxExcluded: 925,
      taxIncluded: 1000,
      tax: 75,
      derived: true,
    });
  });

  it('TC-DOM-035 always floors, never rounds half up and never ceilings', () => {
    // 1,001 at 8% is 926.85…; half-up gives 927 and ceiling 927. Both over-promise.
    expect(lineAmountsOf(aLine({ taxRate: 0.08, taxIncludedAmount: 1001 })).taxExcluded).toBe(926);
    // 1,005 at 10% is 913.63…; the nearest integer is 914.
    expect(lineAmountsOf(aLine({ taxIncludedAmount: 1005 })).taxExcluded).toBe(913);
    // A tax-excluded 999 at 8% yields 79.92 of tax: floor to 79, not 80.
    expect(lineAmountsOf(aLine({ taxRate: 0.08, taxExcludedAmount: 999 })).tax).toBe(79);
  });

  it('TC-DOM-036 property: excluded + tax == included, integers, floor, at every shipped rate', () => {
    const rates = [...atLaunch.rates, ...inTheOnePercentWindow.rates].map((option) => option.rate);
    for (const rate of new Set(rates)) {
      for (const included of [1, 2, 7, 99, 108, 1000, 5555, 123_456, 999_999, 2_000_000]) {
        const amounts = lineAmountsOf(aLine({ taxRate: rate, taxIncludedAmount: included }));
        expect(Number.isInteger(amounts.taxExcluded)).toBe(true);
        expect(Number.isInteger(amounts.tax)).toBe(true);
        expect(amounts.taxExcluded).toBeGreaterThanOrEqual(0);
        expect(amounts.tax).toBeGreaterThanOrEqual(0);
        expect(amounts.taxExcluded + amounts.tax).toBe(included);
        const scale = Math.round(rate * 10_000);
        expect(amounts.taxExcluded).toBe(Math.floor((included * 10_000) / (10_000 + scale)));
      }
    }
  });

  it('TC-DOM-039 keeps the receipt\u2019s own printed figures over anything it could compute', () => {
    const printed = aLine({ taxExcludedAmount: 6480, taxIncludedAmount: 7127 });
    // 7,127 is not what our formula would produce from 6,480; the receipt still wins.
    expect(lineAmountsOf(printed)).toEqual({
      taxExcluded: 6480,
      taxIncluded: 7127,
      tax: 647,
      derived: false,
    });
  });

  it('marks a line derived when the form computed one side, even with both stored', () => {
    const line = aLine({
      taxExcludedAmount: 925,
      taxIncludedAmount: 1000,
      amountsAreDerived: true,
    });
    expect(lineAmountsOf(line).derived).toBe(true);
  });

  it('TC-DOM-041 @unconfirmed costs a 1,010 yen food line at 1% in the 2027 window', () => {
    // 1% not 8%: 1,000 excluded and 10 of tax, not 935 and 75.
    expect(lineAmountsOf(aLine({ taxRate: 0.01, taxIncludedAmount: 1010 }))).toEqual({
      taxExcluded: 1000,
      taxIncluded: 1010,
      tax: 10,
      derived: true,
    });
    expect(inTheOnePercentWindow.rates.map((option) => option.rate)).toContain(0.01);
  });

  it('returns zero rather than throwing for a line carrying neither amount', () => {
    // DR-070 blocks saving one, but an imported receipt must still render.
    expect(lineAmountsOf(aLine())).toEqual({
      taxExcluded: 0,
      taxIncluded: 0,
      tax: 0,
      derived: true,
    });
  });
});

describe('grossRefundOf — one receipt, one rate per line (DR-020)', () => {
  it('TC-DOM-037 sums per rate: 3,000 at 8% plus 2,500 at 10% is 490, not a blended 495', () => {
    const receipt = aReceipt({
      lines: [
        aLine({ taxRate: 0.08, taxExcludedAmount: 3000 }),
        aLine({ taxRate: 0.1, taxExcludedAmount: 2500 }),
      ],
    });
    expect(taxOfLine(receipt.lines[0] ?? aLine())).toBe(240);
    expect(taxOfLine(receipt.lines[1] ?? aLine())).toBe(250);
    expect(grossRefundOf(receipt)).toBe(490);
    expect(taxExcludedTotalOf(receipt)).toBe(5500);
    // A blended 9% over 5,500 would be 495. The threshold total is unaffected either way,
    // which is exactly why this has to be asserted on the tax rather than on the total.
    expect(grossRefundOf(receipt)).not.toBe(Math.floor(5500 * 0.09));
  });

  it('TC-DOM-046 sums the gross across a receipt set', () => {
    const receipts = [
      aReceipt({ id: 'a', lines: [aLine({ taxExcludedAmount: 6480 })] }),
      aReceipt({ id: 'b', lines: [aLine({ taxRate: 0.08, taxIncludedAmount: 1080 })] }),
    ];
    expect(receipts.reduce((total, receipt) => total + grossRefundOf(receipt), 0)).toBe(728);
  });

  it('TC-DOM-026 values Alex\u2019s 1,280,000 yen watch at 128,000 of tax', () => {
    const receipt = aReceipt({
      lines: [aLine({ taxExcludedAmount: 1_280_000, maxUnitPriceTaxExcluded: 1_280_000 })],
    });
    expect(grossRefundOf(receipt)).toBe(128_000);
    expect(hasHighValueItemOf(receipt, atLaunch)).toBe(true);
  });
});

describe('hasHighValueItemOf (DR-016)', () => {
  it('TC-DOM-024 does not flag a 999,999 yen unit price', () => {
    const receipt = aReceipt({
      lines: [aLine({ taxExcludedAmount: 999_999, maxUnitPriceTaxExcluded: 999_999 })],
    });
    expect(hasHighValueItemOf(receipt, atLaunch)).toBe(false);
  });

  it('TC-DOM-025 flags a 1,000,000 yen unit price: the boundary is inclusive', () => {
    const receipt = aReceipt({
      lines: [aLine({ taxExcludedAmount: 1_000_000, maxUnitPriceTaxExcluded: 1_000_000 })],
    });
    expect(hasHighValueItemOf(receipt, atLaunch)).toBe(true);
  });

  it('keeps the user\u2019s answer when the lines are edited afterwards', () => {
    // A 1,280,000 line could be two items; only the user knows, so their answer survives.
    const edited = aReceipt({
      hasHighValueItem: false,
      lines: [aLine({ taxExcludedAmount: 1_280_000, maxUnitPriceTaxExcluded: 1_280_000 })],
    });
    expect(hasHighValueItemOf(edited, atLaunch)).toBe(false);

    const asserted = aReceipt({
      hasHighValueItem: true,
      lines: [aLine({ taxExcludedAmount: 10 })],
    });
    expect(hasHighValueItemOf(asserted, atLaunch)).toBe(true);
  });

  it('derives nothing from a line whose unit price was never asked for', () => {
    const receipt = aReceipt({ lines: [aLine({ taxExcludedAmount: 1_500_000 })] });
    expect(hasHighValueItemOf(receipt, atLaunch)).toBe(false);
  });
});

describe('estimateRefund — what actually reaches the traveller (DR-025, DR-027)', () => {
  const receipt = aReceipt({ lines: [aLine({ taxExcludedAmount: 100_000 })] }); // 10,000 gross

  it('TC-DOM-048 returns the gross and a null net when the operator is unknown', () => {
    const estimate = estimateRefund(receipt, null, null, aTrip(), atLaunch);
    expect(estimate.gross).toBe(10_000);
    expect(estimate.operatorFee).toBeNull();
    expect(estimate.net).toBeNull();
    expect(estimate.feeWarning).toBe(false);
  });

  it('TC-DOM-048 treats an operator with no fee schedule as unknown, never as free', () => {
    // Eight of the ten shipped operators publish nothing, so this is the common path.
    const estimate = estimateRefund(receipt, anOperator(), null, aTrip(), atLaunch);
    expect(anOperator().fees).toEqual([]);
    expect(estimate.gross).toBe(10_000);
    expect(estimate.operatorFee).toBeNull();
    expect(estimate.net).toBeNull();
  });

  it('TC-DOM-047 @unconfirmed subtracts a known operator fee and the trip receiving charge', () => {
    const operator = anOperator({
      fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })],
    });
    const estimate = estimateRefund(
      receipt,
      operator,
      aRegistration({ refundMethod: 'bank_transfer' }),
      aTrip({ receivingChargeJpy: 1500 }),
      atLaunch,
    );
    expect(estimate.operatorFee).toBe(150);
    expect(estimate.receivingChargeApplies).toBe(true);
    expect(estimate.receivingCharge).toBe(1500);
    expect(estimate.net).toBe(8350);
  });

  it('charges a purchase-basis percentage on the purchase, which is ten times the other reading', () => {
    // Tourego's 1.5% of tax-free sales on a 10,000 yen purchase is 150 against a 1,000
    // refund — 15% of the money coming back. Charging it against the refund gives 15.
    const smallReceipt = aReceipt({ lines: [aLine({ taxExcludedAmount: 10_000 })] });
    const onSales = anOperator({
      fees: [aFee({ rate: { basisPoints: 150, basis: 'purchase_tax_excluded' } })],
    });
    const onRefund = anOperator({ fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })] });
    const trip = aTrip({ receivingChargeJpy: 0 });

    expect(grossRefundOf(smallReceipt)).toBe(1000);
    expect(estimateRefund(smallReceipt, onSales, null, trip, atLaunch).operatorFee).toBe(150);
    expect(estimateRefund(smallReceipt, onRefund, null, trip, atLaunch).operatorFee).toBe(15);
  });

  it('rounds a fee up, so the net never overstates what arrives (DR-024)', () => {
    // 2.2% of 1,001 is 22.022. Flooring it to 22 would promise one yen more than arrives.
    const operator = anOperator({
      fees: [aFee({ rate: { basisPoints: 220, basis: 'refund' } })],
    });
    const odd = aReceipt({ lines: [aLine({ taxExcludedAmount: 10_010 })] });
    expect(grossRefundOf(odd)).toBe(1001);
    expect(
      estimateRefund(odd, operator, null, aTrip({ receivingChargeJpy: 0 }), atLaunch).operatorFee,
    ).toBe(23);
  });

  it('applies a published minimum and a flat charge per payout', () => {
    // Ocean from 2026-07-16: card 0.5% of the tax-excluded price, minimum 180 yen.
    const ocean = anOperator({
      refundMethods: ['credit_card', 'paypal'],
      fees: [
        aFee({
          method: 'credit_card',
          rate: { basisPoints: 50, basis: 'purchase_tax_excluded' },
          minimumJpy: 180,
        }),
        aFee({ method: 'paypal', rate: { basisPoints: 33, basis: 'refund' }, fixedJpy: 40 }),
      ],
    });
    const small = aReceipt({ lines: [aLine({ taxExcludedAmount: 20_000 })] });
    const byCard = estimateRefund(
      small,
      ocean,
      aRegistration({ refundMethod: 'credit_card' }),
      aTrip(),
      atLaunch,
    );
    // 0.5% of 20,000 is 100, below the 180 minimum.
    expect(byCard.operatorFee).toBe(180);
    expect(byCard.receivingChargeApplies).toBe(false);
    expect(byCard.receivingCharge).toBeNull();
    expect(byCard.net).toBe(1820);

    const byPaypal = estimateRefund(
      small,
      ocean,
      aRegistration({ refundMethod: 'paypal' }),
      aTrip(),
      atLaunch,
    );
    // 0.33% of the 2,000 refund is 6.6, rounded up to 7, plus the 40 yen flat charge.
    expect(byPaypal.operatorFee).toBe(47);
    expect(byPaypal.net).toBe(1953);
  });

  it('does not subtract the receiving charge from a card or e-money payout', () => {
    const operator = anOperator({
      refundMethods: ['credit_card'],
      fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })],
    });
    const estimate = estimateRefund(
      receipt,
      operator,
      aRegistration({ refundMethod: 'credit_card' }),
      aTrip({ receivingChargeJpy: 1500 }),
      atLaunch,
    );
    expect(estimate.receivingChargeApplies).toBe(false);
    expect(estimate.net).toBe(10_000 - 150);
  });

  it('refuses a net when the bank charge applies but the traveller has not told us what it is', () => {
    const operator = anOperator({ fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })] });
    const estimate = estimateRefund(
      receipt,
      operator,
      aRegistration({ refundMethod: 'bank_transfer' }),
      aTrip({ receivingChargeJpy: null }),
      atLaunch,
    );
    expect(estimate.operatorFee).toBe(150);
    expect(estimate.receivingChargeApplies).toBe(true);
    expect(estimate.receivingCharge).toBeNull();
    expect(estimate.net).toBeNull();
  });

  it('assumes a transfer is coming while the payout route is still unchosen', () => {
    const operator = anOperator({
      refundMethods: ['bank_transfer', 'credit_card'],
      fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })],
    });
    expect(estimateRefund(receipt, operator, null, aTrip(), atLaunch).receivingChargeApplies).toBe(
      true,
    );
    const cardOnly = anOperator({ refundMethods: ['credit_card'], fees: operator.fees });
    expect(estimateRefund(receipt, cardOnly, null, aTrip(), atLaunch).receivingChargeApplies).toBe(
      false,
    );
  });

  it('TC-DOM-049 @unconfirmed warns when what arrives is worth less than the trouble', () => {
    // The motivating case: 1,100 yen of tax, a small operator cut, a 1,400 yen inbound
    // bank charge. The warning has to fire well above zero, or a 30 yen refund looks fine.
    const small = aReceipt({ lines: [aLine({ taxExcludedAmount: 11_000 })] });
    const operator = anOperator({ fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })] });
    const estimate = estimateRefund(
      small,
      operator,
      aRegistration({ refundMethod: 'bank_transfer' }),
      aTrip({ receivingChargeJpy: 1400 }),
      atLaunch,
    );
    expect(estimate.gross).toBe(1100);
    expect(estimate.net).toBeLessThan(0);
    expect(estimate.feeWarning).toBe(true);
  });

  it('TC-DOM-049 @unconfirmed warns below the configured floor, not merely below zero', () => {
    const operator = anOperator({ refundMethods: ['credit_card'], fees: [aFee({ fixedJpy: 0 })] });
    const trip = aTrip();
    const justUnder = aReceipt({ lines: [aLine({ taxExcludedAmount: 19_000 })] }); // 1,900 gross
    const justOver = aReceipt({ lines: [aLine({ taxExcludedAmount: 21_000 })] }); // 2,100 gross
    expect(atLaunch.fee.warnBelowJpy).toBe(2000);
    expect(estimateRefund(justUnder, operator, null, trip, atLaunch).feeWarning).toBe(true);
    expect(estimateRefund(justOver, operator, null, trip, atLaunch).feeWarning).toBe(false);
  });

  it('never warns on an unknown net, because an unknown number is not a small one', () => {
    const estimate = estimateRefund(receipt, anOperator(), null, aTrip(), atLaunch);
    expect(estimate.net).toBeNull();
    expect(estimate.feeWarning).toBe(false);
  });

  it('prefers the traveller\u2019s own correction over the shipped figure (DR-051)', () => {
    const operator = anOperator({ fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' } })] });
    const corrected = aRegistration({
      refundMethod: 'credit_card',
      feeOverride: aFee({ rate: { basisPoints: 300, basis: 'refund' }, status: 'unconfirmed' }),
    });
    expect(estimateRefund(receipt, operator, corrected, aTrip(), atLaunch).operatorFee).toBe(300);
  });

  it('returns integer yen everywhere, with no float arithmetic to be close to', () => {
    const operator = anOperator({
      fees: [aFee({ rate: { basisPoints: 237, basis: 'purchase_tax_excluded' }, fixedJpy: 13 })],
    });
    const awkward = aReceipt({
      lines: [
        aLine({ taxRate: 0.08, taxIncludedAmount: 7777 }),
        aLine({ taxRate: 0.1, taxIncludedAmount: 3333 }),
      ],
    });
    const estimate = estimateRefund(
      awkward,
      operator,
      aRegistration({ refundMethod: 'bank_transfer' }),
      aTrip({ receivingChargeJpy: 1337 }),
      atLaunch,
    );
    for (const amount of [
      estimate.gross,
      estimate.operatorFee,
      estimate.receivingCharge,
      estimate.net,
    ]) {
      expect(Number.isInteger(amount)).toBe(true);
    }
  });
});

describe('estimateOperatorPayout — one transfer, one set of charges', () => {
  const operator = anOperator({
    fees: [aFee({ rate: { basisPoints: 150, basis: 'refund' }, fixedJpy: 40 })],
  });
  const registration = aRegistration({ refundMethod: 'bank_transfer' });
  const trip = aTrip({ receivingChargeJpy: 1500 });
  const receipts = [1, 2, 3, 4, 5].map((n) =>
    aReceipt({ id: `receipt-${n}`, lines: [aLine({ taxExcludedAmount: 20_000 })] }),
  );

  it('charges the receiving fee once for the whole payout, not once per receipt', () => {
    const payout = estimateOperatorPayout(receipts, operator, registration, trip, atLaunch);
    expect(payout.gross).toBe(10_000);
    expect(payout.receivingCharge).toBe(1500);
    expect(payout.operatorFee).toBe(190); // 1.5% of 10,000 plus the 40 yen flat charge
    expect(payout.net).toBe(8310);
    expect(payout.operatorId).toBe('operator-1');
    expect(payout.receiptIds).toEqual([
      'receipt-1',
      'receipt-2',
      'receipt-3',
      'receipt-4',
      'receipt-5',
    ]);
  });

  it('is worth more than five solo payouts, which is the point of the grouping', () => {
    const payout = estimateOperatorPayout(receipts, operator, registration, trip, atLaunch);
    const soloSum = receipts.reduce((total, receipt) => {
      const solo = estimateRefund(receipt, operator, registration, trip, atLaunch);
      return total + (solo.net ?? 0);
    }, 0);
    // Each solo payout pays 1,500 of bank charge and a 40 yen flat fee of its own:
    // 2,000 gross minus 70 minus 1,500 is 430 apiece.
    expect(soloSum).toBe(430 * 5);
    expect(payout.net).toBeGreaterThan(soloSum);
  });

  it('reports an unknown payout rather than a free one when the operator publishes nothing', () => {
    const payout = estimateOperatorPayout(receipts, anOperator(), registration, trip, atLaunch);
    expect(payout.gross).toBe(10_000);
    expect(payout.operatorFee).toBeNull();
    expect(payout.net).toBeNull();

    const unknownOperator = estimateOperatorPayout(receipts, null, registration, trip, atLaunch);
    expect(unknownOperator.operatorId).toBeNull();
    expect(unknownOperator.net).toBeNull();
  });

  it('charges a flat-only schedule once, with no percentage to apply', () => {
    const flat = anOperator({
      refundMethods: ['credit_card'],
      fees: [aFee({ rate: null, fixedJpy: 300 })],
    });
    const payout = estimateOperatorPayout(
      receipts,
      flat,
      aRegistration({ refundMethod: 'credit_card' }),
      trip,
      atLaunch,
    );
    expect(payout.operatorFee).toBe(300);
    expect(payout.net).toBe(9700);
  });

  it('handles an empty receipt set without inventing a payout', () => {
    const payout = estimateOperatorPayout([], operator, registration, trip, atLaunch);
    expect(payout.gross).toBe(0);
    expect(payout.receiptIds).toEqual([]);
    expect(payout.net).toBe(-1540);
  });
});
