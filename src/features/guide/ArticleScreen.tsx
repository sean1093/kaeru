import type { JSX } from 'preact';
import { hrefFor } from '../../app/router.ts';
import { pathTo, screenAttrs } from '../../app/screens.ts';
import { getArticle, resolveSources } from '../../content/index.ts';
import { activeLocale, formatDate, useMessages } from '../../i18n/index.ts';
import { EmptyState } from '../../ui/index.ts';
import { ContentBlocks } from './ContentBlocks.tsx';
import styles from './Guide.module.css';
import { messages } from './messages.ts';

/**
 * S51 — one guide article.
 *
 * Two things this screen owes the reader, and both are about provenance rather than prose:
 *
 * - **Every claim carries its own standing.** A block that rests on a bill that has not
 *   passed renders its caveat beside itself, not in a footnote and not hoisted to the top
 *   where it would discredit the rest of the article (`schema.ts`, `ContentBlock.status`).
 * - **Sources are dated with the day a human actually opened the page.** An undated
 *   citation is an assertion wearing a link, and the rules behind this article changed
 *   once already.
 */
export function ArticleScreen({
  params,
}: {
  params: Readonly<Record<string, string>>;
}): JSX.Element {
  const t = useMessages(messages);
  const locale = activeLocale.value;
  const article = getArticle(locale, params.articleId ?? '');

  if (article === undefined) {
    // A link into an article that does not exist is a bug, not a user error — but a blank
    // screen in a departure lobby is worse than either, so it says so and offers the way back.
    return (
      <div class={styles.screen} {...screenAttrs('S51')}>
        <EmptyState
          headline={t('guide.missing.title')}
          body={t('guide.missing.body')}
          action={{ label: t('guide.missing.action'), href: hrefFor(pathTo('S50')) }}
        />
      </div>
    );
  }

  return (
    <div class={styles.screen} {...screenAttrs('S51')}>
      <h1 class={styles.title}>{article.title}</h1>
      <p class={styles.summary}>{article.summary}</p>

      {article.sections.map((section) => (
        <section key={section.id} class={styles.section} aria-labelledby={`${section.id}-heading`}>
          <h2 id={`${section.id}-heading`} class={styles.sectionHeading}>
            {section.title}
          </h2>
          <ContentBlocks blocks={section.blocks} articleStatus={article.status} />
        </section>
      ))}

      <section class={styles.sources} aria-labelledby="sources-heading" data-testid="source-list">
        <h2 id="sources-heading" class={styles.sectionHeading}>
          {t('guide.sources.title')}
        </h2>
        <p class={styles.reviewed}>
          {t('guide.sources.reviewed', { date: formatDate(locale, article.lastReviewed) })}
        </p>
        <ul class={styles.sourceList}>
          {article.sections
            .flatMap((section) => section.blocks)
            .flatMap((block) => resolveSources(locale, block.sourceIds))
            .concat(article.sources)
            .filter(
              (source, index, all) => all.findIndex((other) => other.id === source.id) === index,
            )
            .map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer noopener">
                  {source.title}
                </a>
                {source.lang !== undefined && (
                  <span class={styles.sourceLang}>{t(`guide.sources.lang.${source.lang}`)}</span>
                )}
                {/* A `<time>` carrying the ISO date, so the date is machine-readable and
                    a reader's own format stays a presentation choice. */}
                <span class={styles.sourceAccessed}>
                  {t('guide.sources.accessed')}{' '}
                  <time dateTime={source.accessed}>{formatDate(locale, source.accessed)}</time>
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
