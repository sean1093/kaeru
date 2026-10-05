import { defineMessages } from '../../i18n/index.ts';

/**
 * Sample content for the UI kit gallery, in both languages, because half of what a
 * design review is checking is whether a component survives the longer of the two
 * strings.
 *
 * Deliberately not named `messages.ts`: that filename is globbed into the shipped i18n
 * catalog and into the production bundle, and the gallery must appear in neither.
 *
 * State names (`primary`, `inactive`, `elevated`) are prop values, not copy. They are
 * rendered as code, untranslated, so that what a reviewer reads is the same thing an
 * engineer types.
 */
export const galleryCopy = defineMessages({
  'zh-TW': {
    'gallery.title': 'UI 元件庫',
    'gallery.intro': '只在開發模式出現。每個元件、每種狀態，兩種語言都看得到。',
    'gallery.section.appBar': '1. 應用列',
    'gallery.section.button': '3. 按鈕',
    'gallery.section.card': '4. 卡片',
    'gallery.section.listRow': '5. 列表列',
    'gallery.section.statusChip': '6. 狀態標籤',
    'gallery.section.emptyState': '14. 空狀態',
    'gallery.appBar.screenTitle': '收據',
    'gallery.appBar.longTitle': '松本清藥妝店新宿東口駅前店的收據明細與退稅狀態',
    'gallery.appBar.back': '返回',
    'gallery.appBar.close': '關閉',
    'gallery.appBar.add': '新增收據',
    'gallery.button.save': '儲存',
    'gallery.button.import': '匯入備份',
    'gallery.button.guide': '看看這是怎麼運作的',
    'gallery.button.deleteAll': '刪除所有資料',
    'gallery.button.next': '下一步',
    'gallery.button.inactiveReason': '先選一位旅客，才能繼續。',
    'gallery.card.title': '這趟行程',
    'gallery.card.body': '11 張收據 · 10/28 離境',
    'gallery.card.linkTitle': '打包計畫',
    'gallery.card.linkBody': '哪些要隨身帶、哪些可以託運，出發前一晚看這張。',
    'gallery.row.shop': '松本清 新宿東口店',
    'gallery.row.shopLong': '松本清藥粧店新宿東口駅前店（東京都新宿區新宿三丁目）',
    'gallery.row.meta': '11/04 · ¥12,800 · 含稅',
    'gallery.row.traveler': '小美的收據',
    'gallery.row.listLabel': '收據',
    'gallery.chip.logged': '已記錄',
    'gallery.chip.registered': '已向業者登錄',
    'gallery.chip.customsConfirmed': '海關已確認',
    'gallery.chip.refundPending': '等待入帳',
    'gallery.chip.refunded': '已入帳',
    'gallery.chip.rejected': '未通過',
    'gallery.chip.refundDisputed': '金額有問題',
    'gallery.chip.notClaiming': '不辦這張',
    'gallery.chip.needsAction': '要處理',
    'gallery.chip.operatorUnknown': '業者未確認',
    'gallery.empty.headline': '還沒有收據',
    'gallery.empty.body': '在日本買東西、拿到收據之後，回來記一筆。',
    'gallery.empty.action': '記一筆收據',
    'gallery.empty.secondary': '退稅是怎麼運作的？',
  },
  en: {
    'gallery.title': 'UI kit gallery',
    'gallery.intro':
      'Development build only. Every component, in each of its documented states, in both languages.',
    'gallery.section.appBar': '1. App bar',
    'gallery.section.button': '3. Buttons',
    'gallery.section.card': '4. Cards',
    'gallery.section.listRow': '5. List rows',
    'gallery.section.statusChip': '6. Status chips',
    'gallery.section.emptyState': '14. Empty state',
    'gallery.appBar.screenTitle': 'Receipts',
    'gallery.appBar.longTitle':
      'Receipt details and refund status for Matsumoto Kiyoshi Shinjuku East Exit Station Front',
    'gallery.appBar.back': 'Back',
    'gallery.appBar.close': 'Close',
    'gallery.appBar.add': 'Add receipt',
    'gallery.button.save': 'Save',
    'gallery.button.import': 'Import backup',
    'gallery.button.guide': 'See how this works',
    'gallery.button.deleteAll': 'Delete all data',
    'gallery.button.next': 'Next step',
    'gallery.button.inactiveReason': 'Choose a traveler first to continue.',
    'gallery.card.title': 'This trip',
    'gallery.card.body': '11 receipts · leaving 28 Oct',
    'gallery.card.linkTitle': 'Packing plan',
    'gallery.card.linkBody':
      'What to carry with you and what can go in the checked bag, the night before you fly.',
    'gallery.row.shop': 'Matsumoto Kiyoshi Shinjuku East',
    'gallery.row.shopLong':
      'Matsumoto Kiyoshi Drugstore Shinjuku East Exit Station Front Branch (Shinjuku 3-chome, Tokyo)',
    'gallery.row.meta': '4 Nov · ¥12,800 · tax included',
    'gallery.row.traveler': "Mei's receipts",
    'gallery.row.listLabel': 'Receipts',
    'gallery.chip.logged': 'Logged',
    'gallery.chip.registered': 'Registered',
    'gallery.chip.customsConfirmed': 'Customs confirmed',
    'gallery.chip.refundPending': 'Refund pending',
    'gallery.chip.refunded': 'Received',
    'gallery.chip.rejected': 'Rejected',
    'gallery.chip.refundDisputed': 'Amount disputed',
    'gallery.chip.notClaiming': 'Not claiming',
    'gallery.chip.needsAction': 'Needs you',
    'gallery.chip.operatorUnknown': 'Operator unknown',
    'gallery.empty.headline': 'No receipts yet',
    'gallery.empty.body': 'After you buy something in Japan, log the receipt here.',
    'gallery.empty.action': 'Log a receipt',
    'gallery.empty.secondary': 'How does the refund work?',
  },
});

export type GalleryCopy = typeof galleryCopy;
