/**
 * The operator catalogue.
 *
 * A port of `docs/content/operators.md`, cross-checked against
 * `docs/product/domain-rules.md` §8. The catalogue is one snapshot: every fact below is as
 * observed on `OBSERVED_ON`, and the source document's own warning carries over —
 * operators change fees, methods and currencies with no notice (`DR-026`, `DR-051`).
 *
 * `status` maps the source document's ad-hoc notation onto the fixed three-value
 * `SourceStatus` the UI distinguishes (review: JapanExpert, this mapping specifically):
 *
 * - `confirmed-official` — the fact comes from the operator's own published materials
 *   (`operators.md`'s `C-operator`), an authoritative primary source about itself even
 *   though self-interested.
 * - `reported-media` — the fact comes from a third party: Taiwanese traveler reports, or
 *   facts the source document itself flagged `reported-media` despite being described on
 *   the company's own site (`jj-taxfree`'s registration flow, `global-blue`'s fee).
 * - `unconfirmed` — nothing beyond the association's refund-capable list is known: no
 *   first-party description of methods, no media report (`jptaxfree`, `wamazing`,
 *   `global-tax-free`, `intasect`).
 *
 * `feeNote: null` means **unknown**, never zero (`DR-051`). An empty `refundMethods` or
 * `registrationMethod` array means "not itemised publicly" — the source document's own
 * phrase for five of the ten — not "no methods exist".
 */
import type { CalendarDate } from '../domain/dates.ts';
import type { Operator, OperatorId } from '../domain/model.ts';
import type { OperatorDirectory } from './schema.ts';

/** Every fee, method and status below is a snapshot of this date (`DR-026`). */
export const OBSERVED_ON: CalendarDate = '2026-10-05';

/**
 * The four operators Taiwanese travelers meet most, per the September 2026 Taiwanese
 * media report citing the association's August 2026 data (udn, 2026-09-27): J&J Tax
 * Free, PIE VAT, Smart Detax and Global Blue.
 */
export const COMMON_FIRST: readonly OperatorId[] = [
  'jj-taxfree',
  'pie-vat',
  'smart-detax',
  'global-blue',
];

/**
 * The association's own caveat (`DR-053`): the list is operators' declarations, not an
 * approval or guarantee. An i18n message key — see `src/content/messages.ts` — because it
 * is one fixed disclaimer rendered with the directory, not a per-article citation.
 */
export const DISCLAIMER_KEY = 'content.operators.disclaimer';

export const OPERATORS: readonly Operator[] = [
  {
    id: 'jj-taxfree',
    name: {
      ja: '株式会社J&J Tax Free',
      en: 'J&J Tax Free (refund portal: J-TaxRefund)',
      'zh-TW': 'J&J Tax Free（退款登錄網站 J-TaxRefund）',
    },
    url: 'https://j-taxfree.jp/',
    registrationMethod: ['receipt_qr', 'web'],
    refundMethods: ['credit_card', 'qr_payment', 'bank_transfer', 'cash'],
    feeNote: null,
    feeSourceDate: null,
    status: 'confirmed-official',
  },
  {
    id: 'pie-vat',
    name: { ja: '株式会社Pie Systems Japan', en: 'PIE VAT', 'zh-TW': 'PIE VAT' },
    url: 'https://pievat.com/japan',
    registrationMethod: ['app', 'counter'],
    refundMethods: ['credit_card'],
    feeNote: {
      en: 'Travelers report around 3% (one reports netting about 7% of a 10% tax).',
      'zh-TW': '旅客回報約 3%（一則回報扣除兩邊費用後，實拿約為稅額的 7 成左右）。',
    },
    feeSourceDate: OBSERVED_ON,
    status: 'reported-media',
  },
  {
    id: 'smart-detax',
    name: {
      ja: 'スマートテクノロジーズ＆リソーシーズ株式会社',
      en: 'Smart Detax (refund product: JPrefund)',
      'zh-TW': 'Smart Detax（JP Refund）',
    },
    url: 'https://smartdetax.com/',
    registrationMethod: ['counter'],
    refundMethods: ['cash', 'qr_payment', 'credit_card'],
    feeNote: {
      en: 'Some shops use a customer-funded plan (顧客負担型), i.e. the traveler pays.',
      'zh-TW': '部分店家採用由旅客負擔費用的方案（顧客負担型）。',
    },
    feeSourceDate: OBSERVED_ON,
    status: 'confirmed-official',
  },
  {
    id: 'global-blue',
    name: {
      ja: 'Global Blue TFS Japan 株式会社',
      en: 'Global Blue',
      'zh-TW': '環球藍聯 Global Blue',
    },
    url: 'https://www.globalblue.com/ja',
    registrationMethod: ['counter', 'app'],
    refundMethods: ['credit_card', 'cash'],
    feeNote: null,
    feeSourceDate: null,
    status: 'reported-media',
  },
  {
    id: 'tourego',
    name: { ja: 'Tourego Japan 株式会社', en: 'Tourego', 'zh-TW': 'Tourego' },
    url: 'https://tourego.com/',
    registrationMethod: ['app'],
    refundMethods: [],
    feeNote: {
      en: '1.5% of the tax-free sales amount, in principle paid by the tourist (a merchant-pays option exists).',
      'zh-TW': '免稅銷售金額（未稅消費額）的 1.5%，原則上由旅客負擔（也有商家負擔的方案）。',
    },
    feeSourceDate: OBSERVED_ON,
    status: 'confirmed-official',
  },
  {
    id: 'ocean',
    name: { ja: '株式会社Ocean', en: 'Ocean', 'zh-TW': 'Ocean' },
    url: 'https://ocean.inc/',
    registrationMethod: ['receipt_qr', 'web'],
    refundMethods: ['paypal', 'bank_transfer', 'credit_card'],
    feeNote: {
      en: 'About 2.2% reported in June 2026; since 2026-07-16: PayPal 0.33% + from ¥40, or credit card 0.5% of the tax-excluded price with a ¥180 minimum (Visa and UnionPay only — not JCB).',
      'zh-TW':
        '2026 年 6 月約回報 2.2%；自 2026 年 7 月 16 日起：PayPal 路線為 0.33% + 日圓 40 起，信用卡路線為未稅價 0.5%、每筆最低日圓 180（僅支援 Visa 與銀聯，不支援 JCB）。',
    },
    feeSourceDate: OBSERVED_ON,
    status: 'reported-media',
  },
  {
    id: 'jptaxfree',
    name: { ja: '株式会社日本免税', en: 'Japan Tax Free', 'zh-TW': '日本免稅' },
    url: 'https://jptaxfree.com/',
    registrationMethod: [],
    refundMethods: [],
    feeNote: null,
    feeSourceDate: null,
    status: 'unconfirmed',
  },
  {
    id: 'wamazing',
    name: { ja: 'WAmazing 株式会社', en: 'WAmazing', 'zh-TW': 'WAmazing' },
    url: 'https://corp.wamazing.com/',
    registrationMethod: [],
    refundMethods: [],
    feeNote: null,
    feeSourceDate: null,
    status: 'unconfirmed',
  },
  {
    id: 'global-tax-free',
    name: { ja: 'Global Tax Free 株式会社', en: 'Global Tax Free', 'zh-TW': 'Global Tax Free' },
    url: 'https://www.global-taxfree.jp/',
    registrationMethod: [],
    refundMethods: [],
    feeNote: null,
    feeSourceDate: null,
    status: 'unconfirmed',
  },
  {
    id: 'intasect',
    name: {
      ja: 'Intasect Communications 株式会社',
      en: 'Intasect (InTaxFree Refund)',
      'zh-TW': 'Intasect（InTaxFree）',
    },
    url: 'https://intapay-payment.intasect.com/intaxfree-refund',
    registrationMethod: [],
    refundMethods: [],
    feeNote: null,
    feeSourceDate: null,
    status: 'unconfirmed',
  },
];

export function buildOperatorDirectory(): OperatorDirectory {
  return {
    operators: OPERATORS,
    commonFirst: COMMON_FIRST,
    observedOn: OBSERVED_ON,
    disclaimerKey: DISCLAIMER_KEY,
  };
}
