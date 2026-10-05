/**
 * Operator notes, in English.
 *
 * A near-verbatim carry of the "Notes" column in `docs/content/operators.md`. See
 * `operator-notes.zh-TW.ts` for why the zh-TW side is new translation rather than a port.
 */
import type { ContentBlock } from './schema.ts';

export const OPERATOR_NOTES: Readonly<Record<string, readonly ContentBlock[]>> = {
  'pie-vat': [
    {
      kind: 'paragraph',
      body: [
        'Completed Type II funds-transfer business registration on 2026-10-01. Travelers report it as one of the smoother flows, partly because staffed counters exist to ask for help.',
      ],
      sourceIds: ['pie-vat-registration-news', 'ptt-pie-global-blue'],
    },
  ],
  'smart-detax': [
    {
      kind: 'paragraph',
      body: [
        'Registered with the National Tax Agency as an approved transmitting operator; a Kanto Local Finance Bureau registration is listed on its site. Began offering refund-method operation ahead of the 2026-11-01 start.',
      ],
      sourceIds: ['smart-detax-site'],
    },
  ],
  'global-blue': [
    {
      kind: 'paragraph',
      body: [
        'Taiwanese travelers specifically recommend it for having a tracking app, which is the thing they say the newer operators lack.',
      ],
      sourceIds: ['ptt-pie-global-blue'],
    },
  ],
  tourego: [
    {
      kind: 'paragraph',
      body: [
        'Singapore-origin; a National Tax Agency approved transmitting operator. Its site is the clearest of the ten about who pays the fee.',
      ],
      sourceIds: ['tourego-site'],
    },
  ],
  ocean: [
    {
      kind: 'callout',
      tone: 'attention',
      heading: 'The cautionary tale.',
      body: [
        'Deployed early at animate, Miki House and Sneaker Dunk. With only PayPal and bank transfer at launch, Taiwanese travelers hit inbound foreign-remittance charges of NT$200-400+ from their own banks: one documented case turned ¥19,805 of purchases (about ¥1,980 tax) into NT$77, another turned ¥1,100 of tax into nothing. The company offered ¥2,000 compensation in virtual-card or gift-card form and then added credit-card refunds.',
        'Shows how fast operator terms move, and why fee data needs an observation date.',
      ],
      sourceIds: ['ptt-refund-reports', 'ptt-ocean-fee-update'],
    },
  ],
};
