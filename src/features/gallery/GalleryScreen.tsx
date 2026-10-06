import type { JSX } from 'preact';
import { LanguageSwitcher } from '../../app/LanguageSwitcher.tsx';
import { useMessages } from '../../i18n/index.ts';
import { galleryCopy } from './copy.ts';
import styles from './Gallery.module.css';
import { CoreSection } from './sections/core.tsx';
import { FormsSection } from './sections/forms.tsx';
import { NavigationSection } from './sections/navigation.tsx';

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
 *
 * Carries its own `LanguageSwitcher` rather than inheriting the shell's: the gallery
 * registers `chrome: 'fullscreen'`, and #135/#139 settled that a fullscreen screen
 * carries its own app bar and controls rather than the shell's. A bilingual review
 * harness losing its own locale toggle is not incidental — reviewing both locales is the
 * whole job here, independent of whatever the shell does or does not render.
 */
export function GalleryScreen(): JSX.Element {
  const t = useMessages(galleryCopy);

  return (
    <div class={styles.gallery} data-gallery-root={GALLERY_MARKER}>
      <h1>{t('gallery.title')}</h1>
      <LanguageSwitcher />
      <p class={styles.intro}>{t('gallery.intro')}</p>
      <CoreSection />
      <NavigationSection />
      <FormsSection />
    </div>
  );
}
