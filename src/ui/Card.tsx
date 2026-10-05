import type { ComponentChildren, JSX } from 'preact';
import styles from './Card.module.css';

export interface CardProps {
  title?: string;
  /** Heading level, so cards never break the document outline. */
  headingLevel?: 2 | 3;
  children?: ComponentChildren;
}

export function Card({ title, headingLevel = 2, children }: CardProps): JSX.Element {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section class={styles.card}>
      {title ? <Heading class={styles.title}>{title}</Heading> : null}
      {children}
    </section>
  );
}
