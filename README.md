# Kaeru

A friendly companion for Japan's new tax-free refund system (from 2026-11-01): log your receipts, see how much tax is coming back, and get through the airport customs check without losing a refund.

日本退稅新制（2026-11-01 起）的收據管家：記錄收據、掌握還有多少稅會退回來，在機場順利完成海關確認，不讓退稅白白飛走。

> Status: in development. The live site will be at <https://sean1093.github.io/kaeru/>.

- Works offline, keeps all data on your device, no account.
- Traditional Chinese and English.

## Development

Requires **Node 24** and npm 11.

```bash
npm ci
npm run dev        # Vite dev server (no service worker, see ADR 0007)
npm run check      # typecheck + lint + unit tests + build
```

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` (base path `/kaeru/`) |
| `npm run preview` | Serve the production build at <http://localhost:4173/kaeru/> |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Biome check (lint + format verification) |
| `npm run format` | Biome check with `--write` |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with v8 coverage and thresholds |
| `npm run e2e` | Playwright on iPhone WebKit, Pixel Chromium, desktop Chromium |
| `npm run e2e:ui` | Playwright UI mode |
| `npm run check` | Everything: typecheck, lint, unit tests, build |

End-to-end tests run against the production build (Playwright starts `build` + `preview`
itself), because the service worker and the `/kaeru/` base path are part of what is tested.
First run needs browsers: `npx playwright install --with-deps`.

### Structure

```
src/
  domain/        pure rules and calculations — no DOM, no storage, injected clock
  i18n/          locales, typed message bundles, Intl formatting
  data/          IndexedDB repositories, versioned migrations, backup export/import
  ui/            shared components built on the design tokens
  features/      one folder per feature; it registers itself, no shared file to edit
  app/           shell, hash router, feature registry, app-level state
  styles/        tokens.css (design system) and base.css
e2e/             Playwright specs
docs/            product, research, design, architecture, ADRs, QA
```

Adding a feature means adding `src/features/<name>/index.ts` exporting a `feature`
descriptor — the router and the bottom navigation pick it up automatically. All
user-facing text goes through `src/features/<name>/messages.ts`; a parity test fails if
zh-TW and English drift apart.

Start with [`docs/architecture/overview.md`](docs/architecture/overview.md) and the
[ADRs](docs/adr/).

## Documentation

Product, research, design, architecture, and QA documents live in [`docs/`](docs/README.md).

## License

[MIT](LICENSE)
