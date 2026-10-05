import type { JSX } from 'preact';
import styles from './Card.module.css';
import type { CardContractProps } from './contracts.ts';

export type CardProps = CardContractProps;

/**
 * `components.md` section 4. Flat: a card is `--color-surface` on `--color-bg` with a
 * hairline border, never a shadow.
 *
 * A card with a single destination is the whole target — `href` makes it a link,
 * `onActivate` makes it a button. A card with more than one action is never itself
 * tappable, so passing both is a programming error rather than a layout choice.
 */
export function Card({
  title,
  headingLevel = 2,
  onActivate,
  href,
  children,
}: CardProps): JSX.Element {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const body = (
    <>
      {title ? <Heading class={styles.title}>{title}</Heading> : null}
      {children}
    </>
  );

  if (href !== undefined) {
    return (
      <a class={`${styles.card} ${styles.tappable}`} href={href}>
        {body}
      </a>
    );
  }

  if (onActivate !== undefined) {
    return (
      <button type="button" class={`${styles.card} ${styles.tappable}`} onClick={onActivate}>
        {body}
      </button>
    );
  }

  return <section class={styles.card}>{body}</section>;
}
