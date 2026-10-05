import type { JSX } from 'preact';
import { useMessages } from '../i18n/index.ts';
import { Card } from '../ui/index.ts';
import { messages } from './messages.ts';
import { hrefFor } from './router.ts';

export function NotFound(): JSX.Element {
  const t = useMessages(messages);
  return (
    <div data-testid="not-found">
      <Card title={t('app.notFound.title')}>
        <p>{t('app.notFound.body')}</p>
        <p>
          <a href={hrefFor('/')}>{t('app.notFound.home')}</a>
        </p>
      </Card>
    </div>
  );
}
