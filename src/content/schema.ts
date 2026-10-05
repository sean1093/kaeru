/**
 * Bundled content: the guide, the FAQ and the operator directory.
 *
 * Contract module: types only. Implemented by M1-4.
 *
 * Content ships with the build so it works offline (ADR 0002, ADR 0007), and it is the
 * **only** place rule prose lives: app screens link into the guide rather than restating a
 * threshold, so a number can never drift between two namespaces (IA flow H).
 *
 * Every factual claim carries its source and the date it was accessed, and anything whose
 * status is not `confirmed-official` renders with a visible caveat (DR-053, UR-01..UR-12).
 */
import type { CalendarDate } from '../domain/dates.ts';
import type { Operator, SourceStatus } from '../domain/model.ts';
import type { Locale } from '../i18n/index.ts';

/** A citation. `accessed` is the date a human actually opened the page. */
export interface SourceRef {
  id: string;
  title: string;
  url: string;
  accessed: CalendarDate;
  /** Set when the source is not in the reader's language, so the UI can say so. */
  lang?: 'ja' | 'en' | 'zh-TW';
}

export type ContentBlockKind = 'paragraph' | 'list' | 'steps' | 'callout' | 'table';

/**
 * Content is structured data, not HTML strings: it renders through the UI kit, stays
 * translatable, and cannot smuggle markup into the app.
 */
export interface ContentBlock {
  kind: ContentBlockKind;
  /** Short heading above the block. */
  heading?: string;
  /** Paragraphs, list items or step bodies, depending on `kind`. */
  body: readonly string[];
  /** `callout` only: how loudly to render it. */
  tone?: 'info' | 'attention' | 'success';
  /** `table` only: header row then data rows. */
  rows?: readonly (readonly string[])[];
  sourceIds?: readonly string[];
}

export interface GuideSection {
  /** Stable key such as `guide.steps.customs`; deep links and in-app term links use it. */
  id: string;
  title: string;
  blocks: readonly ContentBlock[];
}

export interface GuideArticle {
  /** Stable key such as `guide.steps`; S51 routes on it. */
  id: string;
  title: string;
  summary: string;
  sections: readonly GuideSection[];
  sources: readonly SourceRef[];
  /** Shown as a caveat when not `confirmed-official` (S51). */
  status: SourceStatus | 'pending-legislation';
  lastReviewed: CalendarDate;
}

export interface FaqEntry {
  /** Stable key such as `guide.faq.q11`, which the fee warning on S2B links into. */
  id: string;
  question: string;
  answer: readonly ContentBlock[];
  sourceIds?: readonly string[];
}

/** One locale's worth of content. Both locales must carry the same ids (parity test). */
export interface ContentBundle {
  locale: Locale;
  articles: readonly GuideArticle[];
  faq: readonly FaqEntry[];
  /** Translated prose about each operator; the structured facts live in the `Operator`. */
  operatorNotes: Readonly<Record<string, readonly ContentBlock[]>>;
  sources: readonly SourceRef[];
}

/**
 * The operator directory as the UI consumes it: shipped facts plus the four operators
 * Taiwanese travelers meet most, pinned first (IA flow H, S52).
 */
export interface OperatorDirectory {
  operators: readonly Operator[];
  commonFirst: readonly string[];
  /** Date the catalogue was observed; every fee figure is a snapshot of it (DR-026). */
  observedOn: CalendarDate;
  /**
   * The association's own caveat: the list is operators' declarations, not an approval or
   * a guarantee, and Kaeru must carry that into the UI (DR-053).
   */
  disclaimerKey: string;
}

export type GetContent = (locale: Locale) => ContentBundle;
export type GetArticle = (locale: Locale, id: string) => GuideArticle | undefined;
export type GetFaqEntry = (locale: Locale, id: string) => FaqEntry | undefined;
export type GetOperatorDirectory = () => OperatorDirectory;
