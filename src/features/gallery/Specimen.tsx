import type { ComponentChildren, JSX } from 'preact';
import styles from './Gallery.module.css';

/**
 * One component in one documented state, with a stable `data-gallery` id so the capture
 * matrix in M1-3e can photograph it on its own.
 */
export function Specimen({
  id,
  state,
  note,
  children,
}: {
  id: string;
  /** The prop values that produce this state, verbatim. Not copy; never translated. */
  state: string;
  /** Rare: a condition the reviewer cannot see, such as "keyboard focus forced". */
  note?: string;
  children?: ComponentChildren;
}): JSX.Element {
  return (
    <div class={styles.specimen} data-gallery={id}>
      <code class={styles.state}>{state}</code>
      {note ? <code class={styles.note}>{note}</code> : null}
      {/* `data-gallery-stage` is a structural hook for the capture matrix's overlap
          check (M1-3e, #27) — explicit rather than matching the hashed CSS-module class
          by substring, which only works because the module name happens to survive
          into Vite's generated class name today. */}
      <div class={styles.stage} data-gallery-stage>
        {children}
      </div>
    </div>
  );
}

export function GallerySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children?: ComponentChildren;
}): JSX.Element {
  return (
    <section class={styles.section} data-gallery-section={id}>
      <h2 class={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}
