/**
 * The guide, in English.
 *
 * A port of `docs/content/guide.en.md`, not a rewrite: section ids match the keys in that
 * file and in `guide.zh-TW.ts`, so the two languages stay aligned and the travel expert
 * can diff them. See `guide.zh-TW.ts` for the reasoning behind every structural choice
 * below — the same decisions apply here because the two files must read as one guide in
 * two languages, never as two different guides.
 */
import type { ArticleSeed } from './seeds.ts';

const LAST_REVIEWED = '2026-10-05';

const intro: ArticleSeed = {
  id: 'guide.intro',
  title: "Japan's tax refund changed on 1 November 2026",
  summary: 'What changed, and why the money comes later',
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

const steps: ArticleSeed = {
  id: 'guide.steps',
  title: 'The new system in 5 steps',
  summary: 'Five steps from the till to the money',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.steps.1',
      title: '1. In the shop, pay the full price',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            'Show your passport and pay the price including consumption tax. There is no discount at the till any more.',
          ],
          sourceIds: ['jta-traveler-page', 'nta-refund-method'],
        },
        {
          kind: 'callout',
          tone: 'info',
          body: [
            'You qualify when you spend ¥5,000 or more before tax, at the same shop, on the same day.',
          ],
          sourceIds: ['jta-traveler-faq'],
        },
        {
          kind: 'paragraph',
          body: [
            'Good news: snacks, cosmetics, clothes and electronics now all count towards the same ¥5,000. The old split between "general goods" and "consumables" is gone, there is no upper limit, and the sealed plastic bags are gone too.',
          ],
          sourceIds: ['jta-comparison-pdf'],
        },
      ],
    },
    {
      id: 'guide.steps.2',
      title: '2. Register where your refund should go',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            'The shop will point you to a website or an app — usually a QR code printed on your receipt. Register your passport details and where you want the money: a credit card, a bank account, or an e-wallet.',
            'You normally only do this once per refund company. After that, your later receipts from shops using that same company are picked up automatically.',
            'Different shops use different companies. Expect to meet two to four of them on one trip.',
          ],
          sourceIds: ['nta-refund-method', 'association-refund'],
        },
      ],
    },
    {
      id: 'guide.steps.3',
      title: '3. Keep everything, and keep it unopened',
      blocks: [
        {
          kind: 'paragraph',
          body: ['Keep the goods and keep the receipts until you have left Japan.'],
          sourceIds: ['jta-traveler-faq'],
        },
        {
          kind: 'callout',
          tone: 'attention',
          body: [
            'The sealed packaging is gone, but that does not mean you can use the items. If you eat the snacks or open the cosmetics in Japan, that purchase is no longer refundable.',
          ],
          sourceIds: ['jta-traveler-faq', 'nta-refund-method'],
        },
        {
          kind: 'paragraph',
          body: [
            'A tip that saves real money: buy the things you will use during the trip in a separate transaction from the things you are taking home. You will see why in step 4.',
          ],
        },
      ],
    },
    {
      id: 'guide.steps.4',
      title: '4. At the airport: customs first, bags second',
      blocks: [
        {
          kind: 'paragraph',
          body: ['This is the step that decides whether you get paid.'],
        },
        {
          kind: 'steps',
          body: [
            'Before you check in your luggage, go to the tax-free terminals in the international departure lobby — before security.',
            'Have all your tax-free goods with you.',
            'Scan your passport. In a few seconds you get a result:',
          ],
          sourceIds: ['jta-traveler-page', 'customs-departure'],
        },
        {
          kind: 'list',
          body: [
            'Green — you are done. No inspection.',
            'Red — go to the customs desk and show the goods. This is routine, not a problem.',
          ],
          sourceIds: ['jta-traveler-faq'],
        },
        {
          kind: 'callout',
          tone: 'attention',
          heading: 'Two rules that catch people out:',
          body: [
            'Once your bag is checked in, you cannot get it back for this. If your goods are inside it, the refund is gone.',
            'Customs checks one receipt at a time, all or nothing. If a single item from a receipt is missing, nothing on that receipt is refunded — not even the items you do have.',
          ],
          sourceIds: ['customs-departure', 'nta-caution-leaflet'],
        },
        {
          kind: 'paragraph',
          body: ['Only after customs is done do you check in and drop your bags.'],
        },
      ],
    },
    {
      id: 'guide.steps.5',
      title: '5. The money arrives later',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            'Once customs has confirmed the goods left Japan, the shop or its refund company pays you by the method you registered.',
          ],
          sourceIds: ['nta-refund-method'],
        },
        {
          kind: 'callout',
          tone: 'attention',
          body: [
            'There is no legal deadline for this and no legal limit on fees. Most companies deduct a handling fee, usually in the range of 1.5% to 3% of the purchase. If the money is sent as an international bank transfer, your own bank may also charge you to receive it, and on a small refund that charge can be larger than the refund itself.',
          ],
          sourceIds: ['nta-refund-method', 'ptt-refund-reports'],
        },
        {
          kind: 'paragraph',
          body: [
            'Kaeru shows you an estimated net amount rather than a flattering gross one, and lets you record what actually arrived.',
          ],
        },
      ],
    },
  ],
};

const airport: ArticleSeed = {
  id: 'guide.airport',
  title: 'Airport checklist',
  summary: 'Departure day in order: customs first, then bag drop',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.airport.before',
      title: 'Before you leave the hotel',
      blocks: [
        {
          kind: 'steps',
          body: [
            'Every item you want refunded is in a bag you will still be carrying at the airport — not in a suitcase you are about to hand over.',
            'Each traveler has their own passport and their own pile. Refunds are tied to the passport the purchase was made on.',
            'Any receipt where you have eaten, opened or lost an item is already marked Not claiming in the app, so it does not surprise you in the queue.',
            'For anything costing ¥1,000,000 or more before tax: bring the certificate of authenticity or the warranty. Customs may ask.',
            "Leave early. Allow about an hour on top of your airline's normal check-in time. There is no official figure, but customs expects queues.",
          ],
          sourceIds: ['jta-traveler-faq', 'customs-departure', 'nta-caution-leaflet'],
        },
      ],
    },
    {
      id: 'guide.airport.terminal',
      title: 'At the terminal',
      blocks: [
        {
          kind: 'steps',
          body: [
            'Do not check in your bags yet.',
            'Find the tax-free terminals in the international departure lobby, landside, before security and before baggage drop.',
            'Connecting from a domestic flight? Do this at the last airport you leave Japan from, not the first one.',
            "Scan your passport at the terminal. At Narita, Haneda, Kansai, Chubu, Fukuoka, New Chitose and Naha you can use Visit Japan Web online instead — but only inside the departure lobby's dedicated Wi-Fi area, before security.",
            'Green: done. Red: go to the customs desk with your goods.',
            'If you have consumed something from a receipt, do not use the terminal for it. Tell a customs officer at the desk instead.',
          ],
          sourceIds: ['jta-traveler-page', 'visit-japan-web', 'customs-departure'],
        },
      ],
    },
    {
      id: 'guide.airport.after',
      title: 'After customs confirms',
      blocks: [
        {
          kind: 'steps',
          body: [
            'Now check in and drop your bags.',
            'Take the goods with you out of Japan. Goods that customs confirmed but you leave behind in Japan mean the tax is collected back from you, with penalties.',
          ],
          sourceIds: ['nta-refund-method', 'nta-caution-leaflet'],
        },
      ],
    },
    {
      id: 'guide.airport.wrong',
      title: 'If something goes wrong',
      blocks: [
        {
          kind: 'paragraph',
          heading: 'Running out of time.',
          body: [
            'If you abandon an inspection because check-in is closing, it counts as never having been confirmed. Neither the airline nor customs compensates you for a missed flight. You decide: your flight or that refund. Kaeru will not make that call for you.',
          ],
          sourceIds: ['jta-traveler-faq', 'customs-departure'],
        },
        {
          kind: 'paragraph',
          heading: 'You checked a bag by mistake.',
          body: [
            'The refund for the goods inside it is lost. The airline will not retrieve it for a tax refund. Carry on with the other receipts — they are unaffected.',
          ],
          sourceIds: ['customs-departure'],
        },
        {
          kind: 'paragraph',
          heading: 'A red result when an item is missing.',
          body: ['That receipt is rejected in full. Other receipts are still fine. Move on.'],
          sourceIds: ['nta-caution-leaflet'],
        },
      ],
    },
  ],
};

const sources: ArticleSeed = {
  id: 'guide.sources',
  title: 'Where this comes from',
  summary: 'Where every rule comes from, and when we checked',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.sources.official',
      title: 'Official',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            'Everything here was checked against official Japanese sources on 5 October 2026. The system starts on 1 November 2026, so nobody has been through it yet — if you find something different in practice, trust the airport, not us.',
          ],
          sourceIds: [
            'jta-traveler-page',
            'jta-traveler-faq',
            'jta-comparison-pdf',
            'jta-leaflet',
            'nta-refund-method',
            'nta-reform-leaflet',
            'nta-caution-leaflet',
            'customs-departure',
            'visit-japan-web',
            'association-refund',
          ],
        },
      ],
    },
    {
      id: 'guide.sources.reports',
      title: 'Traveler reports',
      blocks: [
        {
          kind: 'paragraph',
          body: ['For the sections on fees.'],
          sourceIds: ['ptt-refund-reports'],
        },
      ],
    },
  ],
};

export const GUIDE_ARTICLES: readonly ArticleSeed[] = [intro, steps, airport, sources];
