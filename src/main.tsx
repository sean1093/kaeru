import { registerSW } from 'virtual:pwa-register';
import { render } from 'preact';
import { App } from './app/App.tsx';
import { startRouter } from './app/router.ts';
import { initSettings } from './app/settings-store.ts';
import { needRefresh, offlineReady, setUpdater } from './app/update-state.ts';
import './styles/base.css';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app root element');

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
