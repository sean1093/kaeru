import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Must match the GitHub Pages project path: https://sean1093.github.io/kaeru/ */
const BASE = '/kaeru/';

/**
 * Stamps the built document with the commit it came from.
 *
 * Five commits once reached `main` with a cancelled CI run, and because the Pages deploy is
 * gated on CI succeeding (ADR 0009), each one silently skipped its deploy: the live site was
 * behind `main` and every dashboard was green (#113). Workflow status could have been made to
 * report that, but it only ever answers one path to the failure — a run that was cancelled, a
 * run that never started, a workflow that failed to parse, a deploy that shipped a stale
 * artifact. The property we actually care about is *is the live site the current main*, and a
 * build that names itself lets the production smoke ask that directly.
 *
 * It matters more here than in most products: `kaeruRules` is effective-dated data compiled
 * into the bundle, so a stale deploy is not missing features, it is live refund figures
 * computed from superseded rules — with `lastReviewed` shipping in the same stale bundle, so
 * the stale date agrees with the stale rules and nothing on screen contradicts anything.
 */
function buildIdentity(): { name: string; transformIndexHtml: (html: string) => string } {
  const sha = process.env.GITHUB_SHA ?? 'dev';
  return {
    name: 'kaeru-build-identity',
    transformIndexHtml: (html) =>
      html.replace(
        '<meta name="build-sha" content="dev" />',
        `<meta name="build-sha" content="${sha}" />`,
      ),
  };
}

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
    buildIdentity(),
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
