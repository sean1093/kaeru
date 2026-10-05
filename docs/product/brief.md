# Kaeru — Product Brief

| | |
|---|---|
| Status | v0.1 (kickoff) |
| Date | 2026-10-05 |
| Owner | PM / team lead |
| Tracking | Epic issue #1 |

*Kaeru* (かえる) means both "to come back" (返る — your tax comes back) and "to go home" (帰る — you get it on the way home).

## Problem

From **2026-11-01** Japan changes its tax-free shopping system for visitors. Instead of paying the tax-exclusive price at the shop, travelers now pay the full tax-inclusive price, and the consumption tax is refunded only after Japan Customs confirms at departure that the goods are leaving the country.

What this means for a traveler:

- **Higher cost up front.** The 10% (or 8% reduced-rate) consumption tax is paid first and comes back later.
- **Many refund operators.** About 12 companies process refunds; Taiwanese travelers mostly meet four of them (J&J Tax Free / J-TaxRefund, PIE VAT, Smart Detax / JPrefund, Global Blue). Each has its own website or app, registration steps, and refund method. Travelers worry about juggling all of them.
- **A strict departure procedure.** Customs confirmation happens at a kiosk *before* checking luggage. Customs may ask to see the goods, and a missing item can void the whole receipt. Travelers must leave Japan within 90 days of the purchase.
- **Tracking falls on the traveler.** Which operator handles which receipt, whether it was registered, where the goods are packed, and whether the money ever arrived — often for several family members with separate passports.

The travel expert's research (`docs/research/`) will verify, deepen, and cite these points.

## Target users

- **Primary:** travelers from Taiwan (Traditional Chinese), frequent Japan visitors, families who shop at drugstores, department stores, outlets, and electronics stores.
- **Secondary:** English-speaking travelers.
- **Context of use:** walking around with a phone in one hand and shopping bags in the other; tired evenings at the hotel; airports with weak connectivity and time pressure.

## Goals (MVP)

1. Never lose a refund to a procedural mistake: missed registration, goods checked in before customs, a passed deadline.
2. Show at a glance how much tax is waiting to come back, which receipts need action, and what to do at the airport.
3. Work offline, keep all data on the device, support Traditional Chinese and English with full parity, and be installable (PWA). Free, no account.

## Non-goals (MVP)

- Kaeru is not a refund operator. It does not submit anything to operators on the user's behalf and does not scrape their systems.
- No accounts, no server, no analytics or tracking.
- Not a general travel expense tracker.
- No storage of full passport numbers.

## Constraints

- Static site on GitHub Pages: <https://sean1093.github.io/kaeru/>.
- Mobile first: iOS Safari and Android Chrome; desktop works too.
- Bilingual UI with full parity: Traditional Chinese (Taiwan) and English. No hard-coded strings.
- Visual style: Japanese minimalism — calm, warm, generous whitespace.
- Accessibility: WCAG 2.2 AA.
- Facts about the tax system must be cited and dated. Rules may still change before or after 2026-11-01, so they live as data, not as scattered code.

## Initial scope hypothesis

To be validated or reshaped by research (expert) and design (UX):

- Trip setup: travelers, departure date and airport.
- Receipt log: shop, date, amounts, tax rate, refund operator, registration status, photo or QR link, which traveler, where the goods are packed.
- Home dashboard: refund waiting to come back, deadlines, action items.
- Airport mode: a step-by-step departure checklist that works offline.
- Refund tracking after returning home.
- Guide: how the new system works, operator directory, FAQ — in both languages.
- Data backup (export / import) and privacy controls.

## Success criteria for launch

- A traveler can set up a trip, log a receipt in under 20 seconds, see the pending refund total, and complete the airport checklist offline.
- All automated tests pass in CI.
- QA signs off on both languages on mobile viewports and on the live GitHub Pages site.

## Team

| Role | Responsibilities |
|---|---|
| PM / team lead | Scope, priorities, issues, coordination, final acceptance |
| Japan travel expert | Rules research, traveler pain points, solution flow, guide content |
| UX designer | Principles, visual language, information architecture, wireframes, UI review |
| Senior architect | ADRs, architecture, scaffold, CI/CD, code review, merges |
| Frontend engineers | Feature implementation through pull requests |
| Senior QA | Test strategy, automated tests, verification, release sign-off |

## Milestones

| Milestone | Outcome |
|---|---|
| M0 — Discovery & Design | Research, UX design, architecture decisions, test strategy merged |
| M1 — Foundation | Domain rules, storage, app shell, i18n, CI/CD |
| M2 — MVP Features | All MVP features merged with tests |
| M3 — Launch | Live on GitHub Pages, QA sign-off |
