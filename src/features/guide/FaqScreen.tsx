import type { JSX } from 'preact';
import { hrefFor } from '../../app/router.ts';
import { pathTo, screenAttrs } from '../../app/screens.ts';
import { getContent } from '../../content/index.ts';
import { activeLocale, useMessages } from '../../i18n/index.ts';
import { ContentBlocks } from './ContentBlocks.tsx';
import styles from './Guide.module.css';
import { messages } from './messages.ts';

/**
 * S54 — the FAQ.
 *
 * Every entry is on one page and open, rather than behind an accordion. Two reasons: the
 * questions are short, and the screens that link here link to a **specific** entry
 * (`pathTo('S54', { entryId: 'q11' })` from the fee warning on S2B), so an answer that
 * needed a tap to reveal would deep-link to a closed box.
 *
 * The entry named in the route is highlighted and scrolled to rather than isolated: a
 * traveller who arrived from the fee warning usually wants the two questions either side
 * of it as well.
 */
export function FaqScreen({ params }: { params: Readonly<Record<string, string>> }): JSX.Element {
  const t = useMessages(messages);
  const locale = activeLocale.value;
  const bundle = getContent(locale);
  const wanted = params.entryId;

  return (
    <div class={styles.screen} {...screenAttrs('S54')}>
      <h1 class={styles.title}>{t('guide.faq.title')}</h1>

      {bundle.faq.map((entry) => (
        <section
          key={entry.id}
          id={entry.id}
          class={entry.id === wanted ? styles.faqHighlighted : styles.faq}
          aria-labelledby={`${entry.id}-question`}
          data-testid={`faq-${entry.id}`}
          data-highlighted={entry.id === wanted ? 'true' : undefined}
        >
          <h2 id={`${entry.id}-question`} class={styles.question}>
            {entry.question}
          </h2>
          {/*
            An FAQ answer has no article to inherit from, so a block says its own standing
            or has none. Passing `undefined` is what makes "unmarked means confirmed"
            true here rather than silently inheriting someone else's caveat.
          */}
          <ContentBlocks blocks={entry.answer} articleStatus={undefined} />
        </section>
      ))}

      <p class={styles.offline}>
        <a href={hrefFor(pathTo('S50'))}>{t('guide.back')}</a>
      </p>
    </div>
  );
}
