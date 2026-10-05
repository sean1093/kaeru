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
 *
 * `fees` is the same fact as arithmetic, and an empty array means unknown exactly as
 * `feeNote: null` does. It is **narrower than the prose on purpose**: `DR-026a` says a
 * percentage without an established basis is a guess, not a fee, because a rate charged
 * on the refund and the same rate charged on the tax-excluded purchase differ by roughly
 * ten times. Only two bases are established today — Tourego's 1.5% of the tax-free sales
 * amount (operator-published) and Ocean's credit-card 0.5% of the tax-excluded price
 * (traveler-reported from the operator's own terms) — so only those two operators carry
 * a computable fee. PIE VAT's reported ~3% and Smart Detax's customer-pays plan stay
 * prose-only: we know a fee exists and cannot say what it is charged on, and storing the
 * number anyway would be the tenfold error `DR-026a` exists to prevent.
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
    fees: [],
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
    fees: [],
    feeNote: {
      en: "Travelers report around 3%; one reported keeping about 70% of the tax refund after both this fee and their own bank's charge.",
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
    fees: [],
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
    fees: [],
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
    fees: [
      {
        // "1.5% of the tax-free sales amount" is the operator's own wording, and 免税売上
        // is the sale, not the refund: on a ¥10,000 tax-excluded purchase this is ¥150
        // against a ¥1,000 refund (DR-026a).
        method: null,
        rate: { basisPoints: 150, basis: 'purchase_tax_excluded' },
        fixedJpy: 0,
        minimumJpy: null,
        status: 'confirmed-official',
      },
    ],
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
    fees: [
      {
        // The only Ocean figure with a basis we can establish: 未稅價格的 0.5% is explicit.
        // The PayPal route (0.33% + from ¥40) and the superseded ~2.2% are deliberately
        // absent — described as a remittance fee without saying what it is charged on, so
        // under DR-026a they are an unknown fee rather than a number we may have ten times
        // wrong.
        method: 'credit_card',
        rate: { basisPoints: 50, basis: 'purchase_tax_excluded' },
        fixedJpy: 0,
        minimumJpy: 180,
        status: 'reported-media',
      },
    ],
    feeNote: {
      en: 'Credit-card route: 0.5% of the tax-excluded price, minimum ¥180, since 2026-07-16 (Visa and UnionPay only — not JCB). A PayPal route also exists; its charge is described as a remittance fee without saying what it is charged on, so we do not state a figure for it.',
      'zh-TW':
        '信用卡路線：自 2026 年 7 月 16 日起為未稅價的 0.5%、每筆最低日圓 180（僅支援 Visa 與銀聯，不支援 JCB）。另有 PayPal 路線，但其費用只說明為匯款手續費，沒有說明是以什麼金額計算，因此我們不列出數字。',
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
    fees: [],
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
    fees: [],
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
    fees: [],
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
    fees: [],
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
