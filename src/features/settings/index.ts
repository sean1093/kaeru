import { defineFeature } from '../../app/feature.ts';
import { SettingsIcon } from './icon.tsx';
import { messages } from './messages.ts';
import { SettingsScreen } from './SettingsScreen.tsx';

export const feature = defineFeature({
  id: 'settings',
  path: '/settings',
  messages,
  screen: SettingsScreen,
  nav: { order: 90, labelKey: 'settings.nav', icon: SettingsIcon },
});
