import type { JSX } from 'preact';
import styles from './BottomNav.module.css';
import type { BottomNavItem, BottomNavProps } from './contracts.ts';

/**
 * `components.md` section 2. Exactly four items, each the full tap target.
 *
 * A dot badge has no number and adds nothing to the accessible name — it is `aria-hidden`
 * decoration. A count badge is never announced as a bare number next to the label: this
 * component concatenates `item.label` with the badge's own `accessibleName` verbatim,
 * with no separator of its own ("Receipts" + ", 3 need action" → "Receipts, 3 need
 * action"). The kit owns no punctuation — `accessibleName` is the fragment *including*
 * its leading connector, already correct for whichever locale the caller is rendering,
 * same as every other string this kit takes. Because concatenation has no separator slot
 * for a caller to exploit, the visible label is structurally always a prefix of the
 * spoken name (WCAG 2.5.3, Label in Name) — not by convention, by construction.
 *
 * A count badge with `value <= 0` renders nothing, visible or spoken: a `0` pill is
 * indistinguishable from an honest zero count only by coincidence, and R21 requires
 * badges the traveler can trust. If the caller cannot compute a real count, it must not
 * pass a `count` badge at all rather than pass zero.
 */
function Badge({ badge }: { badge: NonNullable<BottomNavItem['badge']> }): JSX.Element | null {
  if (badge.kind === 'dot') {
    return <span class={styles.dot} aria-hidden="true" />;
  }
  if (badge.value <= 0) {
    return null;
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
          const badge = item.badge;
          const accessibleName =
            badge?.kind === 'count' && badge.value > 0
              ? `${item.label}${badge.accessibleName}`
              : null;
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
