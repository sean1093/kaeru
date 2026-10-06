import type { JSX } from 'preact';
import { online } from '../../app/connectivity.ts';
import { hrefFor } from '../../app/router.ts';
import { pathTo, screenAttrs } from '../../app/screens.ts';
import { getContent, getOperatorDirectory } from '../../content/index.ts';
import { messages as contentMessages } from '../../content/messages.ts';
import { activeLocale, formatDate, useMessages } from '../../i18n/index.ts';
import { EmptyState } from '../../ui/index.ts';
import { ContentBlocks } from './ContentBlocks.tsx';
import styles from './Guide.module.css';
import { messages } from './messages.ts';

/**
 * S53 — one operator.
 *
 * The fee block is the whole reason this screen is careful. `DR-051`: an absent fee is
 * **unknown**, never zero, and eight of the ten shipped operators publish nothing — so the
 * common case here is saying we do not know, in words, rather than rendering a blank or a
 * reassuring 0%. `DR-026`: every figure we do show is dated, because Ocean's terms changed
 * materially inside four weeks and an undated fee is worse than none.
 */
export function OperatorScreen({
  params,
}: {
  params: Readonly<Record<string, string>>;
}): JSX.Element {
  const t = useMessages(messages);
  const tc = useMessages(contentMessages);
  const locale = activeLocale.value;
  const directory = getOperatorDirectory();
  const operator = directory.operators.find((candidate) => candidate.id === params.operatorId);

  if (operator === undefined) {
    return (
      <div class={styles.screen} {...screenAttrs('S53')}>
        <EmptyState
          headline={t('operators.missing.title')}
          body={t('operators.missing.body')}
          action={{ label: t('operators.missing.action'), href: hrefFor(pathTo('S52')) }}
        />
      </div>
    );
  }

  const notes = getContent(locale).operatorNotes[operator.id] ?? [];
  const observedOn = operator.feeSourceDate ?? directory.observedOn;

  return (
    <div class={styles.screen} {...screenAttrs('S53')}>
      <h1 class={styles.title}>{operator.name[locale]}</h1>
      {/* The Japanese corporate name, marked as Japanese so a screen reader does not read
          it in the page language. */}
      <p class={styles.summary} lang="ja">
        {operator.name.ja}
      </p>

      <section class={styles.section} aria-labelledby="register-heading">
        <h2 id="register-heading" class={styles.sectionHeading}>
          {t('operators.howToRegister')}
        </h2>
        <p class={styles.paragraph}>
          {operator.registrationMethod
            .map((method) => t(`operators.registration.${method}`))
            .join(' · ')}
        </p>
      </section>

      <section class={styles.section} aria-labelledby="pay-heading">
        <h2 id="pay-heading" class={styles.sectionHeading}>
          {t('operators.howTheyPay')}
        </h2>
        <p class={styles.paragraph} data-testid="operator-refund-methods">
          {operator.refundMethods.length === 0
            ? t('operators.unknown')
            : operator.refundMethods.map((method) => t(`operators.refund.${method}`)).join(' · ')}
        </p>
      </section>

      <section class={styles.section} aria-labelledby="fee-heading">
        <h2 id="fee-heading" class={styles.sectionHeading}>
          {t('operators.fee')}
        </h2>
        <p class={styles.paragraph} data-testid="operator-fee">
          {/*
            DR-051. `feeNote: null` and `fees: []` both mean we found nothing, and the
            screen says so in a sentence rather than leaving a gap a reader fills with
            "free". Saying we did not find a figure is also a claim about our own work,
            which is the honest version.
          */}
          {operator.feeNote === null ? t('operators.feeUnknown') : operator.feeNote[locale]}
        </p>
        <p class={styles.reviewed} data-testid="operator-fee-date">
          {t('operators.asOf', { date: formatDate(locale, observedOn) })}
        </p>
      </section>

      {notes.length > 0 && (
        <section class={styles.section} aria-labelledby="notes-heading">
          <h2 id="notes-heading" class={styles.sectionHeading}>
            {t('operators.notes')}
          </h2>
          {/* The operator's own status qualifies its prose: a company describing itself is
              a primary source about itself, and a traveller report is not the same thing. */}
          <ContentBlocks blocks={notes} articleStatus={operator.status} />
        </section>
      )}

      {/*
        #38, wireframes "Offline": the outbound link is one of the few places being offline
        changes what a traveller can do, so it is the one place that says so — and says what
        still works, because "offline" read alone sounds like the app is broken. A live region,
        so losing signal while reading is announced rather than discovered on the tap.
      */}
      <div role="status">
        {online.value ? (
          <p class={styles.paragraph}>
            <a
              href={operator.url}
              target="_blank"
              rel="noreferrer noopener"
              data-testid="operator-visit"
            >
              {t('operators.visit', { name: operator.name[locale] })}
            </a>
          </p>
        ) : (
          <div class={styles.caveat} data-testid="operator-offline">
            <p>{t('operators.offline')}</p>
            <p>{t('operators.offlineReassurance')}</p>
          </div>
        )}
      </div>

      <p class={styles.caveat} data-testid="operator-disclaimer">
        {tc('content.operators.disclaimer')}
      </p>

      <p class={styles.offline}>
        <a href={hrefFor(pathTo('S52'))}>{t('operators.back')}</a>
      </p>
    </div>
  );
}
