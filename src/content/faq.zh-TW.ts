/**
 * The FAQ, in Traditional Chinese for Taiwan.
 *
 * A port of `docs/content/guide.zh-TW.md`'s `guide.faq` section, not a rewrite: all
 * sixteen questions and answers, ids matching the merged file. The first block of every
 * answer is the direct answer itself — a structural choice (review: UXDesigner), not an
 * emphasis one, so the renderer can set it apart without any markup in the content.
 */
import type { FaqEntry } from './schema.ts';

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: 'guide.faq.q01',
    question: '我 11 月才離境，但 10 月就買了，算新制還舊制？',
    answer: [
      {
        kind: 'paragraph',
        body: [
          '看購買日期，不是離境日期。2026 年 10 月 31 日（含）以前買的適用舊制，11 月 1 日（含）以後買的適用新制。中間沒有過渡期，所以同一趟旅程可能同時出現兩種。',
        ],
        sourceIds: ['jta-comparison-pdf'],
      },
    ],
  },
  {
    id: 'guide.faq.q02',
    question: '要買多少才能退？',
    answer: [
      {
        kind: 'paragraph',
        body: ['同一家店、同一天、未稅滿 5,000 日圓。剛好 5,000 就符合。'],
        sourceIds: ['jta-traveler-faq'],
      },
      {
        kind: 'paragraph',
        body: ['現在食品、藥妝、衣服、電器可以合併計算，而且沒有上限。'],
        sourceIds: ['jta-comparison-pdf'],
      },
    ],
  },
  {
    id: 'guide.faq.q03',
    question: '可以退多少？',
    answer: [
      {
        kind: 'paragraph',
        body: [
          '多數商品適用 10% 消費稅，食品飲料適用 8%，這是起算點，再扣掉退稅業者的手續費，以及你的銀行收款時可能收的費用。沒扣這兩項之前的數字，都只是樂觀估計。',
        ],
        sourceIds: ['nta-refund-method'],
      },
    ],
  },
  {
    id: 'guide.faq.q04',
    question: '買的零食可以先拆來吃嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['想退稅就不行。'],
      },
      {
        kind: 'paragraph',
        body: [
          '特殊密封包裝雖然取消，但只要在日本境內吃掉、喝掉、用掉，出境時就無法通過確認。而且如果它跟其他商品在同一張收據上，會連同整張收據一起不能退。旅途中要用的，跟要帶回家的，分開結帳。',
        ],
        sourceIds: ['jta-traveler-faq', 'nta-refund-method'],
      },
    ],
  },
  {
    id: 'guide.faq.q05',
    question: '一張大收據裡少了一樣小東西，其他還能退嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['不行。'],
      },
      {
        kind: 'paragraph',
        body: [
          '海關以一張收據為單位、全有或全無地確認。只要少一件，整張收據都不能退，包含你手上還有的那些。這是新制裡代價最高的一條規則。',
        ],
        sourceIds: ['nta-caution-leaflet'],
      },
    ],
  },
  {
    id: 'guide.faq.q06',
    question: '期限多久？',
    answer: [
      {
        kind: 'paragraph',
        body: ['從購買日起 90 天內。'],
        sourceIds: ['nta-reform-leaflet'],
      },
      {
        kind: 'paragraph',
        body: [
          '從購買日的隔天開始算：2026 年 11 月 1 日買的，海關確認期限是 2027 年 1 月 30 日。一般短天數旅遊不會卡到這條；長期停留或改機票時才會。',
        ],
        sourceIds: ['nta-reform-leaflet'],
      },
    ],
  },
  {
    id: 'guide.faq.q07',
    question: '可以把商品放進託運行李嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['要等海關確認完成之後才可以。'],
      },
      {
        kind: 'paragraph',
        body: [
          '在那之前所有商品都必須在身上，因為可能被要求出示。行李一旦託運就拿不回來辦這件事：航空公司不會拉回，海關也不可能在沒看到商品的情況下確認。',
        ],
        sourceIds: ['customs-departure'],
      },
    ],
  },
  {
    id: 'guide.faq.q08',
    question: '綠燈、紅燈是什麼意思？',
    answer: [
      {
        kind: 'paragraph',
        body: [
          '綠燈代表不需要查驗，手續完成。紅燈代表要到海關檢查處出示商品。紅燈不是被抓包，也不是你做錯了，只是系統把部分旅客分流去人工查驗。只要東西都在身上，通常就是多花幾分鐘。',
        ],
        sourceIds: ['jta-traveler-faq'],
      },
    ],
  },
  {
    id: 'guide.faq.q09',
    question: '要提早多久到機場？',
    answer: [
      {
        kind: 'paragraph',
        body: [
          '官方沒有給數字。機台本身只要幾秒，但被抽到查驗就要排隊，而日本海關自己也表示新制會讓作業量大幅增加。建議在平常報到時間之外再多抓約 1 小時，旺季再多留一些。',
        ],
        sourceIds: ['customs-departure'],
      },
    ],
  },
  {
    id: 'guide.faq.q10',
    question: '可以在機場領現金嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['不一定。'],
      },
      {
        kind: 'paragraph',
        body: [
          '官方列出的退款方式包含銀行匯款、信用卡、App 轉帳，以及在出境機場內領現金，但實際提供哪幾種由各店家與其退稅業者決定。如果你是付現金，購買時就先問清楚比較保險。',
        ],
        sourceIds: ['nta-refund-method'],
      },
    ],
  },
  {
    id: 'guide.faq.q11',
    question: '有手續費嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['有，而且法律沒有規範。'],
        sourceIds: ['nta-refund-method'],
      },
      {
        kind: 'callout',
        tone: 'attention',
        body: [
          '退稅業者通常扣 1.5% 到 3% 左右。更要小心的是你這一端：收國際匯款，台灣的銀行常收新台幣 200 到 400 元以上，退稅金額小的時候可能整筆被吃光。實際上已經有旅客分享，兩邊費用扣完幾乎沒拿到錢。',
        ],
        sourceIds: ['ptt-refund-reports'],
      },
      {
        kind: 'paragraph',
        body: ['如果業者有提供退到信用卡的選項，通常比較划算。'],
      },
    ],
  },
  {
    id: 'guide.faq.q12',
    question: '全家一起出遊，可以合併辦嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['不行。'],
      },
      {
        kind: 'paragraph',
        body: [
          '每筆消費屬於當初使用的那本護照，機台也是一本護照一本護照分別確認。每個人的商品和收據各自分開放，機台也一人辦一次。',
        ],
        sourceIds: ['jta-traveler-faq'],
      },
    ],
  },
  {
    id: 'guide.faq.q13',
    question: '可以自己把商品寄回台灣嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['不行。'],
      },
      {
        kind: 'paragraph',
        body: [
          '旅客自行郵寄免稅品出境的「別送」制度，已經在 2025 年 3 月 31 日廢止。部分店家有自己的海外直送服務，走的是另一套規定，請直接問店家。',
        ],
      },
    ],
  },
  {
    id: 'guide.faq.q14',
    question: '我要買超過 100 萬日圓的手錶，有什麼要注意？',
    answer: [
      {
        kind: 'paragraph',
        body: ['有。'],
      },
      {
        kind: 'paragraph',
        body: [
          '未稅單價滿 100 萬日圓以上的商品，店家會登錄序號等詳細資訊，海關確認時可能要求你連同商品一起出示鑑定書或保證書。這些文件要帶在身上，不要放進託運行李。',
        ],
        sourceIds: ['nta-caution-leaflet'],
      },
    ],
  },
  {
    id: 'guide.faq.q15',
    question: '我可以乾脆不退嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['可以。你是照一般方式繳了稅，退不退是你的選擇。'],
      },
      {
        kind: 'paragraph',
        body: [
          '如果手續費扣完幾乎不剩，不辦是合理的。在 App 裡選「這張不退了」，那張收據就會標成「不辦這張」，之後不會再提醒你，機場流程也會自動跳過它。',
        ],
      },
    ],
  },
  {
    id: 'guide.faq.q16',
    question: 'Kaeru 會幫我辦退稅嗎？',
    answer: [
      {
        kind: 'paragraph',
        body: ['不會，而且永遠不會。'],
      },
      {
        kind: 'paragraph',
        body: [
          'Kaeru 是一本跑在你手機上的私人筆記本。它不會連線退稅業者，也不會連線日本政府系統，沒有帳號、沒有伺服器，也不會儲存完整的護照號碼。退稅請直接跟店家與退稅業者處理，Kaeru 只負責讓你隨時知道還有哪些事沒做。',
        ],
      },
    ],
  },
];
