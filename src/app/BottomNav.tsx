import type { JSX } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { activeLocale, translate, useMessages } from '../i18n/index.ts';
import styles from './BottomNav.module.css';
import { messages } from './messages.ts';
import { tabFeatures } from './registry.ts';
import { currentRoute, hrefFor } from './router.ts';
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
          // A tab links to its feature's first route. The registry has already checked that
          // the route takes no parameters, so the pattern is the path.
          const destination = feature.routes[0];
          if (!tab || !destination) return null;
          const Icon = tab.icon;
          return (
            <li key={feature.id} class={styles.item}>
              <a
                class={styles.link}
                href={hrefFor(destination.pattern)}
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
