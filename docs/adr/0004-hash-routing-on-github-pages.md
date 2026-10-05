# 0004 — Hash routing under the `/kaeru/` base path

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4) |

## Context

The app is served from a GitHub Pages **project** site, so every asset lives under the base
path `/kaeru/`. GitHub Pages is a plain static file server:

- It has no rewrite rules. A request for `/kaeru/settings` returns **404** unless a file
  exists at that path.
- It serves a custom `404.html`, which is the usual workaround: ship a `404.html` that
  rewrites the URL into a query string, redirect to `index.html`, and restore the path with
  `history.replaceState`.

We also need deep links to survive **offline**: a traveller opens the app from the home
screen with no network, and the service worker has to be able to answer the navigation.

## Decision

Routing lives in the **URL hash**: `#/`, `#/settings`, and so on.

- `src/app/router.ts` is a ~40-line module: a `currentPath` signal, a `hashchange`
  listener, `navigate()` and `hrefFor()`.
- `routeFromHash()` normalises the hash: empty and `#` and `#/` are the home route, a query
  string is stripped, a trailing slash is removed.
- A hash that does **not** start with `/` is not a route and is ignored — in-page anchors
  such as the skip link's `#main` keep their native behaviour instead of fighting the router.
- Links are ordinary `<a href="#/settings">` elements, so middle-click, long-press and
  "open in new tab" work without JavaScript interception.
- Vite `base` is `/kaeru/` and the service worker scope matches it (ADR 0007).

## Consequences

- **Every URL resolves to the one `index.html`.** No 404 shim, no redirect dance, no
  flash of a wrong page, nothing to get wrong when the base path changes.
- **Offline deep links work by construction**, because the precached `index.html` answers
  every navigation; the hash never reaches the network or the service worker's router.
- **Moving to a custom domain is a one-line change** (`base: '/'`), and the routes keep
  working either way.
- URLs are slightly less pretty (`…/kaeru/#/settings`). Nobody shares a Kaeru URL — there
  are no shareable server-side resources — so the cost is cosmetic.
- No server-side rendering or static pre-rendering per route. We do not want either: the
  app is a personal data tool, not content to be indexed.
- Analytics tools that read `location.pathname` would see one page. We have no analytics
  (ADR 0002), so this is moot.
- Scroll restoration and in-page anchors need care, which is why `routeFromHash` returns
  `null` for non-route hashes. Covered by a unit test.

## Alternatives considered

- **History (path) routing with a `404.html` fallback.** Prettier URLs, but: a real 404
  round-trip on every deep link, a redirect that confuses the back button, an extra file
  that must stay in sync with the base path, and a worse offline story (the fallback is
  served by GitHub, not by us, when the SW is not yet in control). Rejected.
- **History routing with `navigateFallback` only.** Works once the service worker is
  installed, fails on the very first visit to a deep link — the worst possible time.
  Rejected.
- **A routing library (`preact-iso`, `wouter`).** Another dependency for 40 lines of code
  we fully control, and none of them handle the "hash that is not a route" case we need for
  the skip link. Rejected; revisit if we ever need nested routes or route-level code
  splitting.
