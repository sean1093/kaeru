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
 * An accordion whose open entry is driven by the route (IA line 340). Native
 * `<details>`/`<summary>`, so keyboard operation and the announced expanded state are the
 * platform's rather than ours to re-implement and get subtly wrong.
 *
 * The entry named in the route opens; the rest stay collapsed. That is also the better
 * answer to the deep-link case than rendering everything open: someone arriving from S2B's
 * fee warning lands on **one open answer** rather than on one highlighted answer with six
 * other full answers to scroll past, and the neighbouring questions are still right there
 * as headings to open.
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
        <details
          key={entry.id}
          id={entry.id}
          class={entry.id === wanted ? styles.faqHighlighted : styles.faq}
          open={entry.id === wanted}
          data-testid={`faq-${entry.id}`}
        >
          <summary class={styles.question}>
            <h2 class={styles.questionText}>{entry.question}</h2>
          </summary>
          {/*
            An FAQ answer has no article to inherit from, so a block says its own standing
            or has none. Passing `undefined` is what makes "unmarked means confirmed"
            true here rather than silently inheriting someone else's caveat.
          */}
          <ContentBlocks blocks={entry.answer} articleStatus={undefined} />
        </details>
      ))}

      <p class={styles.offline}>
        <a href={hrefFor(pathTo('S50'))}>{t('guide.back')}</a>
      </p>
    </div>
  );
}
