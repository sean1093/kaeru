# Team Workflow

How the Kaeru team plans, builds, reviews, and ships. Every decision should be traceable to an issue, a document, or a pull request.

## Languages

- Documentation, issues, pull requests, reviews, and commit messages: **English**.
- Product UI: **Traditional Chinese (Taiwan)** and **English**, always both. Every user-facing string goes through i18n; no hard-coded copy.

## Where things live

| What | Where |
|---|---|
| Product brief, journeys, domain rules | `docs/product/` |
| Research with sources | `docs/research/` |
| UX principles, visual language, flows, wireframes | `docs/design/` |
| Architecture overview | `docs/architecture/` |
| Architecture decision records | `docs/adr/` |
| Test strategy, plans, reports | `docs/qa/` |
| Process | `docs/process/` |

`docs/README.md` is the index and project log. The PM maintains it.

## Issues

- Every piece of work starts as an issue with a clear outcome and acceptance criteria.
- Labels: one `role:` label (who owns it), one `type:` label (what kind of work), optional `priority:`.
- Milestones: M0 Discovery & Design, M1 Foundation, M2 MVP Features, M3 Launch.
- Discussion that changes scope or design is written on the issue, not lost in chat.

## Branches and worktrees

- `main` is always releasable and deploys to GitHub Pages.
- Branch names: `docs/…`, `feat/…`, `fix/…`, `test/…`, `chore/…`.
- Each person works in their own git worktree under `.worktrees/<branch-name>` (gitignored), created from the latest `origin/main`. The main checkout stays on `main`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.

## Pull requests

- One PR per issue or tightly scoped change; link it with `Closes #<n>`.
- The description explains what changed, why, how it was verified, and includes screenshots of UI changes in both languages.
- At least one review from a different role. Feature PRs also need QA verification.
- CI must be green before merging.
- Squash merge, delete the branch, remove the worktree.

### How reviews are posted

The whole team publishes through the maintainer's single GitHub account, and GitHub does not allow approving your own pull request. Reviews are therefore posted as review comments (`gh pr review --comment`) and start with the reviewer's role in bold, for example `**[Architect]**` or `**[QA]**`.

- Change request: list the required changes as a checklist.
- Approval: a comment that ends with `LGTM` from the reviewing role.
- The author answers every point — fixed (with commit) or discussed — before merging.

## Definition of Done

- Acceptance criteria of the issue are met.
- Automated tests cover the behavior; CI is green.
- UI works in Traditional Chinese and English, on a phone-sized viewport, and meets WCAG 2.2 AA basics (contrast, labels, focus, target size).
- Docs updated when behavior, rules, or architecture changed.
- Reviewed by another role; QA verified for features.

## Decisions

Significant technical decisions are written as ADRs in `docs/adr/` (`NNNN-title.md`, status: proposed / accepted / superseded). Product and design decisions are recorded in the relevant doc and linked from the issue.
