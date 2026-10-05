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
 * `screenIds: []`: the gallery renders no id from the published 46-id inventory in
 * `screens.ts` — it is a development harness, not a product screen, and does not belong
 * in the table QA traces coverage against. `registry.ts` exempts `/dev/`-prefixed
 * patterns from the inventory check for exactly this reason.
 *
 * No `tab` entry: the gallery is a tool, not a tab.
 */
export const feature = import.meta.env.DEV
  ? defineFeature({
      id: 'gallery',
      messages: galleryCopy,
      routes: [
        {
          pattern: '/dev/gallery',
          screenIds: [],
          chrome: 'fullscreen',
          screen: GalleryScreen,
        },
      ],
    })
  : undefined;
