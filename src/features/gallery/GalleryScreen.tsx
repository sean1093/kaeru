import type { JSX } from 'preact';
import { useMessages } from '../../i18n/index.ts';
import { galleryCopy } from './copy.ts';
import styles from './Gallery.module.css';
import { CoreSection } from './sections/core.tsx';

/**
 * A string that exists nowhere else in the app. The production-bundle test greps the
 * built assets for it: the gallery's module path survives in the registration glob's key
 * map, so the absence that matters is the absence of gallery *content*.
 */
export const GALLERY_MARKER = 'kaeru-ui-kit-gallery';

/**
 * The UI kit, rendered. Development builds only — `index.ts` registers the route behind
 * `import.meta.env.DEV`, so Rollup drops this module and everything it imports.
 *
 * It exists because a design review of a component library needs to look at the
 * components, and a review that happens after the slice merges is an archaeology report.
 */
export function GalleryScreen(): JSX.Element {
  const t = useMessages(galleryCopy);

  return (
    <div class={styles.gallery} data-screen="DEV-GALLERY" data-gallery-root={GALLERY_MARKER}>
      <h1>{t('gallery.title')}</h1>
      <p class={styles.intro}>{t('gallery.intro')}</p>
      <CoreSection />
    </div>
  );
}
