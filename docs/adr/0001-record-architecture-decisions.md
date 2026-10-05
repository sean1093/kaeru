# 0001 — Record architecture decisions

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4) |

## Context

Kaeru is built by several people working in parallel, each in their own worktree, mostly
through pull requests they do not all review. Decisions made in chat are invisible to the
person who joins in M2 and to the person who has to change a rule after launch. The
project also has an unusual property: the rules it encodes (Japan's tax-free system) are
expected to change *after* release, so future contributors will need to know not only what
we chose but what we knew and assumed when we chose it.

`docs/process/team-workflow.md` already says significant technical decisions live in
`docs/adr/`. This ADR fixes the format.

## Decision

- Every significant architectural decision is recorded as a Markdown file in `docs/adr/`
  named `NNNN-kebab-title.md`, numbered sequentially and never renumbered.
- Each record has the sections: **Status**, **Context**, **Decision**, **Consequences**,
  **Alternatives considered**.
- Status is one of `Proposed`, `Accepted`, `Superseded by NNNN`. A superseded record is
  kept and edited only to add the status line; the history stays readable.
- "Significant" means: it is hard to reverse, it constrains other people's work, or a
  future reader would otherwise ask "why on earth is it like this".
- ADRs are written in English, like all project documentation, and are reviewed in the
  pull request that introduces them.

## Consequences

- A new contributor can read nine short files and understand the shape of the system.
- Changing a decision means writing a new ADR, which is deliberately slightly expensive.
- ADRs describe decisions, not the current state of the code: `docs/architecture/overview.md`
  is the living description and is updated as the code changes.

## Alternatives considered

- **A single `ARCHITECTURE.md`.** Easier to skim, but it loses the *why* and turns every
  change into a merge conflict on one file — bad for a team working in parallel.
- **Decisions only in pull request descriptions.** They exist, but nobody finds them six
  months later, and GitHub search is not a design document.
- **No records.** The rules we encode will change under us; undocumented assumptions would
  be rediscovered the expensive way.
