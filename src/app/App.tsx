import type { JSX } from 'preact';
import { useMessages } from '../i18n/index.ts';
import styles from './App.module.css';
import { AppHeader } from './AppHeader.tsx';
import { BottomNav } from './BottomNav.tsx';
import { messages } from './messages.ts';
import { NotFound } from './NotFound.tsx';
import { currentRoute } from './router.ts';
import { UpdatePrompt } from './UpdatePrompt.tsx';

export function App(): JSX.Element {
  const t = useMessages(messages);
  const match = currentRoute.value;
  const Screen = match?.route.screen;

  return (
    <div class={styles.app}>
      {/* The router ignores hashes that are not routes, so this plain anchor is safe. */}
      <a class={styles.skip} href="#main">
        {t('app.skipToContent')}
      </a>
      <AppHeader />
      <main id="main" tabIndex={-1} class={styles.main}>
        <div class={styles.content}>
          {Screen && match ? <Screen params={match.params} /> : <NotFound />}
        </div>
      </main>
      {/*
        Chrome still comes from M0 here: every registered route is `tabs` today, so the bar
        is unconditional. `ScreenRoute.chrome` is already carried on the match, and M1-5b
        switches on it to hide the bar for `fullscreen` and `mode` without any feature
        changing.
      */}
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}
