import { defineFeature } from '../../app/feature.ts';
import { galleryCopy } from './copy.ts';
import { GalleryScreen } from './GalleryScreen.tsx';

/**
 * The UI kit gallery, registered only in a development build.
 *
 * `import.meta.env.DEV` is replaced at build time, so Rollup drops this branch and with
 * it the screen, its sections and its sample copy: the gallery is not shipped to anyone.
 * A runtime check would not do that. The registry skips modules that export nothing
 * (`src/app/registry.ts`, `FeatureModule` in `src/app/navigation.ts`).
 *
 * No `nav` entry: the gallery is a tool, not a tab.
 */
export const feature = import.meta.env.DEV
  ? defineFeature({
      id: 'gallery',
      path: '/dev/gallery',
      messages: galleryCopy,
      screen: GalleryScreen,
    })
  : undefined;
