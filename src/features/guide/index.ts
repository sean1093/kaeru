import { defineFeature } from '../../app/feature.ts';
import { ArticleScreen } from './ArticleScreen.tsx';
import { FaqScreen } from './FaqScreen.tsx';
import { GuideScreen } from './GuideScreen.tsx';
import { GuideIcon } from './icon.tsx';
import { messages } from './messages.ts';

export const feature = defineFeature({
  id: 'guide',
  messages,
  routes: [
    { pattern: '/guide', screenIds: ['S50'], chrome: 'tabs', screen: GuideScreen },
    {
      pattern: '/guide/articles/:articleId',
      screenIds: ['S51'],
      chrome: 'tabs',
      screen: ArticleScreen,
    },
    {
      // `:entryId?` is optional: the index links here bare, and the fee warning on S2B
      // links to one entry by id (`pathTo('S54', { entryId: 'q11' })`).
      pattern: '/guide/faq/:entryId?',
      screenIds: ['S54'],
      chrome: 'tabs',
      screen: FaqScreen,
    },
  ],
  tab: { order: 40, screenId: 'S50', labelKey: 'guide.nav', icon: GuideIcon },
});
