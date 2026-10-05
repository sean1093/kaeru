/**
 * The FAQ, in English.
 *
 * A port of `docs/content/guide.en.md`'s `guide.faq` section, not a rewrite: all sixteen
 * questions and answers, ids matching `faq.zh-TW.ts` and the merged file. See
 * `faq.zh-TW.ts` for the answer-first structural note.
 */
import type { FaqEntry } from './schema.ts';

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: 'guide.faq.q01',
    question: 'I am flying out in November but I bought things in October. Which rules apply?',
    answer: [
      {
        kind: 'paragraph',
        body: [
          'The purchase date decides, not your departure date. Anything bought on or before 31 October 2026 follows the old system; anything bought on or after 1 November 2026 follows the new one. There is no transition period, so one trip can contain both.',
        ],
        sourceIds: ['jta-comparison-pdf'],
      },
    ],
  },
  {
    id: 'guide.faq.q02',
    question: 'How much do I need to spend?',
    answer: [
      {
        kind: 'paragraph',
        body: [
          '¥5,000 or more before tax, at the same shop, on the same day. ¥5,000 exactly qualifies.',
        ],
        sourceIds: ['jta-traveler-faq'],
      },
      {
        kind: 'paragraph',
        body: [
          'Food, cosmetics, clothes and electronics all count towards the same total now, and there is no maximum.',
        ],
        sourceIds: ['jta-comparison-pdf'],
      },
    ],
  },
  {
    id: 'guide.faq.q03',
    question: 'How much tax comes back?',
    answer: [
      {
        kind: 'paragraph',
        body: [
          'Most goods are taxed at 10%, and food and drink at 8%, so that is the starting point — minus whatever the refund company charges and minus anything your bank charges to receive it. Treat any figure before those deductions as optimistic.',
        ],
        sourceIds: ['nta-refund-method'],
      },
    ],
  },
  {
    id: 'guide.faq.q04',
    question: 'Can I open the snacks I bought?',
    answer: [
      {
        kind: 'paragraph',
        body: ['Not if you want the refund.'],
      },
      {
        kind: 'paragraph',
        body: [
          'The sealed packaging requirement is gone, but anything you eat, drink or use inside Japan cannot be confirmed at departure. If it is on a receipt together with other items, it takes that whole receipt down with it. Buy "for now" and "for home" separately.',
        ],
        sourceIds: ['jta-traveler-faq', 'nta-refund-method'],
      },
    ],
  },
  {
    id: 'guide.faq.q05',
    question: 'I lost one small item from a big receipt. Can I still claim the rest?',
    answer: [
      {
        kind: 'paragraph',
        body: ['No.'],
      },
      {
        kind: 'paragraph',
        body: [
          'Customs confirms one receipt at a time, all or nothing. If any item on it is missing, the entire receipt is rejected, including the items you still have. This is the single most expensive rule in the new system.',
        ],
        sourceIds: ['nta-caution-leaflet'],
      },
    ],
  },
  {
    id: 'guide.faq.q06',
    question: 'How long do I have?',
    answer: [
      {
        kind: 'paragraph',
        body: ['90 days from the date of purchase.'],
        sourceIds: ['nta-reform-leaflet'],
      },
      {
        kind: 'paragraph',
        body: [
          'The deadline is counted from the day after you buy: something bought on 1 November 2026 must be confirmed at customs by 30 January 2027. On a normal holiday this never matters; it matters on long stays and when flights change.',
        ],
        sourceIds: ['nta-reform-leaflet'],
      },
    ],
  },
  {
    id: 'guide.faq.q07',
    question: 'Can I put the goods in my checked luggage?',
    answer: [
      {
        kind: 'paragraph',
        body: ['Only after customs has confirmed them.'],
      },
      {
        kind: 'paragraph',
        body: [
          'Before that, everything must be with you, because you may be asked to show it. Once a bag is checked in it cannot be retrieved for this — the airline will not do it, and customs cannot accept the goods unseen.',
        ],
        sourceIds: ['customs-departure'],
      },
    ],
  },
  {
    id: 'guide.faq.q08',
    question: 'What do green and red mean?',
    answer: [
      {
        kind: 'paragraph',
        body: [
          'Green means no inspection is needed and you are finished. Red means go to the customs desk and show your goods. Red is not an accusation and not a mistake — it is just how the system routes some travelers. Have everything with you and it is a few extra minutes.',
        ],
        sourceIds: ['jta-traveler-faq'],
      },
    ],
  },
  {
    id: 'guide.faq.q09',
    question: 'How early should I get to the airport?',
    answer: [
      {
        kind: 'paragraph',
        body: [
          'There is no official number. The terminal itself takes seconds, but an inspection means queueing. Japan Customs itself expects a significant increase in workload. Allow about an hour on top of your usual check-in time, more in peak season.',
        ],
        sourceIds: ['customs-departure'],
      },
    ],
  },
  {
    id: 'guide.faq.q10',
    question: 'Can I get cash at the airport?',
    answer: [
      {
        kind: 'paragraph',
        body: ['Sometimes.'],
      },
      {
        kind: 'paragraph',
        body: [
          'Cash at the departure airport is one of the methods the authorities list, along with bank transfer, credit card and app transfers — but each shop decides what its refund company offers. Ask when you buy, especially if you paid cash.',
        ],
        sourceIds: ['nta-refund-method'],
      },
    ],
  },
  {
    id: 'guide.faq.q11',
    question: 'Are there fees?',
    answer: [
      {
        kind: 'paragraph',
        body: ['Yes, and they are not regulated.'],
        sourceIds: ['nta-refund-method'],
      },
      {
        kind: 'callout',
        tone: 'attention',
        body: [
          'Refund companies typically deduct around 1.5% to 3%. The bigger risk is on your side: receiving an international bank transfer can cost you NT$200-400 or more, which on a small refund can wipe it out entirely. Travelers have reported receiving almost nothing after both charges.',
        ],
        sourceIds: ['ptt-refund-reports'],
      },
      {
        kind: 'paragraph',
        body: ['If a refund company offers a credit-card refund, it is usually the cheaper route.'],
      },
    ],
  },
  {
    id: 'guide.faq.q12',
    question: 'My family is travelling together. Can we combine everything?',
    answer: [
      {
        kind: 'paragraph',
        body: ['No.'],
      },
      {
        kind: 'paragraph',
        body: [
          "Each purchase belongs to the passport it was made on, and each passport is confirmed separately at the terminal. Keep each person's goods and receipts in their own pile, and do the terminal step per person.",
        ],
        sourceIds: ['jta-traveler-faq'],
      },
    ],
  },
  {
    id: 'guide.faq.q13',
    question: 'Can I mail my purchases home instead?',
    answer: [
      {
        kind: 'paragraph',
        body: ['No.'],
      },
      {
        kind: 'paragraph',
        body: [
          'Posting your own tax-free purchases abroad as proof of export was abolished on 31 March 2025. Some shops offer their own direct shipping service, which is handled differently — ask the shop.',
        ],
      },
    ],
  },
  {
    id: 'guide.faq.q14',
    question: 'I am buying a watch worth over ¥1,000,000. Anything extra?',
    answer: [
      {
        kind: 'paragraph',
        body: ['Yes.'],
      },
      {
        kind: 'paragraph',
        body: [
          'For goods with a pre-tax unit price of ¥1,000,000 or more, the shop records details including the serial number, and customs may ask to see the certificate of authenticity or warranty alongside the item. Keep those documents with you at the airport, not in your suitcase.',
        ],
        sourceIds: ['nta-caution-leaflet'],
      },
    ],
  },
  {
    id: 'guide.faq.q15',
    question: 'Do I have to claim at all?',
    answer: [
      {
        kind: 'paragraph',
        body: ['No. You paid tax like a resident; claiming is your choice.'],
      },
      {
        kind: 'paragraph',
        body: [
          "If the fees would leave you with almost nothing, it is reasonable to skip it. Tap Don't claim this one and the receipt is marked Not claiming: Kaeru stops reminding you about it and the airport steps skip it.",
        ],
      },
    ],
  },
  {
    id: 'guide.faq.q16',
    question: 'Does Kaeru get my refund for me?',
    answer: [
      {
        kind: 'paragraph',
        body: ['No, and it never will.'],
      },
      {
        kind: 'paragraph',
        body: [
          'Kaeru is a private notebook that runs on your phone. It does not talk to refund companies, does not talk to the Japanese government, has no account and no server, and never stores your full passport number. You deal with the shop and the refund company directly — Kaeru just makes sure you know what still needs doing.',
        ],
      },
    ],
  },
];
