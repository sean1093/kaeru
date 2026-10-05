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
