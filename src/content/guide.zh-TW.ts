/**
 * The guide, in Traditional Chinese for Taiwan.
 *
 * A port of `docs/content/guide.zh-TW.md`, not a rewrite: section ids match the keys in
 * that file so the travel expert can diff the two, and the prose is the copy as merged.
 * Where the Markdown gives a heading no key of its own, the section id is
 * `<article>.<slug>`, because ids are unique across articles, sections and FAQ entries.
 *
 * `**bold**` does not survive the port as inline markup — `ContentBlock` carries none, by
 * design, so content can never smuggle markup into the app. Each bolded span was read for
 * the job it was doing and re-expressed as structure instead (review: UXDesigner,
 * JapanExpert): a run-in heading becomes `ContentBlock.heading`; the two rules that
 * actually cost a traveller a refund stay under the merged source's own lead-in
 * (「兩個最容易踩雷的規則：」) as one `attention` callout with two body lines — one box,
 * two distinct statements, never fused into one sentence (`guide.steps.4`); the dense
 * run-on sentence above it becomes a `steps` list, in the same order, split only at
 * existing full stops so no word changes. `guide.steps.1`'s threshold line is `info`, not
 * `attention`: it is a fact that helps the reader, not a danger.
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
  summary: '制度改了什麼，以及為什麼現在才退錢',
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

const steps: ArticleSeed = {
  id: 'guide.steps',
  title: '新制 5 步驟',
  summary: '從結帳到入帳的 5 個步驟',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.steps.1',
      title: '1. 在店裡，先付含稅價',
      blocks: [
        {
          kind: 'paragraph',
          body: ['出示護照，付含消費稅的價格。結帳當下不再直接折抵稅金。'],
          sourceIds: ['jta-traveler-page', 'nta-refund-method'],
        },
        {
          kind: 'callout',
          tone: 'info',
          body: ['門檻是：同一家店、同一天、未稅金額滿 5,000 日圓。'],
          sourceIds: ['jta-traveler-faq'],
        },
        {
          kind: 'paragraph',
          body: [
            '好消息是：零食、藥妝、衣服、電器現在全部可以合併計算這 5,000 日圓。舊制「一般物品／消耗品」的分類已經取消，沒有金額上限，消耗品的特殊密封包裝也取消了。',
          ],
          sourceIds: ['jta-comparison-pdf'],
        },
      ],
    },
    {
      id: 'guide.steps.2',
      title: '2. 登錄退款要退到哪裡',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            '店家會引導你到一個網站或 App，通常是收據上印的一組 QR Code。在上面登錄護照資料，以及你希望收款的方式：信用卡、銀行帳戶或電子錢包。',
            '同一家退稅業者通常只要登錄一次，之後在使用同一家業者的店消費，收據會自動帶進去。',
            '不同店家配合不同業者。一趟旅程遇到 2 到 4 家是很正常的。',
          ],
          sourceIds: ['nta-refund-method', 'association-refund'],
        },
      ],
    },
    {
      id: 'guide.steps.3',
      title: '3. 東西留好，而且先別拆',
      blocks: [
        {
          kind: 'paragraph',
          body: ['商品和收據都要留到離開日本為止。'],
          sourceIds: ['jta-traveler-faq'],
        },
        {
          kind: 'callout',
          tone: 'attention',
          body: [
            '特殊密封包裝雖然取消了，但不代表可以在日本境內使用。零食吃掉、化妝品拆開用了，那筆消費就不能退稅。',
          ],
          sourceIds: ['jta-traveler-faq', 'nta-refund-method'],
        },
        {
          kind: 'paragraph',
          body: [
            '一個真的會省到錢的小習慣：旅途中會吃掉、用掉的東西，跟要帶回家的東西，分開結帳成兩筆。原因請看第 4 步。',
          ],
        },
      ],
    },
    {
      id: 'guide.steps.4',
      title: '4. 在機場：先過海關，再託運',
      blocks: [
        {
          kind: 'paragraph',
          body: ['這一步決定你拿不拿得到錢。'],
        },
        {
          kind: 'steps',
          body: [
            '託運行李之前，先到國際線出境大廳的免稅手續機台辦理，位置在安檢之前。',
            '身上要帶著全部的免稅商品。',
            '掃描護照，幾秒後會顯示結果：',
          ],
          sourceIds: ['jta-traveler-page', 'customs-departure'],
        },
        {
          kind: 'list',
          body: [
            '綠燈 — 完成了，不用查驗。',
            '紅燈 — 到海關檢查處出示商品。這是例行程序，不是出事。',
          ],
          sourceIds: ['jta-traveler-faq'],
        },
        {
          kind: 'callout',
          tone: 'attention',
          heading: '兩個最容易踩雷的規則：',
          body: [
            '行李一旦託運出去，就拿不回來了。商品如果在裡面，這筆退稅就沒了。',
            '海關是以一張收據為單位、全有或全無地確認。同一張收據上只要少一件，整張收據都不能退，連你手上有的那幾件也一起不能退。',
          ],
          sourceIds: ['customs-departure', 'nta-caution-leaflet'],
        },
        {
          kind: 'paragraph',
          body: ['海關確認完成之後，才去報到、託運行李。'],
        },
      ],
    },
    {
      id: 'guide.steps.5',
      title: '5. 退款稍後才會入帳',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            '海關確認商品已帶離日本之後，由免稅店或它委託的退稅業者，依你登錄的方式把錢退給你。',
          ],
          sourceIds: ['nta-refund-method'],
        },
        {
          kind: 'callout',
          tone: 'attention',
          body: [
            '法律沒有規定入帳期限，也沒有規定手續費上限。多數業者會扣掉手續費，但很少說明是「以什麼金額」計算：目前有明確基準的只有少數，例如 Tourego 是免稅銷售金額（未稅消費額）的 1.5%。其他多半只有旅客回報的概數（約 3%），業者沒有公布計算基準，所以那是量級參考，不是費率。如果是用國際匯款退到銀行帳戶，你自己的銀行收款時可能還會再收一筆；金額小的時候，這筆費用有可能比退稅金額還高。',
          ],
          sourceIds: ['nta-refund-method', 'ptt-refund-reports'],
        },
        {
          kind: 'paragraph',
          body: [
            '所以 Kaeru 顯示的是「預估實拿金額」，不是好看的稅額全額，並且讓你記錄實際入帳了多少。',
          ],
        },
      ],
    },
  ],
};

const airport: ArticleSeed = {
  id: 'guide.airport',
  title: '機場檢查清單',
  summary: '出境當天的順序：先海關，再託運',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.airport.before',
      title: '離開飯店前',
      blocks: [
        {
          kind: 'steps',
          body: [
            '所有要退稅的商品，都放在你到機場時手上還拿得到的行李裡，不要放進等一下就要託運的行李箱。',
            '每位旅客各自一份護照、各自一堆東西。退稅是綁在當初購買時使用的那本護照上。',
            '已經吃掉、拆開或遺失東西的收據，先在 App 裡選「這張不退了」，不要到排隊時才發現。',
            '未稅單價滿 100 萬日圓以上的商品：把鑑定書或保證書帶在身上，海關可能會要求出示。',
            '提早出門。建議在航空公司規定的報到時間之外，再多抓約 1 小時。官方沒有公布數字，但日本海關自己也預期作業量會大幅增加。',
          ],
          sourceIds: ['jta-traveler-faq', 'customs-departure', 'nta-caution-leaflet'],
        },
      ],
    },
    {
      id: 'guide.airport.terminal',
      title: '到了機場',
      blocks: [
        {
          kind: 'steps',
          body: [
            '先不要託運行李。',
            '到國際線出境大廳找免稅手續機台，位置在管制區外、安檢與行李託運之前。',
            '如果是搭國內線轉國際線：要在最後離開日本的那個機場辦理，不是第一段的機場。',
            '在機台掃描護照。在成田、羽田、關西、中部、福岡、新千歲、那霸這 7 個機場，也可以改用 Visit Japan Web 線上辦理，但必須在出境大廳的專用無線網路範圍內，而且要在安檢之前。',
            '綠燈：完成。紅燈：帶著商品到海關檢查處。',
            '如果某張收據上的東西已經吃掉、用掉了，那張不要用機台，請直接向海關人員櫃檯申報。',
          ],
          sourceIds: ['jta-traveler-page', 'visit-japan-web', 'customs-departure'],
        },
      ],
    },
    {
      id: 'guide.airport.after',
      title: '海關確認完成後',
      blocks: [
        {
          kind: 'steps',
          body: [
            '現在可以去報到、託運行李。',
            '商品要確實帶出日本。已經通過海關確認卻留在日本的商品，日方會追繳相當於消費稅的金額，並可能受到處罰。',
          ],
          sourceIds: ['nta-refund-method', 'nta-caution-leaflet'],
        },
      ],
    },
    {
      id: 'guide.airport.wrong',
      title: '萬一出狀況',
      blocks: [
        {
          kind: 'paragraph',
          heading: '時間不夠了。',
          body: [
            '如果因為趕報到而中途放棄查驗，會被視為「沒有完成海關確認」。而且因為辦免稅手續而趕不上飛機，航空公司和海關都不負補償責任。要班機還是要退稅，由你自己決定，Kaeru 不會替你決定。',
          ],
          sourceIds: ['jta-traveler-faq', 'customs-departure'],
        },
        {
          kind: 'paragraph',
          heading: '不小心先託運了。',
          body: [
            '那件行李裡的商品退稅就沒了，航空公司不會為了退稅把行李拉回來。其他收據不受影響，繼續辦。',
          ],
          sourceIds: ['customs-departure'],
        },
        {
          kind: 'paragraph',
          heading: '紅燈，而且剛好少一件。',
          body: ['那張收據整張不能退，其他收據照常。不要在現場糾結。'],
          sourceIds: ['nta-caution-leaflet'],
        },
      ],
    },
  ],
};

const sources: ArticleSeed = {
  id: 'guide.sources',
  title: '資料來源',
  summary: '每一條規則的官方出處與查核日期',
  status: 'confirmed-official',
  lastReviewed: LAST_REVIEWED,
  sections: [
    {
      id: 'guide.sources.official',
      title: '官方',
      blocks: [
        {
          kind: 'paragraph',
          body: [
            '以上內容於 2026 年 10 月 5 日對照日本官方資料查核。新制 2026 年 11 月 1 日才上路，目前還沒有人實際走過完整流程；如果現場做法與這裡不同，請以機場現場為準。',
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
      title: '旅客實際經驗',
      blocks: [
        {
          kind: 'paragraph',
          body: ['手續費相關段落的依據。'],
          sourceIds: ['ptt-refund-reports'],
        },
      ],
    },
  ],
};

export const GUIDE_ARTICLES: readonly ArticleSeed[] = [intro, steps, airport, sources];
