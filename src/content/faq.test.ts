import { describe, expect, it } from 'vitest';
import { LOCALES } from '../i18n/index.ts';
import { getContent, getFaqEntry } from './index.ts';

const EXPECTED_IDS = Array.from(
  { length: 16 },
  (_, i) => `guide.faq.q${String(i + 1).padStart(2, '0')}`,
);

describe('the FAQ (M1-4c, #30)', () => {
  it('ships exactly the sixteen entries from the merged guide, in order, in both locales', () => {
    for (const locale of LOCALES) {
      expect(getContent(locale).faq.map((entry) => entry.id)).toEqual(EXPECTED_IDS);
    }
  });

  it('is reachable by id in both locales', () => {
    for (const locale of LOCALES) {
      expect(getFaqEntry(locale, 'guide.faq.q11')?.id).toBe('guide.faq.q11');
      expect(getFaqEntry(locale, 'guide.faq.nope')).toBeUndefined();
    }
  });

  it('ships guide.faq.q11, the fee-eats-your-refund answer the receipt fee warning links into', () => {
    for (const locale of LOCALES) {
      const q11 = getFaqEntry(locale, 'guide.faq.q11');
      expect(q11?.question.trim()).not.toBe('');
      const attention = q11?.answer.filter(
        (block) => block.kind === 'callout' && block.tone === 'attention',
      );
      expect(attention).toHaveLength(1);
    }
  });

  it('makes the first block of every answer a direct paragraph, never a lead-in callout or list', () => {
    for (const locale of LOCALES) {
      for (const entry of getContent(locale).faq) {
        const first = entry.answer[0];
        expect(first, entry.id).toBeDefined();
        expect(first?.kind, entry.id).toBe('paragraph');
      }
    }
  });
});
