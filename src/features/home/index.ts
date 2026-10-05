import { defineFeature } from '../../app/feature.ts';
import { HomeScreen } from './HomeScreen.tsx';
import { HomeIcon } from './icon.tsx';
import { messages } from './messages.ts';

export const feature = defineFeature({
  id: 'home',
  messages,
  routes: [
    {
      pattern: '/',
      // One route with five faces: the app knows the departure date, so the user never has
      // to find the right mode (IA section 3.1). The component writes whichever of these it
      // is actually showing into `data-screen`; today it only ever renders S10.
      screenIds: ['S10', 'S11', 'S12', 'S13', 'S14'],
      chrome: 'tabs',
      screen: HomeScreen,
    },
  ],
  tab: { order: 10, screenId: 'S10', labelKey: 'home.nav', icon: HomeIcon },
});
