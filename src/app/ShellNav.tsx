import type { JSX } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { activeLocale, translate, useMessages } from '../i18n/index.ts';
import { BottomNav, type BottomNavItem } from '../ui/index.ts';
import { messages } from './messages.ts';
import { tabFeatures } from './registry.ts';
import { currentRoute, hrefFor } from './router.ts';
import styles from './ShellNav.module.css';
import { SCREEN_LOCATIONS } from './screens.ts';
import { observeShellMetrics } from './shell-metrics.ts';

/**
 * The bottom navigation, assembled from whatever features registered a tab.
 *
 * The IA specifies four — Home, Receipts, Airport, Guide — and this renders exactly the
 * tabs that exist, in declared order. It does not hard-code four, because a tab arrives
 * with the feature that owns it: that is the whole point of registration v2, and a shell
 * that listed the four would have to be edited by each M2 track in turn, which is the
 * shared file the registry exists to remove.
 */

/** Widened lookup: the id comes from a feature, not from a literal written here. */
const LOCATION_BY_SCREEN: Readonly<Record<string, { pattern: string } | undefined>> =
  SCREEN_LOCATIONS;

export function ShellNav(): JSX.Element | null {
  const t = useMessages(messages);
  const locale = activeLocale.value;
  const active = currentRoute.value;
  const nav = useRef<HTMLDivElement>(null);

  // Publishes the bar's measured height so content can reserve it. Layout effect, not
  // effect: the reservation must exist before paint, or the first frame puts the last
  // control under the bar.
  useLayoutEffect(() => (nav.current ? observeShellMetrics(nav.current) : undefined), []);

  const items: BottomNavItem[] = [];
  for (const feature of tabFeatures) {
    const tab = feature.tab;
    if (!tab) continue;
    const destination = LOCATION_BY_SCREEN[tab.screenId];
    // The registry has already proved this resolves and takes no parameters.
    if (!destination) continue;
    // A badge selector runs inside the shell's render, reading feature state the shell
    // knows nothing about. If it throws — a repository not open yet, a trip not loaded —
    // an unguarded call takes the whole navigation down with it, which is a far worse
    // outcome than a missing count: the user loses every tab, not one number.
    let badge: ReturnType<NonNullable<typeof tab.badge>>;
    try {
      badge = tab.badge?.();
    } catch {
      // Deliberately `undefined`, never zero: "we could not count" is not "nothing to do".
      badge = undefined;
    }
    items.push({
      id: feature.id,
      href: hrefFor(destination.pattern),
      label: translate(feature.messages, locale, tab.labelKey),
      icon: tab.icon,
      active: active?.pattern === destination.pattern,
      ...(badge ? { badge } : {}),
    });
  }

  if (items.length === 0) return null;

  return (
    <div ref={nav} class={styles.nav}>
      <BottomNav label={t('app.navLabel')} items={items} />
    </div>
  );
}
