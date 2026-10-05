# 0002 — Static, local-first PWA on GitHub Pages

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4) |

## Context

Kaeru helps travellers track tax-free receipts: shop names, amounts, passport-linked
traveller records, receipt photos. The product brief sets hard constraints: no accounts,
no server, no analytics, no storage of full passport numbers, works offline, free.

The decisive context is *where* the app is used. The critical moment is the departure
checklist: landside at Narita or Kansai, in a queue, often with roaming disabled or a
saturated airport network, minutes before bag drop. An app that needs a network call there
costs the user real money. The travel expert's rules confirm this (`docs/product/domain-rules.md`,
Airport Mode must work with no network on the critical path).

## Decision

Kaeru is a **static, local-first Progressive Web App** deployed to GitHub Pages at
`https://sean1093.github.io/kaeru/`.

- No backend of any kind. The build output is HTML, CSS, JS and static assets.
- All user data stays in browser storage on the device (ADR 0005). Nothing is uploaded.
- No analytics, no error reporting service, no third-party fonts, no CDN. The only origin
  the app talks to is its own. This is asserted by an end-to-end test.
- Offline is the default assumption, not a degraded mode (ADR 0007).
- The user owns their data: JSON export and import are a first-class feature, not a
  developer escape hatch.

## Consequences

- **Privacy is structural, not promised.** There is no server that could leak data and no
  log that could record it. The non-goal "no storage of full passport numbers" is enforced
  in the data model rather than in a policy document.
- **No cross-device sync, no account recovery.** If the user loses the device or clears
  site data, the data is gone. This is mitigated by export/import and by prompting the user
  to export, and must be stated plainly in the UI — not hidden.
- **iOS Safari storage eviction is a real risk** (7-day eviction of unused origins). We
  request persistent storage and lean on the export reminder; we cannot fully solve it.
- **Everything the app knows must ship with the build.** Tax rules, operator catalogue and
  guide content are versioned data in the bundle (ADR 0005 and the overview's extension
  points), so a rule change is a deploy, not a database update.
- Hosting costs nothing and has no operational burden, which suits a free product.

## Alternatives considered

- **Thin backend for sync and backup.** Would solve device loss and multi-device families,
  but introduces accounts, a privacy surface, a cost, an operational burden, and a
  dependency at exactly the moment the app matters most (airport, poor network). Rejected.
- **Native apps.** Better camera and storage guarantees on iOS, but two codebases, store
  review latency for a rule change that may land days before travellers need it, and a
  much higher barrier to "a friend sent me a link". Rejected for MVP.
- **Static site with a serverless function for refund-operator lookups.** No operator
  offers a usable public API, and the brief explicitly forbids scraping operators.
  Nothing to call. Rejected.
