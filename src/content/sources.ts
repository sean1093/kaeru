/**
 * The citation registry.
 *
 * Every factual claim in the bundled content points at one of these ids, and the id
 * resolves to a URL and the date a human actually opened the page. The research index in
 * `docs/research/tax-free-system-2026.md` uses `[S1]`-style ids; each entry below records
 * its counterpart so the travel expert can diff the two lists.
 *
 * A source is declared once and rendered in both languages. Where an agency publishes the
 * same material per language — the traveller leaflets, Visit Japan Web — the URL and the
 * language of the page differ per reader, so both are declared per locale and `lang` is
 * emitted only when the page is *not* in the reader's language.
 */
import type { CalendarDate } from '../domain/dates.ts';
import { LOCALES, type Locale } from '../i18n/index.ts';
import type { SourceRef } from './schema.ts';

type ContentLang = 'ja' | 'en' | 'zh-TW';

type PerLocale<T> = { readonly [L in Locale]: T };

interface SourceSpec {
  readonly id: string;
  /** `[Sx]` in the research index, so a reviewer can trace a claim back to the notes. */
  readonly research: string;
  readonly title: PerLocale<string>;
  readonly url: string | PerLocale<string>;
  /** The language the page itself is written in. */
  readonly contentLang: ContentLang | PerLocale<ContentLang>;
  /** The date a human opened the page. */
  readonly accessed: CalendarDate;
}

const ACCESSED: CalendarDate = '2026-10-05';

const SPECS: readonly SourceSpec[] = [
  {
    id: 'jta-traveler-page',
    research: 'S1',
    title: {
      'zh-TW': '日本觀光廳．旅行者向け特設ページ（退款制）',
      en: 'Japan Tourism Agency, traveler page on the refund method',
    },
    url: 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html',
    contentLang: 'ja',
    accessed: ACCESSED,
  },
  {
    id: 'jta-traveler-faq',
    research: 'S2',
    title: {
      'zh-TW': '日本觀光廳．旅行者常見問題',
      en: 'Japan Tourism Agency, traveler FAQ',
    },
    url: 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00023.html',
    contentLang: 'ja',
    accessed: ACCESSED,
  },
  {
    id: 'jta-comparison-pdf',
    research: 'S5',
    title: {
      'zh-TW': '日本觀光廳．新舊制比較表（PDF）',
      en: 'Japan Tourism Agency, old-vs-new comparison (PDF)',
    },
    url: 'https://www.mlit.go.jp/kankocho/tax-free/content/001977883.pdf',
    contentLang: 'ja',
    accessed: ACCESSED,
  },
  {
    id: 'jta-leaflet',
    research: 'S26',
    title: {
      'zh-TW': '日本觀光廳．旅客用繁體中文說明單（PDF）',
      en: 'Japan Tourism Agency, traveler leaflet in English (PDF)',
    },
    url: {
      'zh-TW': 'https://www.mlit.go.jp/kankocho/tax-free/content/001991249.pdf',
      en: 'https://www.mlit.go.jp/kankocho/tax-free/content/001991247.pdf',
    },
    contentLang: { 'zh-TW': 'zh-TW', en: 'en' },
    accessed: ACCESSED,
  },
  {
    id: 'nta-refund-method',
    research: 'S3',
    title: {
      'zh-TW': '日本國稅廳．輸出物品販售場制度改為退款制',
      en: 'National Tax Agency, refund method overview',
    },
    url: 'https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/format/002.htm',
    contentLang: 'ja',
    accessed: ACCESSED,
  },
  {
    id: 'nta-reform-leaflet',
    research: 'S7',
    title: {
      'zh-TW': '日本國稅廳．免稅制度改為退款制說明（PDF，英文版）',
      en: 'National Tax Agency, reform leaflet incl. the 90-day rule (PDF)',
    },
    url: {
      'zh-TW': 'https://www.nta.go.jp/publication/pamph/shohi/menzei/202506/pdf/0025006-106.pdf',
      en: 'https://www.nta.go.jp/publication/pamph/shohi/menzei/202506/pdf/0025006-106.pdf',
    },
    // No Chinese edition exists. A Taiwanese reader is better served the English edition,
    // honestly marked as English, than a substitute document in their own language.
    contentLang: 'en',
    accessed: ACCESSED,
  },
  {
    id: 'nta-caution-leaflet',
    research: 'S27',
    title: {
      'zh-TW': '日本國稅廳．給外國旅客的注意事項（繁體中文 PDF）',
      en: 'National Tax Agency, traveler caution leaflet (PDF)',
    },
    url: {
      'zh-TW': 'https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/pdf/caution_ct.pdf',
      en: 'https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/pdf/caution_en.pdf',
    },
    contentLang: { 'zh-TW': 'zh-TW', en: 'en' },
    accessed: ACCESSED,
  },
  {
    id: 'customs-departure',
    research: 'S24',
    title: {
      'zh-TW': '日本海關．出國時的海關手續',
      en: 'Japan Customs, departure procedures',
    },
    url: 'https://www.customs.go.jp/kaigairyoko/syukkoku.htm',
    contentLang: 'ja',
    accessed: ACCESSED,
  },
  {
    id: 'visit-japan-web',
    research: 'S12',
    title: {
      'zh-TW': '日本數位廳．Visit Japan Web',
      en: 'Digital Agency, Visit Japan Web',
    },
    url: {
      'zh-TW': 'https://services.digital.go.jp/visit-japan-web/',
      en: 'https://services.digital.go.jp/en/visit-japan-web/',
    },
    contentLang: { 'zh-TW': 'ja', en: 'en' },
    accessed: ACCESSED,
  },
  {
    id: 'association-refund',
    research: 'S9',
    title: {
      'zh-TW': '日本全國免稅店協會．退款制說明與業者名單',
      en: 'National Tax-Free Shop Association, refund method explainer and operator list',
    },
    url: 'https://zenmenkyo.jp/refund-top/refund-system-2026/',
    contentLang: 'ja',
    accessed: ACCESSED,
  },
  {
    id: 'ptt-refund-reports',
    research: 'S19',
    title: {
      'zh-TW': 'PTT Japan_Travel 版，2026 年 6 至 7 月的退稅實際經驗與討論',
      en: 'PTT Japan_Travel discussion and first-hand refund accounts, June-July 2026',
    },
    url: 'https://www.ptt.cc/bbs/Japan_Travel/M.1781954991.A.46E.html',
    contentLang: 'zh-TW',
    accessed: ACCESSED,
  },
];

function pick<T>(value: T | PerLocale<T>, locale: Locale): T {
  return typeof value === 'object' && value !== null && locale in (value as PerLocale<T>)
    ? (value as PerLocale<T>)[locale]
    : (value as T);
}

function toRef(spec: SourceSpec, locale: Locale): SourceRef {
  const contentLang = pick(spec.contentLang, locale);
  const ref: SourceRef = {
    id: spec.id,
    title: spec.title[locale],
    url: pick(spec.url, locale),
    accessed: spec.accessed,
  };
  // `lang` means "not in the language you are reading", so it depends on the reader.
  return contentLang === locale ? ref : { ...ref, lang: contentLang };
}

function build(): PerLocale<readonly SourceRef[]> {
  const byLocale = {} as { [L in Locale]: readonly SourceRef[] };
  for (const locale of LOCALES) {
    byLocale[locale] = SPECS.map((spec) => toRef(spec, locale));
  }
  return byLocale;
}

/** The citation list for each language. Identical ids, per-locale titles and URLs. */
export const SOURCES: PerLocale<readonly SourceRef[]> = build();

/** `[Sx]` research-index id for a source id, for cross-checking against the notes. */
export const RESEARCH_IDS: Readonly<Record<string, string>> = Object.fromEntries(
  SPECS.map((spec) => [spec.id, spec.research]),
);
