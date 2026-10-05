import { defineMessages } from '../../i18n/index.ts';

/**
 * The guide's own chrome, and nothing else.
 *
 * Every word of guide prose lives in `src/content`, where it carries its sources and its
 * review date. A string here that restated a rule would be a second copy of it, free to
 * drift from the one the travel expert reviews (IA flow H, `overview.md` section 2).
 */
export const messages = defineMessages({
  'zh-TW': {
    'guide.nav': '指南',
    'guide.title': '指南',
    'guide.back': '← 回指南',
    'guide.offline': '內容已經下載好，離線也看得到。',
    'guide.operators.title': '退稅業者',
    'guide.operators.summary': '登錄方式、入帳方式、手續費',
    'guide.faq.title': '常見問題',
    'guide.faq.summary': '其他人最常問的事',
    'guide.sources.title': '資料來源',
    'guide.sources.reviewed': '本篇於 {date} 對照官方資料查核。',
    'guide.sources.accessed': '查看日期 {date}',
    'guide.sources.lang.ja': '日文',
    'guide.sources.lang.en': '英文',
    'guide.sources.lang.zh-TW': '繁體中文',
    // The three standings a claim can have. Worded as what the reader should do with the
    // claim, not as a taxonomy label: "reported-media" means nothing to a traveller.
    'guide.caveat.pending-legislation': '這條還沒三讀通過，可能會變。',
    'guide.caveat.reported-media': '這是媒體或業者的說法，不是官方公告。',
    'guide.caveat.unconfirmed': '目前沒有官方說明，這是我們的判斷。',
    'guide.missing.title': '找不到這篇',
    'guide.missing.body': '這個連結指向的文章不存在，可能是我們的錯。',
    'guide.missing.action': '回指南',
  },
  en: {
    'guide.nav': 'Guide',
    'guide.title': 'Guide',
    'guide.back': '← Back to the guide',
    'guide.offline': 'The guide is bundled — it works offline.',
    'guide.operators.title': 'Refund operators',
    'guide.operators.summary': 'How to register, how you get paid, what they charge',
    'guide.faq.title': 'FAQ',
    'guide.faq.summary': 'What everyone else asks',
    'guide.sources.title': 'Sources',
    'guide.sources.reviewed': 'Checked against official sources on {date}.',
    'guide.sources.accessed': 'read on {date}',
    'guide.sources.lang.ja': 'in Japanese',
    'guide.sources.lang.en': 'in English',
    'guide.sources.lang.zh-TW': 'in Traditional Chinese',
    'guide.caveat.pending-legislation': 'This is a bill that has not passed yet. It may change.',
    'guide.caveat.reported-media':
      'Reported by media or by the operator, not announced officially.',
    'guide.caveat.unconfirmed': 'No official source settles this. This is our reading.',
    'guide.missing.title': 'We could not find that',
    'guide.missing.body':
      'The article this link points at does not exist, which is probably our mistake.',
    'guide.missing.action': 'Back to the guide',
  },
});
