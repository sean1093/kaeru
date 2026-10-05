import type { JSX } from 'preact';
import styles from './BottomNav.module.css';
import type { BottomNavItem, BottomNavProps } from './contracts.ts';

/**
 * `components.md` section 2. Exactly four items, each the full tap target.
 *
 * A dot badge has no number and adds nothing to the accessible name — it is `aria-hidden`
 * decoration. A count badge is never announced as a bare number next to the label: this
 * component composes `item.label` with the badge's own `accessibleName` ("Receipts" + "3
 * need action" → "Receipts, 3 need action"), so the visible text is always a prefix of
 * the spoken name (WCAG 2.5.3, Label in Name) and a caller cannot get the word order or
 * the exact visible label wrong by supplying the whole string itself.
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
          const accessibleName =
            item.badge?.kind === 'count' ? `${item.label}, ${item.badge.accessibleName}` : null;
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
