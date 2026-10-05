import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { activeLocale, translate, useMessages } from '../i18n/index.ts';
import styles from './BottomNav.module.css';
import { messages } from './messages.ts';
import { navigationFeatures } from './registry.ts';
import { currentPath, hrefFor } from './router.ts';
import { observeShellMetrics } from './shell-metrics.ts';

export function BottomNav(): JSX.Element {
  const t = useMessages(messages);
  const locale = activeLocale.value;
  const path = currentPath.value;
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = navRef.current;
    return element ? observeShellMetrics(element) : undefined;
  }, []);

  return (
    <nav ref={navRef} class={styles.nav} aria-label={t('app.navLabel')} data-testid="bottom-nav">
      <ul class={styles.list}>
        {navigationFeatures.map((feature) => {
          const nav = feature.nav;
          if (!nav) return null;
          const active = feature.path === path;
          const Icon = nav.icon;
          return (
            <li key={feature.id} class={styles.item}>
              <a
                class={styles.link}
                href={hrefFor(feature.path)}
                aria-current={active ? 'page' : undefined}
                data-testid={`nav-${feature.id}`}
              >
                <Icon />
                <span class={styles.label}>
                  {translate(feature.messages, locale, nav.labelKey)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
