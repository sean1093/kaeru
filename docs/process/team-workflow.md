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

### Stacked pull requests

When an issue depends on one still in review, branch from it rather than idling, and say so in the description so a reviewer reads only the top commit. Two sharp edges:

- **Retarget children before merging the parent.** `gh pr merge --squash --delete-branch` **closes** every pull request targeting the deleted branch, and GitHub cannot reopen or retarget a pull request whose base ref is gone. Run `gh pr edit <child> --base main` first. If it has already happened: `git push origin <old-sha>:refs/heads/<branch>`, reopen, retarget to `main`, delete the branch again — reviews and comments survive.
- **Rebase with `--onto`, not plainly.** After a squash merge the parent's commits exist on `main` only as a single squashed commit, so `git rebase origin/main` replays them and hands you conflicts against your own merged work. Use `git rebase --onto origin/main <old-parent-tip> <branch>`.

### Screenshots

UI pull requests show the changed screens in both languages at a 390 px wide viewport. Nobody on the team can drag files into GitHub, so screenshots live on the `pr-assets` branch, never on `main`. `pr-assets` is an **orphan branch that shares no history with `main`**: it can never be merged into `main` by accident, and pushing to it triggers no workflow and never deploys. If it ever has to be recreated, recreate it as an orphan (`git worktree add --orphan -b pr-assets <dir>`).

- Capture with Playwright (`page.screenshot`) from the PR's own build.
- Commit to the `pr-assets` branch at `pr-<number>/<screen-id>-<locale>-<viewport>.png`, e.g. `pr-40/S21-zh-TW-390.png`. Pull with rebase before pushing; paths never collide.
- Embed in the PR body or a comment with `https://raw.githubusercontent.com/sean1093/kaeru/pr-assets/pr-<number>/<file>.png`.
- Screenshots stay after the PR merges; we accept the growth (a few hundred small PNGs). They are the visual record of each review.

### How reviews are posted

The whole team publishes through the maintainer's single GitHub account, and GitHub does not allow approving your own pull request. Reviews are therefore posted as review comments (`gh pr review --comment`) and start with the reviewer's role in bold, for example `**[Architect]**` or `**[QA]**`.

- Change request: list the required changes as a checklist.
- Approval: a comment that ends with `LGTM` from the reviewing role.
- The author answers every point — fixed (with commit) or discussed — before merging.

### Review the branch, not the branch against today's main

With several people merging, `main` is usually ahead of any branch, and `git diff main..branch` shows their merged work as if this branch were reverting it. Review the GitHub diff, which already compares against the merge base, or run `git diff $(git merge-base origin/main HEAD)..HEAD` locally. A pull request that appears to revert a file nobody on it touched is almost always this, not a mistake.

## Definition of Done

- Acceptance criteria of the issue are met.
- Automated tests cover the behavior; CI is green.
- UI works in Traditional Chinese and English, on a phone-sized viewport, and meets WCAG 2.2 AA basics (contrast, labels, focus, target size).
- Docs updated when behavior, rules, or architecture changed.
- Reviewed by another role; QA verified for features.

## Decisions

Significant technical decisions are written as ADRs in `docs/adr/` (`NNNN-title.md`, status: proposed / accepted / superseded). Product and design decisions are recorded in the relevant doc and linked from the issue.
