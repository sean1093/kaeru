import { describe, expect, it, vi } from 'vitest';
import { isCalendarDate } from '../domain/dates.ts';
import { LOCALES, type Locale } from '../i18n/index.ts';
import {
  caveatFor,
  getArticle,
  getContent,
  getFaqEntry,
  getSection,
  resolveSources,
} from './index.ts';
import type { ContentBlock, ContentBundle, SourceRef } from './schema.ts';
import { RESEARCH_IDS, SOURCES } from './sources.ts';

const BUNDLES = LOCALES.map((locale) => [locale, getContent(locale)] as const);

type Labelled<T> = readonly [where: string, value: T];

/** Every block in a bundle, labelled with where it came from. */
function allBlocks(bundle: ContentBundle): Labelled<ContentBlock>[] {
  const found: Labelled<ContentBlock>[] = [];
  const add = (where: string, blocks: readonly ContentBlock[]) => {
    for (const [index, block] of blocks.entries()) found.push([`${where}[${index}]`, block]);
  };
  for (const article of bundle.articles) {
    for (const section of article.sections) add(`${section.id}.blocks`, section.blocks);
  }
  for (const entry of bundle.faq) add(`${entry.id}.answer`, entry.answer);
  for (const [operatorId, blocks] of Object.entries(bundle.operatorNotes)) {
    add(`operatorNotes.${operatorId}`, blocks);
  }
  return found;
}

/** Every reader-visible string in a bundle, labelled with where it came from. */
function labelledStrings(bundle: ContentBundle): Labelled<string>[] {
  const found: Labelled<string>[] = [];
  for (const article of bundle.articles) {
    found.push([`${article.id}.title`, article.title]);
    found.push([`${article.id}.summary`, article.summary]);
    for (const section of article.sections) found.push([`${section.id}.title`, section.title]);
  }
  for (const entry of bundle.faq) found.push([`${entry.id}.question`, entry.question]);
  for (const source of bundle.sources) found.push([`${source.id}.title`, source.title]);
  for (const [at, block] of allBlocks(bundle)) {
    if (block.heading !== undefined) found.push([`${at}.heading`, block.heading]);
    for (const [i, line] of block.body.entries()) found.push([`${at}.body[${i}]`, line]);
    for (const [r, row] of (block.rows ?? []).entries()) {
      for (const [c, cell] of row.entries()) found.push([`${at}.rows[${r}][${c}]`, cell]);
    }
  }
  return found;
}

describe('content parity between the two languages (TC-I18N-001)', () => {
  const [reference, ...others] = LOCALES;
  const referenceBundle = getContent(reference);

  it.each(others)('%s carries the same article ids, in the same order', (locale) => {
    expect(getContent(locale).articles.map((a) => a.id)).toEqual(
      referenceBundle.articles.map((a) => a.id),
    );
  });

  it.each(others)('%s carries the same section ids under every article', (locale) => {
    const sectionsOf = (bundle: ContentBundle) =>
      Object.fromEntries(
        bundle.articles.map((a) => [a.id, a.sections.map((section) => section.id)]),
      );
    expect(sectionsOf(getContent(locale))).toEqual(sectionsOf(referenceBundle));
  });

  it.each(others)('%s carries the same FAQ ids, in the same order', (locale) => {
    expect(getContent(locale).faq.map((entry) => entry.id)).toEqual(
      referenceBundle.faq.map((entry) => entry.id),
    );
  });

  it.each(others)('%s carries the same source ids', (locale) => {
    expect(getContent(locale).sources.map((source) => source.id)).toEqual(
      referenceBundle.sources.map((source) => source.id),
    );
  });

  it.each(others)('%s carries notes for the same operators', (locale) => {
    expect(Object.keys(getContent(locale).operatorNotes).sort()).toEqual(
      Object.keys(referenceBundle.operatorNotes).sort(),
    );
  });

  it.each(others)('%s cites the same sources in the same places', (locale) => {
    const citations = (bundle: ContentBundle) =>
      allBlocks(bundle).map(([at, block]) => [at, [...(block.sourceIds ?? [])].sort()]);
    expect(citations(getContent(locale))).toEqual(citations(referenceBundle));
  });

  it.each(others)('%s uses the same block kinds in the same order', (locale) => {
    const kinds = (bundle: ContentBundle) =>
      allBlocks(bundle).map(([at, block]) => [at, block.kind, block.body.length]);
    expect(kinds(getContent(locale))).toEqual(kinds(referenceBundle));
  });
});

describe('content values (TC-I18N-002)', () => {
  it.each(BUNDLES)('%s has no empty string', (_locale, bundle) => {
    const empty = labelledStrings(bundle)
      .filter(([, value]) => value.trim() === '')
      .map(([at]) => at);
    expect(empty).toEqual([]);
  });

  it.each(BUNDLES)('%s never shows an id where prose should be', (_locale, bundle) => {
    for (const article of bundle.articles) {
      expect(article.title).not.toBe(article.id);
      expect(article.summary).not.toBe(article.id);
      for (const section of article.sections) expect(section.title).not.toBe(section.id);
    }
    for (const entry of bundle.faq) expect(entry.question).not.toBe(entry.id);
  });

  it.each(BUNDLES)('%s has no unsubstituted placeholder (TC-I18N-003)', (_locale, bundle) => {
    // Content is finished prose, not a template: a `{name}` here would reach the screen.
    const templated = labelledStrings(bundle)
      .filter(([, value]) => /\{\w+\}/.test(value))
      .map(([at]) => at);
    expect(templated).toEqual([]);
  });

  it.each(BUNDLES)('%s keeps ids unique', (_locale, bundle) => {
    const ids = [
      ...bundle.articles.map((a) => a.id),
      ...bundle.articles.flatMap((a) => a.sections.map((section) => section.id)),
      ...bundle.faq.map((entry) => entry.id),
      ...bundle.sources.map((source) => source.id),
    ];
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates).toEqual([]);
  });
});

describe('block shape', () => {
  it.each(BUNDLES)('%s gives every callout a tone and every table its rows', (_locale, bundle) => {
    for (const [at, block] of allBlocks(bundle)) {
      if (block.kind === 'callout') {
        expect(block.tone, `${at} is a callout with no tone`).toBeDefined();
      } else {
        expect(block.tone, `${at} is not a callout but carries a tone`).toBeUndefined();
      }
      if (block.kind === 'table') {
        const rows = block.rows ?? [];
        expect(rows.length, `${at} is a table with fewer than two rows`).toBeGreaterThan(1);
        const width = rows[0]?.length ?? 0;
        for (const row of rows) expect(row.length, `${at} has a ragged row`).toBe(width);
      } else {
        expect(block.rows, `${at} is not a table but carries rows`).toBeUndefined();
        expect(block.body.length, `${at} has no body`).toBeGreaterThan(0);
      }
    }
  });
});

describe('citations', () => {
  it.each(BUNDLES)('%s resolves every cited source id', (locale, bundle) => {
    const known = new Set(bundle.sources.map((source) => source.id));
    const dangling = allBlocks(bundle)
      .flatMap(([at, block]) => (block.sourceIds ?? []).map((id) => [at, id] as const))
      .filter(([, id]) => !known.has(id))
      .map(([at, id]) => `${at} -> ${id}`);
    expect(dangling, `unknown source ids in ${locale}`).toEqual([]);
  });

  it.each(BUNDLES)('%s gives every source a URL and an access date', (_locale, bundle) => {
    for (const source of bundle.sources) {
      expect(source.url, source.id).toMatch(/^https:\/\//);
      expect(isCalendarDate(source.accessed), `${source.id} accessed ${source.accessed}`).toBe(
        true,
      );
    }
  });

  it('marks a source only when it is not in the reader language', () => {
    const byId = (refs: readonly SourceRef[], id: string) => refs.find((ref) => ref.id === id);
    // The association page is Japanese for everyone; the PTT thread is Chinese, which is
    // the reader's own language in zh-TW and needs flagging in English.
    expect(byId(SOURCES['zh-TW'], 'association-refund')?.lang).toBe('ja');
    expect(byId(SOURCES.en, 'association-refund')?.lang).toBe('ja');
    expect(byId(SOURCES['zh-TW'], 'ptt-refund-reports')?.lang).toBeUndefined();
    expect(byId(SOURCES.en, 'ptt-refund-reports')?.lang).toBe('zh-TW');
  });

  it('traces every source back to the research index', () => {
    for (const source of SOURCES['zh-TW']) {
      expect(RESEARCH_IDS[source.id], source.id).toMatch(/^S\d+$/);
    }
  });

  it('resolves citations in registry order and drops nothing silently it can resolve', () => {
    const resolved = resolveSources('en', ['nta-refund-method', 'jta-traveler-page', 'nope']);
    expect(resolved.map((source) => source.id)).toEqual(['jta-traveler-page', 'nta-refund-method']);
    expect(resolveSources('en', undefined)).toEqual([]);
  });
});

describe('lookups', () => {
  it.each(LOCALES)('%s finds an article and its sections by id', (locale: Locale) => {
    expect(getArticle(locale, 'guide.intro')?.id).toBe('guide.intro');
    expect(getSection(locale, 'guide.intro.what-changed')?.blocks.length).toBeGreaterThan(0);
    expect(getArticle(locale, 'guide.nothing')).toBeUndefined();
    expect(getSection(locale, 'guide.nothing')).toBeUndefined();
    expect(getFaqEntry(locale, 'guide.faq.nothing')).toBeUndefined();
  });

  it('attaches exactly the citations an article uses', () => {
    const article = getArticle('zh-TW', 'guide.intro');
    expect(article?.sources.map((source) => source.id)).toEqual([
      'jta-traveler-page',
      'nta-refund-method',
    ]);
  });
});

describe('caveats (DR-053)', () => {
  it('flags everything that is not confirmed official', () => {
    expect(caveatFor('confirmed-official')).toBeNull();
    expect(caveatFor('reported-media')).toBe('reported-media');
    expect(caveatFor('unconfirmed')).toBe('unconfirmed');
    expect(caveatFor('pending-legislation')).toBe('pending-legislation');
  });

  it.each(BUNDLES)('%s states a reviewed date on every article', (_locale, bundle) => {
    for (const article of bundle.articles) {
      expect(isCalendarDate(article.lastReviewed), article.id).toBe(true);
    }
  });
});

describe('offline (TC-AIR-008)', () => {
  it('loads and reads content with no network of any kind', async () => {
    const fetchSpy = vi.fn(() => {
      throw new Error('content must never reach the network');
    });
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal(
      'XMLHttpRequest',
      class {
        constructor() {
          throw new Error('content must never reach the network');
        }
      },
    );
    try {
      // Re-imported deliberately: a static import would have run module initialisation
      // before the stubs, and module load is exactly the moment a lazy fetch would fire.
      vi.resetModules();
      const fresh = await import('./index.ts');
      for (const locale of LOCALES) {
        const bundle = fresh.getContent(locale);
        expect(bundle.articles.length).toBeGreaterThan(0);
        expect(bundle.sources.length).toBeGreaterThan(0);
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });
});
