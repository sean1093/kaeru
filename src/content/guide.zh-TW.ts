/**
 * The guide, in Traditional Chinese for Taiwan.
 *
 * A port of `docs/content/guide.zh-TW.md`, not a rewrite: section ids match the keys in
 * that file so the travel expert can diff the two, and the prose is the copy as merged.
 * Where the Markdown gives a heading no key of its own, the section id is
 * `<article>.<slug>`, because ids are unique across articles, sections and FAQ entries.
 * Emphasis that the Markdown carries with `**bold**` is expressed as a `callout` block
 * instead, because content is structured data and never smuggles markup into the app.
 *
 * Numbers stay literal prose. The three that must not drift from the rules data — the
 * ¥5,000 threshold, the 90-day window and the 2026-11-01 start — are checked against the
 * resolved rules by the guardrail suite (M1-5d) rather than interpolated here.
 */
import type { ArticleSeed } from './seeds.ts';

const LAST_REVIEWED = '2026-10-05';

const intro: ArticleSeed = {
  id: 'guide.intro',
  title: '日本退稅制度，2026 年 11 月 1 日起改了',
  summary: 'Kaeru 幫你把這一整串記清楚，不要因為流程疏忽而白白損失。',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.intro.what-changed',
      title: '日本退稅制度，2026 年 11 月 1 日起改了',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            '以前是出示護照，結帳當下就用未稅價付款。',
            '現在要先付含稅價，等到出境時由日本海關確認你確實把商品帶出日本，消費稅才會退給你。',
            'Kaeru 幫你把這一整串記清楚，不要因為流程疏忽而白白損失。',
          ],
          sourceIds: ['jta-traveler-page', 'nta-refund-method'],
        },
      ],
    },
  ],
};

export const GUIDE_ARTICLES: readonly ArticleSeed[] = [intro];
