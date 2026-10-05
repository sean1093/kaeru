/**
 * The bundled content layer.
 *
 * Everything here is a plain value compiled into the JavaScript bundle. Nothing fetches,
 * nothing is lazy, nothing can fail: a traveller standing in a queue with the radio off
 * reads the same guide as one on hotel Wi-Fi (ADR 0002, ADR 0007, `TC-AIR-008`).
 *
 * It is also the only place rule prose lives. Screens link into a section id rather than
 * restating a threshold, so a number cannot drift between two namespaces (IA flow H).
 */
import type { Locale } from '../i18n/index.ts';
import { FAQ_ENTRIES as EN_FAQ } from './faq.en.ts';
import { FAQ_ENTRIES as ZH_FAQ } from './faq.zh-TW.ts';
import { GUIDE_ARTICLES as EN_ARTICLES } from './guide.en.ts';
import { GUIDE_ARTICLES as ZH_ARTICLES } from './guide.zh-TW.ts';
import { OPERATOR_NOTES as EN_OPERATOR_NOTES } from './operator-notes.en.ts';
import { OPERATOR_NOTES as ZH_OPERATOR_NOTES } from './operator-notes.zh-TW.ts';
import { buildOperatorDirectory } from './operators.ts';
import type {
  ContentBlock,
  ContentBundle,
  FaqEntry,
  GetArticle,
  GetContent,
  GetFaqEntry,
  GetOperatorDirectory,
  GuideArticle,
  GuideSection,
  OperatorDirectory,
  SourceRef,
} from './schema.ts';
import { type ArticleSeed, withSources } from './seeds.ts';
import { SOURCES } from './sources.ts';

const SEEDS: Readonly<Record<Locale, readonly ArticleSeed[]>> = {
  'zh-TW': ZH_ARTICLES,
  en: EN_ARTICLES,
};

const FAQ: Readonly<Record<Locale, readonly FaqEntry[]>> = {
  'zh-TW': ZH_FAQ,
  en: EN_FAQ,
};

const OPERATOR_NOTES: Readonly<Record<Locale, Readonly<Record<string, readonly ContentBlock[]>>>> =
  {
    'zh-TW': ZH_OPERATOR_NOTES,
    en: EN_OPERATOR_NOTES,
  };

interface LoadedBundle {
  readonly bundle: ContentBundle;
  readonly articlesById: ReadonlyMap<string, GuideArticle>;
  readonly sectionsById: ReadonlyMap<string, GuideSection>;
  readonly faqById: ReadonlyMap<string, FaqEntry>;
}

function load(locale: Locale): LoadedBundle {
  const sources = SOURCES[locale];
  const articles = SEEDS[locale].map((seed) => withSources(seed, sources));
  const faq = FAQ[locale];

  const sectionsById = new Map<string, GuideSection>();
  for (const article of articles) {
    for (const section of article.sections) sectionsById.set(section.id, section);
  }

  return {
    bundle: { locale, articles, faq, operatorNotes: OPERATOR_NOTES[locale], sources },
    articlesById: new Map(articles.map((article) => [article.id, article])),
    sectionsById,
    faqById: new Map(faq.map((entry) => [entry.id, entry])),
  };
}

const LOADED: Readonly<Record<Locale, LoadedBundle>> = {
  'zh-TW': load('zh-TW'),
  en: load('en'),
};

const OPERATOR_DIRECTORY: OperatorDirectory = buildOperatorDirectory();

/** Everything bundled for one language. */
export const getContent: GetContent = (locale) => LOADED[locale].bundle;

/** The operator directory. Locale-neutral: each `Operator.name`/`feeNote` is per-locale. */
export const getOperatorDirectory: GetOperatorDirectory = () => OPERATOR_DIRECTORY;

/** One guide article by its stable id, e.g. `guide.steps`. S51 routes on this. */
export const getArticle: GetArticle = (locale, id) => LOADED[locale].articlesById.get(id);

/**
 * One section by its stable id, e.g. `guide.steps.4`. In-app term links and deep links
 * point at sections, so a screen can send a traveller to the exact paragraph rather than
 * to the top of a long article.
 */
export function getSection(locale: Locale, id: string): GuideSection | undefined {
  return LOADED[locale].sectionsById.get(id);
}

/** One FAQ entry by id, e.g. `guide.faq.q11`, which the fee warning on S2B links into. */
export const getFaqEntry: GetFaqEntry = (locale, id) => LOADED[locale].faqById.get(id);

/**
 * The citations a block declares, in registry order. An id with no entry is dropped
 * rather than rendered as a dead footnote; the content integrity test is what turns a
 * typo into a failing build.
 */
export function resolveSources(
  locale: Locale,
  ids: readonly string[] | undefined,
): readonly SourceRef[] {
  if (!ids || ids.length === 0) return [];
  const wanted = new Set(ids);
  return LOADED[locale].bundle.sources.filter((source) => wanted.has(source.id));
}

/** Content whose standing the UI must qualify out loud (`DR-053`, `UR-01`..`UR-12`). */
export type ContentCaveat = Exclude<GuideArticle['status'], 'confirmed-official'>;

/**
 * The caveat an article must render with, or `null` when it is confirmed official.
 * Anything we have only from media reports, from an operator's own declaration, or from a
 * bill that has not passed has to say so where it is read, not in a footnote.
 */
export function caveatFor(status: GuideArticle['status']): ContentCaveat | null {
  return status === 'confirmed-official' ? null : status;
}
