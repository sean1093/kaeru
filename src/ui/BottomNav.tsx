import type { JSX } from 'preact';
import styles from './BottomNav.module.css';
import type { BottomNavItem, BottomNavProps } from './contracts.ts';

/**
 * `components.md` section 2. Exactly four items, each the full tap target.
 *
 * A dot badge has no number and adds nothing to the accessible name — it is `aria-hidden`
 * decoration. A count badge is never announced as a bare number next to the label: the
 * caller folds it into `accessibleName` ("Receipts, 3 need action"), so this component
 * renders the pill visually and lets that string carry the link's name.
 */
function Badge({ badge }: { badge: NonNullable<BottomNavItem['badge']> }): JSX.Element {
  if (badge.kind === 'dot') {
    return <span class={styles.dot} aria-hidden="true" />;
  }
  return (
    <span class={styles.count} aria-hidden="true">
      {badge.value}
    </span>
  );
}

export function BottomNav({ label, items }: BottomNavProps): JSX.Element {
  return (
    <nav class={styles.nav} aria-label={label} data-testid="bottom-nav">
      <ul class={styles.list}>
        {items.map((item) => {
          const Icon = item.icon;
          const accessibleName = item.badge?.kind === 'count' ? item.badge.accessibleName : null;
          return (
            <li key={item.id} class={styles.item}>
              <a
                class={styles.link}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                aria-label={accessibleName ?? undefined}
                data-testid={`nav-${item.id}`}
              >
                <span class={styles.iconWrap}>
                  <Icon />
                  {item.badge ? <Badge badge={item.badge} /> : null}
                </span>
                <span class={styles.label}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
