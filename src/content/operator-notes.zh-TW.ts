/**
 * Operator notes, in Traditional Chinese for Taiwan.
 *
 * Narrative context the structured `Operator` fields cannot carry — the "Notes" column of
 * `docs/content/operators.md`, which exists only in English prose there. This is new
 * translation, not a port of merged bilingual copy (unlike the guide), so it needs the
 * travel expert's review on accuracy rather than a diff against an existing zh-TW file.
 * Only operators with something worth saying get an entry; the other five carry no
 * `operatorNotes`, which `ContentBundle.operatorNotes` already models as optional.
 */
import type { ContentBlock } from './schema.ts';

export const OPERATOR_NOTES: Readonly<Record<string, readonly ContentBlock[]>> = {
  'pie-vat': [
    {
      kind: 'paragraph',
      body: [
        '已於 2026 年 10 月 1 日完成第二種資金移動業登錄。旅客回報這是流程較順暢的業者之一，部分原因是有真人服務的櫃檯可以求助。',
      ],
      sourceIds: ['pie-vat-registration-news', 'ptt-pie-global-blue'],
    },
  ],
  'smart-detax': [
    {
      kind: 'paragraph',
      body: [
        '已登錄為日本國稅廳認定的承認送受信事業者，網站上列出關東財務局的登錄資訊。在 2026 年 11 月 1 日新制上路前就已開始提供退款方式的服務。',
      ],
      sourceIds: ['smart-detax-site'],
    },
  ],
  'global-blue': [
    {
      kind: 'paragraph',
      body: ['台灣旅客特別推薦它有進度查詢 App 這一點——這正是旅客認為較新業者普遍缺少的功能。'],
      sourceIds: ['ptt-pie-global-blue'],
    },
  ],
  tourego: [
    {
      kind: 'paragraph',
      body: [
        '新加坡起家，已登錄為日本國稅廳認定的承認送受信事業者。在這十家業者裡，它的網站把手續費由誰負擔講得最清楚。',
      ],
      sourceIds: ['tourego-site'],
    },
  ],
  ocean: [
    {
      kind: 'callout',
      tone: 'attention',
      heading: '最值得當作警惕的一個案例。',
      body: [
        '早期在 animate、Miki House、Sneaker Dunk 等店家導入。剛推出時只支援 PayPal 和銀行匯款，台灣旅客因此被自己的銀行收取新台幣 200 到 400 元以上的國外匯入手續費：有一筆記錄是 19,805 日圓的消費（約 1,980 日圓的稅額）最後只拿到新台幣 77 元，另一筆 1,100 日圓的稅額則是完全沒拿到。業者後來提供 2,000 日圓的虛擬卡或禮物卡作為補償，並新增了信用卡退款選項。',
        '這個案例說明了業者條款變動有多快，以及為什麼手續費資料一定要標注查核日期。',
      ],
      sourceIds: ['ptt-refund-reports', 'ptt-ocean-fee-update'],
    },
  ],
};
