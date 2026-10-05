import { registerSW } from 'virtual:pwa-register';
import { render } from 'preact';
import { App } from './app/App.tsx';
import { routes } from './app/registry.ts';
import { registerRoutes, startRouter } from './app/router.ts';
import { initSettings } from './app/settings-store.ts';
import { needRefresh, offlineReady, setUpdater } from './app/update-state.ts';
import './styles/base.css';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app root element');

// Importing the registry is what validates it: a duplicate route, a screen id claimed
// twice or a tab order collision throws here, at boot, rather than rendering the wrong
// screen later.
registerRoutes(routes);
startRouter();
render(<App />, root);

// Settings load asynchronously; the shell already renders in the detected language.
void initSettings();

setUpdater(
  registerSW({
    onNeedRefresh() {
      needRefresh.value = true;
    },
    onOfflineReady() {
      offlineReady.value = true;
    },
  }),
);
