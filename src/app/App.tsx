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
 * **Both the navigation and the shell's app bar belong to `tabs` chrome only.** A screen
 * outside it carries its own bar with its own controls, which is what the wireframes draw:
 * S01 has no bar at all, S02 and S05 have a minimal local one, and S21 is optimised for
 * twenty seconds and does not want the detour.
 *
 * I had `fullscreen` keeping the shell bar, for a reason that was right and an inference
 * that was not: onboarding needs a way to change language before the user ever reaches a
 * tabs screen, and the shell bar was the only thing carrying that control. UXDesigner's
 * ruling is the narrower fix — the control belongs in onboarding's **own** app bar action
 * slot (#139), not in a shell bar on every full-screen flow.
 *
 * Why the navigation specifically must go. In a full-screen flow a tab bar is a one-tap
 * exit from a form the user is part-way through filling in. In Airport Mode it is worse: a
 * one-tap exit from a linear sequence, taken standing in a queue with luggage, at the one
 * point where leaving halfway cannot be undone — `DR-032` treats an abandoned procedure as
 * no customs confirmation, and nobody compensates that.
 *
 * An unmatched route keeps both, so a mistyped URL still leaves the user somewhere they
 * can navigate out of.
 */
function chromeOf(chrome: Chrome | undefined): { nav: boolean; bar: boolean } {
  const tabs = chrome === undefined || chrome === 'tabs';
  return { nav: tabs, bar: tabs };
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
