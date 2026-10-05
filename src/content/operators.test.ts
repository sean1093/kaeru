import { describe, expect, it } from 'vitest';
import { isCalendarDate } from '../domain/dates.ts';
import type { SourceStatus } from '../domain/model.ts';
import { getOperatorDirectory } from './index.ts';

const ALL_TEN_IDS = [
  'jj-taxfree',
  'pie-vat',
  'smart-detax',
  'global-blue',
  'tourego',
  'jptaxfree',
  'wamazing',
  'global-tax-free',
  'intasect',
  'ocean',
];

const STATUSES: readonly SourceStatus[] = ['confirmed-official', 'reported-media', 'unconfirmed'];

describe('the ten-operator directory (M1-4c, #30)', () => {
  const directory = getOperatorDirectory();

  it('ships exactly the ten ids from docs/content/operators.md', () => {
    expect(directory.operators.map((op) => op.id).sort()).toEqual([...ALL_TEN_IDS].sort());
  });

  it('gives every operator a name in ja, en and zh-TW, and an https URL', () => {
    for (const operator of directory.operators) {
      expect(operator.name.ja.trim(), operator.id).not.toBe('');
      expect(operator.name.en.trim(), operator.id).not.toBe('');
      expect(operator.name['zh-TW'].trim(), operator.id).not.toBe('');
      expect(operator.url, operator.id).toMatch(/^https:\/\//);
    }
  });

  it('gives every operator a recognised status', () => {
    for (const operator of directory.operators) {
      expect(STATUSES, operator.id).toContain(operator.status);
    }
  });

  it('never fabricates a fee: null fee has null feeSourceDate, present fee has a dated source (DR-051)', () => {
    for (const operator of directory.operators) {
      if (operator.feeNote === null) {
        expect(operator.feeSourceDate, operator.id).toBeNull();
      } else {
        expect(operator.feeNote.en.trim(), operator.id).not.toBe('');
        expect(operator.feeNote['zh-TW'].trim(), operator.id).not.toBe('');
        expect(operator.feeSourceDate, operator.id).not.toBeNull();
        expect(isCalendarDate(operator.feeSourceDate as string), operator.id).toBe(true);
      }
    }
  });

  it('keeps the fee prose and the fee arithmetic agreeing about whether we know anything', () => {
    for (const operator of directory.operators) {
      if (operator.feeNote === null) {
        // No prose means no arithmetic. The reverse of this is the dangerous direction:
        // a computable fee nobody describes would render as a silent deduction.
        expect(operator.fees, operator.id).toEqual([]);
      }
      if (operator.fees.length > 0) {
        expect(operator.feeNote, operator.id).not.toBeNull();
        expect(operator.feeSourceDate, operator.id).not.toBeNull();
      }
    }
  });

  it('ships a computable fee only where the basis is established (DR-026a)', () => {
    // The converse of the agreement test deliberately does not hold: an operator can have
    // prose and no arithmetic, because a percentage whose basis we cannot establish is a
    // guess, not a fee — charged on the refund rather than the purchase it is roughly ten
    // times out. Naming the operators in that middle state keeps it from growing silently.
    const proseOnly = directory.operators
      .filter((op) => op.feeNote !== null && op.fees.length === 0)
      .map((op) => op.id);
    expect(proseOnly.sort()).toEqual(['pie-vat', 'smart-detax']);

    const computable = directory.operators.filter((op) => op.fees.length > 0).map((op) => op.id);
    expect(computable.sort()).toEqual(['ocean', 'tourego']);
  });

  it('gives every stored rate an explicit basis and never a bare percentage (DR-026a)', () => {
    for (const operator of directory.operators) {
      for (const fee of operator.fees) {
        if (fee.rate !== null) {
          expect(['refund', 'purchase_tax_excluded'], operator.id).toContain(fee.rate.basis);
          expect(Number.isInteger(fee.rate.basisPoints), operator.id).toBe(true);
          expect(fee.rate.basisPoints, operator.id).toBeGreaterThan(0);
        }
        expect(Number.isInteger(fee.fixedJpy), operator.id).toBe(true);
        expect(STATUSES, operator.id).toContain(fee.status);
      }
    }
  });

  it('never states a percentage fee as zero or omits it when known (DR-051 negative case)', () => {
    // A null feeNote must never be read as "0%" downstream; assert the type-level
    // guarantee holds for every operator that genuinely has a published fee.
    const published = directory.operators.filter((op) => op.feeNote !== null);
    expect(published.length).toBeGreaterThan(0);
    for (const operator of published) {
      expect(operator.feeNote?.en).not.toMatch(/\b0%/);
    }
  });

  it('pins the four Taiwanese travelers meet most, as commonFirst', () => {
    expect(directory.commonFirst).toEqual(['jj-taxfree', 'pie-vat', 'smart-detax', 'global-blue']);
    const ids = new Set(directory.operators.map((op) => op.id));
    for (const id of directory.commonFirst) expect(ids.has(id), id).toBe(true);
  });

  it('dates the whole catalogue as one observation (DR-026)', () => {
    expect(isCalendarDate(directory.observedOn)).toBe(true);
  });

  it('carries a disclaimer key, not inline text, so every screen renders the same caveat (DR-053)', () => {
    expect(directory.disclaimerKey).toBe('content.operators.disclaimer');
  });

  it('is locale-neutral: querying twice returns the same reference', () => {
    expect(getOperatorDirectory()).toBe(directory);
  });

  it('models "not itemised publicly" as an empty array, never a fabricated method', () => {
    const tourego = directory.operators.find((op) => op.id === 'tourego');
    expect(tourego?.refundMethods).toEqual([]);
  });
});
