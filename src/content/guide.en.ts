/**
 * The guide, in English.
 *
 * A port of `docs/content/guide.en.md`, not a rewrite: section ids match the keys in that
 * file and in `guide.zh-TW.ts`, so the two languages stay aligned and the travel expert
 * can diff them. Emphasis that the Markdown carries with `**bold**` is expressed as a
 * `callout` block instead, because content is structured data and never smuggles markup
 * into the app.
 */
import type { ArticleSeed } from './seeds.ts';

const LAST_REVIEWED = '2026-10-05';

const intro: ArticleSeed = {
  id: 'guide.intro',
  title: "Japan's tax refund changed on 1 November 2026",
  summary: 'Kaeru keeps track of it so you do not lose money to a paperwork mistake.',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.intro.what-changed',
      title: "Japan's tax refund changed on 1 November 2026",
      blocks: [
        {
          kind: 'paragraph',
          body: [
            'You used to show your passport and pay the tax-free price straight away.',
            'Now you pay the full price including tax, and the tax comes back to you after Japan Customs confirms at the airport that you are taking the goods out of the country.',
            'Kaeru keeps track of it so you do not lose money to a paperwork mistake.',
          ],
          sourceIds: ['jta-traveler-page', 'nta-refund-method'],
        },
      ],
    },
  ],
};

export const GUIDE_ARTICLES: readonly ArticleSeed[] = [intro];
