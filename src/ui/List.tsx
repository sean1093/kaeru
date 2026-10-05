import type { ComponentChildren, JSX } from 'preact';
import type { ListRowProps } from './contracts.ts';
import { CheckIcon, ChevronRightIcon } from './icons.tsx';
import styles from './List.module.css';
import { StatusChip } from './StatusChip.tsx';

/**
 * The container for `ListRow`. A list is a real `<ul>`, so a screen reader announces
 * "list, 7 items" and the rows below are `<li>`s rather than a pile of links.
 */
export function List({
  label,
  children,
}: {
  /** Already translated. Names the list when the screen has more than one. */
  label?: string;
  children?: ComponentChildren;
}): JSX.Element {
  return (
    <ul class={styles.list} aria-label={label}>
      {children}
    </ul>
  );
}

/**
 * `components.md` section 5. The workhorse of the receipt list.
 *
 * The whole row is one `<a>` or one `<button>`, so it is announced as a single item
 * rather than as five fragments. A row with neither is a display row: not focusable, no
 * chevron, nothing to press.
 *
 * `amount` is rendered by `AmountDisplay` in M1-3c (#25); S20, the only screen that uses
 * it, depends on both issues.
 */
export function ListRow({
  href,
  onActivate,
  primary,
  secondary,
  status,
  selected,
  last = false,
}: ListRowProps): JSX.Element {
  const content = (
    <>
      {selected === true ? (
        <span class={styles.selectedMark}>
          <CheckIcon />
        </span>
      ) : null}
      <span class={styles.text}>
        <span class={styles.primary}>{primary}</span>
        {secondary !== undefined ? <span class={styles.secondary}>{secondary}</span> : null}
        {status ? (
          <span class={styles.status}>
            <StatusChip {...status} />
          </span>
        ) : null}
      </span>
      {href !== undefined || onActivate !== undefined ? (
        <span class={styles.chevron} aria-hidden="true">
          <ChevronRightIcon />
        </span>
      ) : null}
    </>
  );

  const rowClass = `${styles.row} ${last ? styles.last : ''} ${
    selected === true ? styles.selected : ''
  }`;

  return (
    <li class={rowClass}>
      {href !== undefined ? (
        <a class={styles.inner} href={href} aria-current={selected === true ? 'true' : undefined}>
          {content}
        </a>
      ) : onActivate !== undefined ? (
        <button
          type="button"
          class={styles.inner}
          onClick={onActivate}
          aria-pressed={selected === undefined ? undefined : selected}
        >
          {content}
        </button>
      ) : (
        <div class={styles.inner}>{content}</div>
      )}
    </li>
  );
}
