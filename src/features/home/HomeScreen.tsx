import type { JSX } from 'preact';
import { systemClock, systemStatus, TAX_FREE_SYSTEM_START } from '../../domain/index.ts';
import { activeLocale, formatDate, formatNumber, useMessages } from '../../i18n/index.ts';
import { Card } from '../../ui/index.ts';
import styles from './HomeScreen.module.css';
import { messages } from './messages.ts';

export function HomeScreen(): JSX.Element {
  const t = useMessages(messages);
  const locale = activeLocale.value;
  const status = systemStatus(systemClock);
  const startDate = formatDate(locale, TAX_FREE_SYSTEM_START);

  return (
    <>
      <section class={styles.hero}>
        <h1 class={styles.title}>{t('home.title')}</h1>
        <p class={styles.countdown} data-testid="system-countdown">
          {status.phase === 'before'
            ? t('home.countdown.before', {
                days: formatNumber(locale, status.daysUntilStart),
                date: startDate,
              })
            : t('home.countdown.active', { date: startDate })}
        </p>
      </section>

      <Card title={t('home.what.title')}>
        <ul class={styles.list}>
          <li>{t('home.what.receipts')}</li>
          <li>{t('home.what.deadlines')}</li>
          <li>{t('home.what.airport')}</li>
        </ul>
      </Card>

      <Card title={t('home.privacy.title')}>
        <p>{t('home.privacy.body')}</p>
      </Card>

      <Card title={t('home.status.milestone')}>
        <p>{t('home.status.body')}</p>
      </Card>
    </>
  );
}
