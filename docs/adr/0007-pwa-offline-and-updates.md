# 0007 — PWA: service worker strategy, update flow and scope

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4) |

## Context

Offline is not a nice-to-have. The travel expert's rules are explicit: Airport Mode is used
landside, in a queue, possibly with roaming off, and an app that fails there costs the user
money. The departure checklist, the receipt list and the guide must all work with the radio
off, on a cold start, from a home-screen icon.

Two risks pull in opposite directions (QA risk register R05 and R06):

- **R05** — the app is unavailable offline. Argues for aggressive precaching.
- **R06** — a stale build keeps serving an *old tax rule* after we fix it. Argues for
  updating eagerly.

Both are scored 15. The design has to satisfy both.

## Decision

### Precache everything, through `vite-plugin-pwa` (Workbox `generateSW`)

- All build output (`js`, `css`, `html`, `svg`, `png`, `webmanifest`, `woff2`) is precached
  with revision hashes. The app is small enough (~72 KB precached today) that partial
  caching would buy nothing and risk a missing chunk at the worst moment.
- `navigateFallback` is `/kaeru/index.html`. With hash routing (ADR 0004) every navigation
  is that one document anyway; the fallback covers a cold start from a home-screen icon.
- `cleanupOutdatedCaches: true`, so an old precache does not sit there eating quota that
  receipt photos need.
- There are **no runtime caching rules**, because there are no runtime network requests.
  The app never calls a third party (ADR 0002). If that is ever violated, this file is the
  place it becomes visible.

### Scope is `/kaeru/`

`scope` and `base` are both `/kaeru/`, matching the GitHub Pages project path. The worker
cannot and must not control anything else on `sean1093.github.io`.

### Updates are offered, never forced

`registerType: 'prompt'` with `clientsClaim: false`:

1. A new build is detected in the background and installed as the waiting worker.
2. `needRefresh` becomes true and the shell renders a translated banner: "A new version is
   available" with **Update now** and **Later**.
3. **Update now** calls `skipWaiting` and reloads into the new build.
4. **Later** dismisses the banner. The update still applies on the next natural cold start.

The reason for not auto-reloading is the same reason the product exists: a traveller may be
halfway through logging a receipt in a shop, or stepping through the airport checklist.
Reloading the page under them is unacceptable. The flip side — R06, a user sitting on a
stale build with an outdated tax rule — is handled by making the banner persistent and
prominent rather than by seizing control.

`injectRegister: null`: registration happens explicitly in `src/main.tsx`. The rest of the
app only touches `src/app/update-state.ts`, a plain module with two signals, so component
tests never import the `virtual:pwa-register` build-time module.

### Manifest and install

`name`, `short_name` Kaeru, `start_url` and `scope` `/kaeru/`, `display: standalone`,
`lang: zh-Hant-TW`, theme colour from the design tokens, and icons at 192, 512 and a
512 maskable, plus an SVG. The mark is a rounded square with an upward arrow — the tax
coming back. `viewport-fit=cover` plus the `--safe-bottom` token keep the bottom navigation
clear of the iOS home indicator.

### Dev mode

The service worker is **disabled in `npm run dev`** (`devOptions.enabled: false`). A caching
worker during development produces the most confusing class of bug there is. End-to-end
tests therefore run against `npm run build && npm run preview`, where the worker is real —
agreed with QA.

## Consequences

- Full offline capability, including a cold start from the home screen.
- A user can stay on an old build until they accept the update or close the app. The banner
  makes that a conscious choice; QA tests the update flow explicitly (R06).
- Precaching everything means every deploy re-downloads the changed hashed assets. At this
  size that is tens of kilobytes.
- Receipt photo blobs live in IndexedDB, not the cache storage, so they are unaffected by
  cache cleanup — but they share the same origin quota (ADR 0005).
- Because the worker does not claim existing clients, the first visit is uncontrolled; the
  offline E2E test reloads once after `serviceWorker.ready` before going offline. That is
  the real user sequence too.

## Alternatives considered

- **`registerType: 'autoUpdate'`.** One less interaction and no stale-build risk, at the
  price of reloading the page under a user who is mid-task at an airport. Rejected; the
  product's whole premise is not losing a refund to an interruption.
- **A hand-written service worker.** Full control and zero build-time dependency, but we
  would reimplement precache manifests, revision hashing and cleanup — exactly the code
  that is boring to write and expensive to get subtly wrong. Workbox is build-time only;
  the runtime cost is ~2.3 KB gzip for the update client.
- **No service worker, rely on HTTP caching.** Fails the cold-start-offline requirement
  outright. Rejected.
- **Network-first with a cache fallback.** Pointless when there is no network API to be
  fresh against, and it adds a timeout before every navigation on a bad airport connection.
  Rejected.
