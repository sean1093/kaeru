import { describe, expect, it } from 'vitest';
import { LOCALES } from '../i18n/index.ts';
import { getArticle, getContent, getSection } from './index.ts';
import type { ContentBlock } from './schema.ts';

function blocksOf(id: string, locale: (typeof LOCALES)[number]): readonly ContentBlock[] {
  const section = getSection(locale, id);
  if (!section) throw new Error(`missing section ${id} in ${locale}`);
  return section.blocks;
}

describe('guide.steps (M1-4b, port of docs/content/guide.*.md)', () => {
  it('ships all five steps, in order, in both locales', () => {
    for (const locale of LOCALES) {
      const article = getArticle(locale, 'guide.steps');
      expect(article?.sections.map((s) => s.id)).toEqual([
        'guide.steps.1',
        'guide.steps.2',
        'guide.steps.3',
        'guide.steps.4',
        'guide.steps.5',
      ]);
    }
  });

  it('keeps the attention-callout budget UX set: one in guide.steps.3, two in .4, one in .5', () => {
    for (const locale of LOCALES) {
      const article = getArticle(locale, 'guide.steps');
      const attention = (article?.sections ?? []).flatMap((section) =>
        section.blocks.filter((block) => block.kind === 'callout' && block.tone === 'attention'),
      );
      expect(attention).toHaveLength(4);
    }
  });

  it('keeps the DR-030 and DR-032 rules in guide.steps.4 as two separate callouts, not merged', () => {
    for (const locale of LOCALES) {
      const callouts = blocksOf('guide.steps.4', locale).filter(
        (block) => block.kind === 'callout',
      );
      expect(callouts).toHaveLength(2);
      // Each is its own failure with its own remedy: bag-drop timing, then per-receipt scope.
      expect(callouts[0]?.heading).not.toBe(callouts[1]?.heading);
    }
  });

  it('states the threshold as an info callout, not a warning', () => {
    for (const locale of LOCALES) {
      const info = blocksOf('guide.steps.1', locale).find((block) => block.kind === 'callout');
      expect(info?.tone).toBe('info');
    }
  });

  it('turns the dense step-4 instruction into an ordered steps block instead of one run-on sentence', () => {
    for (const locale of LOCALES) {
      const steps4 = blocksOf('guide.steps.4', locale);
      const orderedStep = steps4.find((block) => block.kind === 'steps');
      expect(orderedStep?.body.length).toBe(3);
    }
  });

  it('contains the ¥5,000 threshold and the 2026-11-01 start as literal prose', () => {
    // The 90-day window is not stated in guide.steps or guide.airport (neither is it in
    // the merged guide.*.md source); it first appears in guide.faq.q06, which is M1-4c.
    const zh = getContent('zh-TW');
    const en = getContent('en');
    const zhText = JSON.stringify(zh.articles);
    const enText = JSON.stringify(en.articles);
    expect(zhText).toContain('5,000');
    expect(enText).toContain('5,000');
    expect(zhText).toContain('2026');
    expect(enText).toContain('2026');
  });
});

describe('guide.airport (M1-4b)', () => {
  it('ships all four sections, in order, in both locales', () => {
    for (const locale of LOCALES) {
      const article = getArticle(locale, 'guide.airport');
      expect(article?.sections.map((s) => s.id)).toEqual([
        'guide.airport.before',
        'guide.airport.terminal',
        'guide.airport.after',
        'guide.airport.wrong',
      ]);
    }
  });

  it('routes the customs-first order as ordered steps, not a flat list', () => {
    for (const locale of LOCALES) {
      for (const id of ['guide.airport.before', 'guide.airport.terminal', 'guide.airport.after']) {
        const kinds = blocksOf(id, locale).map((block) => block.kind);
        expect(kinds).toContain('steps');
      }
    }
  });

  it('gives guide.airport.wrong three run-in headings, one per failure mode', () => {
    for (const locale of LOCALES) {
      const headings = blocksOf('guide.airport.wrong', locale)
        .map((block) => block.heading)
        .filter((heading): heading is string => heading !== undefined);
      expect(headings).toHaveLength(3);
    }
  });
});

describe('guide.sources (M1-4b)', () => {
  it('cites the leaflet pair as two distinct documents, not one', () => {
    for (const locale of LOCALES) {
      const [block] = blocksOf('guide.sources.official', locale);
      expect(block?.sourceIds).toContain('nta-reform-leaflet');
      expect(block?.sourceIds).toContain('nta-caution-leaflet');
      // They are not interchangeable: the reform leaflet carries the 90-day worked
      // example, the caution leaflet is the till notice. One id for both would silently
      // point a reader at the wrong document (caught in #66 review).
      expect(block?.sourceIds).not.toContain('nta-leaflet');
    }
  });

  it('separates traveler reports from official sources', () => {
    for (const locale of LOCALES) {
      const [official] = blocksOf('guide.sources.official', locale);
      const [reports] = blocksOf('guide.sources.reports', locale);
      expect(official?.sourceIds).not.toContain('ptt-refund-reports');
      expect(reports?.sourceIds).toEqual(['ptt-refund-reports']);
    }
  });
});
