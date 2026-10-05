# Kaeru Documentation

Index of everything the team plans and decides. New here? Read the product brief, then the user journey, then the information architecture.

## Product

| Document | Owner | What it answers |
|---|---|---|
| [Product brief](product/brief.md) | PM | Problem, users, goals, constraints, team, milestones |
| [User journey](product/user-journey.md) | Japan travel expert | Personas, six journey stages, the airport sequence, what Kaeru does at each step (`UJ-0nn`) |
| [Domain rules](product/domain-rules.md) | Japan travel expert | Engineer-facing rules with IDs (`DR-0nn`), uncertain rules (`UR-nn`), operator catalog, privacy constraints |

## Research

| Document | What it answers |
|---|---|
| [Tax-free system 2026](research/tax-free-system-2026.md) | How the refund method works, cited and dated (sources `S1`–`S25`) |
| [Traveler pain points](research/traveler-pain-points.md) | What goes wrong for travelers (`PP-01`–`PP-20`), ranked |

## Content

| Document | What it answers |
|---|---|
| [Guide (繁體中文)](content/guide.zh-TW.md) | In-app guide copy: the new system in 5 steps, airport checklist, FAQ, operator directory |
| [Guide (English)](content/guide.en.md) | Same structure and keys as the Chinese guide |
| [Operators](content/operators.md) | The ten refund operators as maintainable data with observation dates |

## Design

| Document | What it answers |
|---|---|
| [Principles](design/principles.md) | Seven design principles for a tired traveler using one hand |
| [Visual language](design/visual-language.md) | Japanese-minimal palette, type, spacing, motion, and the design tokens |
| [Information architecture](design/information-architecture.md) | Screen inventory (`S01`–`S63`), navigation, flows A–I, journey coverage |
| [Wireframes](design/wireframes.md) | Every MVP screen and state, with Chinese and English microcopy |
| [Components](design/components.md) | Component specs, states, and the accessibility checklist |

## Architecture

| Document | What it answers |
|---|---|
| [Overview](architecture/overview.md) | Modules, dependency rules, feature auto-registration, data flow, conventions, budgets |
| [ADR 0001](adr/0001-record-architecture-decisions.md) | How decisions are recorded |
| [ADR 0002](adr/0002-static-local-first-pwa.md) | Static, local-first PWA on GitHub Pages |
| [ADR 0003](adr/0003-frontend-stack.md) | Preact, Vite, TypeScript strict, Biome |
| [ADR 0004](adr/0004-hash-routing-on-github-pages.md) | Hash routing under `/kaeru/` |
| [ADR 0005](adr/0005-local-storage-and-schema-migrations.md) | IndexedDB, append-only migrations, versioned backups |
| [ADR 0006](adr/0006-i18n.md) | Per-feature typed message bundles, locale parity |
| [ADR 0007](adr/0007-pwa-offline-and-updates.md) | Service worker, offline, update prompt |
| [ADR 0008](adr/0008-testing-and-ci.md) | Vitest, Playwright on three device projects, axe, coverage gates |
| [ADR 0009](adr/0009-deployment.md) | GitHub Pages deployment gated on green CI |

## Quality

| Document | What it answers |
|---|---|
| [Test strategy](qa/test-strategy.md) | Risk register, test levels and tools, gates, bug workflow, release checklist |
| [Test cases](qa/test-cases.md) | Test cases with IDs (`TC-…`) traced to rules and journey steps |

## Process

- [Team workflow](process/team-workflow.md) — issues, branches, pull requests, reviews, Definition of Done

## Project log

| Date | Event |
|---|---|
| 2026-10-05 | Kickoff. Product brief and team workflow written; M0 issues #2–#5 opened. |
| 2026-10-05 | QA strategy, 196 test cases, issue and PR templates merged (#6). |
| 2026-10-05 | Research, pain points, user journey, domain rules, bilingual guide copy merged (#7). |
| 2026-10-05 | Architecture scaffold, ADRs 0001–0009, CI and GitHub Pages deployment merged (#8); the app shell is live at <https://sean1093.github.io/kaeru/>. |
| 2026-10-05 | UX principles, visual language, IA, wireframes, components merged (#9). |
| 2026-10-05 | Brief aligned on refund-operator count (#10); CI on `main` can no longer be cancelled (#11). |
| 2026-10-05 | **M0 — Discovery & Design complete.** PM decisions on open IA questions: photos in export stay opt-in with a size estimate; archived trips are included in export; `fee.warnBelowJpy = 2000` held as rules data; contrast ratios asserted by an automated test. |
