import type { JSX } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { activeLocale, translate, useMessages } from '../i18n/index.ts';
import styles from './BottomNav.module.css';
import { messages } from './messages.ts';
import { tabFeatures } from './registry.ts';
import { currentRoute, hrefFor } from './router.ts';
import { SCREEN_LOCATIONS } from './screens.ts';

/**
 * Widened for a lookup keyed by an id the feature supplied rather than one written here.
 * `pathTo` would be the better call, but its per-screen typing needs a literal id, and the
 * registry has already proved this one resolves to a parameterless route.
 */
const LOCATION_BY_SCREEN: Readonly<Record<string, { pattern: string } | undefined>> =
  SCREEN_LOCATIONS;

import { observeShellMetrics } from './shell-metrics.ts';

/**
 * The bottom bar, built from whatever features registered a tab.
 *
 * Still the M0 chrome: no badges, and always visible. M1-5b replaces it with the four-tab
 * bar that reads `ScreenRoute.chrome` to hide itself for `fullscreen` and `mode`, and
 * renders `TabRegistration.badge`. Nothing a feature declares has to change when it does —
 * that is the point of registering through the v2 contract first.
 */
export function BottomNav(): JSX.Element {
  const t = useMessages(messages);
  const locale = activeLocale.value;
  const active = currentRoute.value;
  const nav = useRef<HTMLElement>(null);

  useLayoutEffect(() => (nav.current ? observeShellMetrics(nav.current) : undefined), []);

  return (
    <nav ref={nav} class={styles.nav} aria-label={t('app.navLabel')} data-testid="bottom-nav">
      <ul class={styles.list}>
        {tabFeatures.map((feature) => {
          const tab = feature.tab;
          if (!tab) return null;
          // The tab names the screen it opens; the registry has already checked that the
          // screen exists and that its route takes no parameters.
          const destination = LOCATION_BY_SCREEN[tab.screenId];
          if (!destination) return null;
          const href = hrefFor(destination.pattern);
          const Icon = tab.icon;
          return (
            <li key={feature.id} class={styles.item}>
              <a
                class={styles.link}
                href={href}
                aria-current={active?.pattern === destination.pattern ? 'page' : undefined}
                data-testid={`nav-${feature.id}`}
              >
                <Icon />
                <span class={styles.label}>
                  {translate(feature.messages, locale, tab.labelKey)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
