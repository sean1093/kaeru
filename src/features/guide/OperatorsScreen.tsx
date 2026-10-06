import type { JSX } from 'preact';
import { hrefFor } from '../../app/router.ts';
import { pathTo, screenAttrs } from '../../app/screens.ts';
import { getOperatorDirectory } from '../../content/index.ts';
import { messages as contentMessages } from '../../content/messages.ts';
import type { Operator } from '../../domain/index.ts';
import { activeLocale, useMessages } from '../../i18n/index.ts';
import { List, ListRow } from '../../ui/index.ts';
import styles from './Guide.module.css';
import { messages } from './messages.ts';

/**
 * S52 — the operator directory.
 *
 * The screen's job is to be useful **and** to refuse an implication. The list exists
 * because a traveller holding a receipt needs to recognise a name on it; it must never
 * read as a set of options they chose between, and it must never read as approved.
 *
 * - **The shop picks the operator, not the traveller** (`DR-050`, `UR-05`). Said plainly,
 *   because a directory that looks like a chooser invites someone to go looking for a
 *   shop that uses the one with the lowest fee, which is not a thing they can do.
 * - **The association's caveat is carried, not paraphrased** (`DR-053`). It is one string
 *   owned by the content layer, so the sentence a reader sees is the one the travel expert
 *   reviewed — this screen renders it and does not get a vote.
 */
export function OperatorsScreen(): JSX.Element {
  const t = useMessages(messages);
  const tc = useMessages(contentMessages);
  const locale = activeLocale.value;
  const directory = getOperatorDirectory();

  const common = directory.commonFirst
    .map((id) => directory.operators.find((operator) => operator.id === id))
    .filter((operator): operator is Operator => operator !== undefined);
  const others = directory.operators.filter(
    (operator) => !directory.commonFirst.includes(operator.id),
  );

  const rowFor = (operator: Operator, last: boolean): JSX.Element => (
    <ListRow
      key={operator.id}
      href={hrefFor(pathTo('S53', { operatorId: operator.id }))}
      primary={operator.name[locale]}
      secondary={operator.registrationMethod
        .map((method) => t(`operators.registration.${method}`))
        .join(' · ')}
      last={last}
    />
  );

  return (
    <div class={styles.screen} {...screenAttrs('S52')}>
      <h1 class={styles.title}>{t('guide.operators.title')}</h1>

      <p class={styles.offline} data-testid="operator-not-a-choice">
        {t('operators.shopPicks')}
      </p>

      <h2 class={styles.sectionHeading}>{t('operators.common')}</h2>
      <List label={t('operators.common')}>
        {common.map((operator, index) => rowFor(operator, index === common.length - 1))}
      </List>

      <h2 class={styles.sectionHeading}>{t('operators.others')}</h2>
      <List label={t('operators.others')}>
        {others.map((operator, index) => rowFor(operator, index === others.length - 1))}
      </List>

      {/*
        DR-053, rendered from the content layer's own string rather than reworded here: the
        sentence a reader sees is the one the travel expert reviewed.
      */}
      <p class={styles.caveat} data-testid="operator-disclaimer">
        {tc('content.operators.disclaimer')}
      </p>
    </div>
  );
}
