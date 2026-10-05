/**
 * How authored content becomes a `ContentBundle`.
 *
 * Authors write prose and cite source ids. They never hand-maintain the resolved citation
 * list on an article: `GuideArticle.sources` is derived from the `sourceIds` its blocks
 * actually use, so a citation cannot be listed and unused, or used and unlisted. That is
 * one less thing for a reviewer to check and one less way for the two languages to drift.
 */
import type { ContentBlock, GuideArticle, SourceRef } from './schema.ts';

/** An article as authored: everything except the citation list the loader derives. */
export type ArticleSeed = Omit<GuideArticle, 'sources'>;

/** Every source id cited anywhere in a run of blocks, in first-use order. */
export function citedIn(blocks: Iterable<ContentBlock>, into: Set<string>): Set<string> {
  for (const block of blocks) {
    for (const id of block.sourceIds ?? []) into.add(id);
  }
  return into;
}

/**
 * Attach the resolved citations an article uses. Unknown ids are dropped here and caught
 * by the content integrity test, so a typo is a failing build rather than a dead footnote.
 */
export function withSources(seed: ArticleSeed, registry: readonly SourceRef[]): GuideArticle {
  const cited = new Set<string>();
  for (const section of seed.sections) citedIn(section.blocks, cited);
  return { ...seed, sources: registry.filter((source) => cited.has(source.id)) };
}
