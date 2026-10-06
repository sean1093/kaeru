import { defineFeature } from '../../app/feature.ts';
import { DataScreen } from './DataScreen.tsx';
import { messages } from './messages.ts';
import { SettingsScreen } from './SettingsScreen.tsx';

/**
 * Settings is reached from the Home app bar, not from a fifth tab (IA section 2): it is
 * visited a handful of times per trip, and four tabs is the maximum that keeps every target
 * at least 64 px wide with English labels un-truncated at 320 px. So no `tab` here.
 */
export const feature = defineFeature({
  id: 'settings',
  messages,
  routes: [
    {
      pattern: '/settings',
      screenIds: ['S60'],
      chrome: 'tabs',
      screen: SettingsScreen,
    },
    {
      pattern: '/settings/data',
      screenIds: ['S62'],
      chrome: 'tabs',
      screen: DataScreen,
    },
  ],
});
