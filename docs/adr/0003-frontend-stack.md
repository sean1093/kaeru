# 0003 — Frontend stack: Vite, TypeScript strict, Preact, Biome

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4), tooling agreed with QA (issue #5) |

## Context

Constraints that actually decide this:

- **Small runtime.** The app is loaded on a phone, sometimes on airport Wi-Fi, and
  precached for offline use. Budget: **initial JS ≤ 100 KB gzip**, and we would like to be
  far under it so that feature code has room to grow.
- **Strict typing.** Money, dates and deadlines are the product. The type system is the
  cheapest place to catch a mistake that would otherwise cost a traveller a refund.
- **Team familiarity.** Frontend engineers join in M2 and must be productive immediately.
  React-shaped components and hooks are the common denominator.
- **Testability.** QA requires component tests with Testing Library and a jsdom environment.
- **Few dependencies.** Every dependency is a supply-chain risk and a byte cost in a bundle
  that must work offline.

## Decision

| Concern | Choice |
|---|---|
| Build tool | **Vite 8** (`base: '/kaeru/'`) |
| Language | **TypeScript** with `strict`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`, `erasableSyntaxOnly` |
| UI library | **Preact 11** with `@preact/preset-vite` and `jsxImportSource: preact` |
| State | **`@preact/signals`** for the little cross-screen state we have (active locale, route, settings, SW update) |
| Styling | Plain **CSS Modules** over the design tokens in `src/styles/tokens.css`. No CSS framework, no CSS-in-JS |
| Routing | Hand-written hash router, ~40 lines (ADR 0004) |
| Storage | `idb` (ADR 0005) |
| Lint and format | **Biome** — one tool, one config, formatter and linter together |
| Tests | Vitest + `@testing-library/preact`, Playwright (ADR 0008) |

Measured result of the M0 scaffold: **17.9 KB gzip** of application JS plus 2.3 KB gzip of
the Workbox update client, and 2.7 KB gzip of CSS. That is roughly a fifth of the budget
with the shell, i18n, storage layer, router and two screens in place.

### Why Preact

React's component model and hooks are what engineers already know, and Preact gives that
in ~4 KB gzip against React 19's ~45 KB. Signals give fine-grained reactivity without a
state-management library — switching the language re-renders every subscribed component
with no provider tree and no context plumbing. `@testing-library/preact` is the same API
the team already uses.

### Why not the others

- **React.** ~40 KB gzip more for an identical developer experience in our case. In a 100 KB
  budget that is 40% of it spent on the framework. Rejected on size alone.
- **Svelte.** Smallest runtime and a pleasant language, but it *is* another language — `.svelte`
  files, its own reactivity rules, its own testing story. For a team that is strongest in
  React, the onboarding cost is not repaid by the few KB we would save over Preact.
- **Lit / web components.** Excellent for design systems shared across frameworks; we have
  one app and no such need. Form handling, testing ergonomics and SSR-free hydration are
  all more awkward, and shadow DOM complicates the global design-token and focus story.
- **Vanilla TS.** Smallest possible bundle, but we would hand-roll rendering, diffing, list
  keys and focus management — a worse framework with no documentation and no hiring pool.
  "Boring" means a boring well-known framework, not no framework.

### Why Biome over ESLint + Prettier

One binary, one config file, no plugin-resolution archaeology, and it formats and lints
CSS and JSON as well as TS/TSX. It runs the whole repository in about 20 ms, which means
`npm run lint` is genuinely cheap in CI and locally. The rule set we need (correctness,
a11y, suspicious, style) is covered; the a11y rules already caught two real issues in the
scaffold (an unlabelled control group, an anchor used as a button). ESLint has a larger
plugin ecosystem, and we will revisit if we ever need a rule Biome cannot express.

## Consequences

- Large React-only libraries are off the table. `preact/compat` exists as an escape hatch
  but adds weight; using it requires a new ADR.
- CSS Modules mean no utility classes; shared visual decisions live in tokens and in
  `src/ui`. This is deliberate — the UX designer owns the token values.
- `erasableSyntaxOnly` forbids TypeScript parameter properties and enums; we write plain
  field assignments and union types instead. Slightly more verbose, fully portable.
- Signals are a Preact-specific idiom. Engineers coming from React need one short briefing:
  read `.value` in render to subscribe.
- The typing level is uncompromising on purpose. `noUncheckedIndexedAccess` makes array and
  record access return `T | undefined`, which is exactly the kind of nag that prevents a
  wrong refund total.
