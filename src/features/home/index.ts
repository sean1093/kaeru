import { defineFeature } from '../../app/feature.ts';
import { HomeScreen } from './HomeScreen.tsx';
import { HomeIcon } from './icon.tsx';
import { messages } from './messages.ts';

export const feature = defineFeature({
  id: 'home',
  path: '/',
  messages,
  screen: HomeScreen,
  nav: { order: 10, labelKey: 'home.nav', icon: HomeIcon },
});
