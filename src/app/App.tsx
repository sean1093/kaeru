import type { JSX } from 'preact';
import { useMessages } from '../i18n/index.ts';
import styles from './App.module.css';
import { AppHeader } from './AppHeader.tsx';
import { messages } from './messages.ts';
import { NotFound } from './NotFound.tsx';
import type { Chrome } from './navigation.ts';
import { currentRoute } from './router.ts';
import { ShellBannerSlot, ShellToastHost } from './ShellHosts.tsx';
import { ShellNav } from './ShellNav.tsx';
import { UpdatePrompt } from './UpdatePrompt.tsx';

/**
 * How much of the shell a screen keeps, from `ScreenRoute.chrome`.
 *
 * **The bottom navigation goes in `fullscreen` and `mode`; the app bar goes only in
 * `mode`.** That asymmetry is the IA's, not a convenience: section 2 says the *bar* hides
 * in Airport Mode and inside full-screen flows, and a full-screen flow is still a screen
 * with a heading and a way out. Airport Mode is the one that is a mode rather than a
 * screen (section 1) — the Stepper owns the whole viewport there.
 *
 * Why the navigation specifically. In a full-screen flow a tab bar is a one-tap exit from
 * a form the user is part-way through filling in. In Airport Mode it is worse: a one-tap
 * exit from a linear sequence, taken standing in a queue with luggage, at the one point
 * where leaving halfway cannot be undone — `DR-032` treats an abandoned procedure as no
 * customs confirmation, and nobody compensates that.
 *
 * Keeping the app bar in `fullscreen` also keeps the language control reachable, which
 * matters most in onboarding — the first full-screen flow a user meets, and the one where
 * being in the wrong language is hardest to escape.
 *
 * An unmatched route keeps both, so a mistyped URL still leaves the user somewhere they
 * can navigate out of.
 */
function chromeOf(chrome: Chrome | undefined): { nav: boolean; bar: boolean } {
  return {
    nav: chrome !== 'fullscreen' && chrome !== 'mode',
    bar: chrome !== 'mode',
  };
}

export function App(): JSX.Element {
  const t = useMessages(messages);
  const match = currentRoute.value;
  const Screen = match?.route.screen;
  const chrome = chromeOf(match?.route.chrome);

  return (
    <div class={styles.app} data-chrome={match?.route.chrome ?? 'tabs'}>
      {/* The router ignores hashes that are not routes, so this plain anchor is safe. */}
      <a class={styles.skip} href="#main">
        {t('app.skipToContent')}
      </a>
      {chrome.bar ? <AppHeader /> : null}
      {/*
        The banner sits above the content and below the bar, so it is read straight after
        the screen's title and cannot be scrolled past. It is shell state: it survives every
        navigation, including every Airport Mode step, and is cleared only through
        `ShellBanner.clear()`.
      */}
      <ShellBannerSlot />
      <main id="main" tabIndex={-1} class={styles.main}>
        <div class={styles.content}>
          {Screen && match ? <Screen params={match.params} /> : <NotFound />}
        </div>
      </main>
      {chrome.nav ? <ShellNav /> : null}
      <ShellToastHost />
      <UpdatePrompt />
    </div>
  );
}
