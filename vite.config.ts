import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Must match the GitHub Pages project path: https://sean1093.github.io/kaeru/ */
const BASE = '/kaeru/';

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  plugins: [
    preact(),
    VitePWA({
      // The app decides when to activate a new version (see src/app/updates.ts).
      registerType: 'prompt',
      injectRegister: null,
      scope: BASE,
      base: BASE,
      includeAssets: ['favicon.svg', 'icons/icon.svg'],
      manifest: {
        id: BASE,
        name: 'Kaeru — Japan tax refund companion',
        short_name: 'Kaeru',
        description:
          'Track your Japan tax-free receipts offline and get through customs without losing a refund.',
        lang: 'zh-Hant-TW',
        dir: 'ltr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf8f5',
        theme_color: '#1f1b16',
        categories: ['travel', 'finance', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        // Hash routing means every navigation resolves to the app shell.
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: false,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
