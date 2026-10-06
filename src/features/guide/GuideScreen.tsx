import type { JSX } from 'preact';
import { hrefFor, registeredRoutes } from '../../app/router.ts';
import { pathTo, screenAttrs } from '../../app/screens.ts';
import { getContent } from '../../content/index.ts';
import { activeLocale, useMessages } from '../../i18n/index.ts';
import { List, ListRow } from '../../ui/index.ts';
import styles from './Guide.module.css';
import { messages } from './messages.ts';

/**
 * S50 — the guide index.
 *
 * Four destinations and one promise: the content is bundled, so it works with the radio
 * off. That line is not decoration — a traveller reads this standing in a departure lobby
 * on airport wifi, and a guide that needed the network would be absent exactly when the
 * procedure it describes is happening.
 *
 * The sections come from the content layer rather than being listed here, because the
 * guide is the only place rule prose lives: a screen that restated a title would be a
 * second copy of it (IA flow H).
 */
export function GuideScreen(): JSX.Element {
  const t = useMessages(messages);
  const bundle = getContent(activeLocale.value);
  const explainerIsRegistered = registeredRoutes.value.some((route) =>
    route.screenIds.includes('S05'),
  );

  return (
    <div class={styles.screen} {...screenAttrs('S50')}>
      <h1 class={styles.title}>{t('guide.title')}</h1>

      <List label={t('guide.title')}>
        {bundle.articles.map((article, index) => (
          <ListRow
            key={article.id}
            href={hrefFor(pathTo('S51', { articleId: article.id }))}
            primary={article.title}
            secondary={article.summary}
            last={index === bundle.articles.length - 1 && bundle.faq.length === 0}
          />
        ))}
        <ListRow
          href={hrefFor(pathTo('S52'))}
          primary={t('guide.operators.title')}
          secondary={t('guide.operators.summary')}
        />
        <ListRow
          href={hrefFor(pathTo('S54'))}
          primary={t('guide.faq.title')}
          secondary={t('guide.faq.summary')}
          last
        />
      </List>

      {/*
        The 60-second explainer, re-openable from here (wireframe S50, UJ-001). Rendered
        only once onboarding has registered S05: until #34 lands there is no route to send
        anyone to, and a link to the not-found screen is worse than no link. It appears on
        its own the moment that feature registers, with nothing to remember here.
      */}
      {explainerIsRegistered && (
        <p class={styles.offline}>
          <a href={hrefFor(pathTo('S05', { step: '1' }))} data-testid="guide-replay-explainer">
            {t('guide.replayExplainer')}
          </a>
        </p>
      )}

      <p class={styles.offline} data-testid="guide-offline">
        {t('guide.offline')}
      </p>
    </div>
  );
}
