import type { JSX } from 'preact';
import { useMessages } from '../i18n/index.ts';
import styles from './App.module.css';
import { AppHeader } from './AppHeader.tsx';
import { BottomNav } from './BottomNav.tsx';
import { messages } from './messages.ts';
import { NotFound } from './NotFound.tsx';
import { featureForPath } from './registry.ts';
import { currentPath } from './router.ts';
import { UpdatePrompt } from './UpdatePrompt.tsx';

export function App(): JSX.Element {
  const t = useMessages(messages);
  const feature = featureForPath(currentPath.value);
  const Screen = feature?.screen;

  return (
    <div class={styles.app}>
      {/* The router ignores hashes that are not routes, so this plain anchor is safe. */}
      <a class={styles.skip} href="#main">
        {t('app.skipToContent')}
      </a>
      <AppHeader />
      <main id="main" tabIndex={-1} class={styles.main}>
        <div class={styles.content}>{Screen ? <Screen /> : <NotFound />}</div>
      </main>
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}
