# 0009 — Deployment to GitHub Pages via GitHub Actions

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-05 |
| Deciders | Architect (issue #4) |

## Context

`main` is always releasable and deploys to <https://sean1093.github.io/kaeru/>. Pages is
already enabled on the repository with `build_type: workflow`, so publishing is done by a
workflow rather than by GitHub's legacy branch-based builder.

The artefact is a Vite build with a base path of `/kaeru/` and a service worker scoped to
the same path (ADR 0004, ADR 0007), so the deployment must not alter paths after the build.

## Decision

`.github/workflows/deploy.yml` is **gated on a green CI run**. It is triggered by
`workflow_run` when the `CI` workflow completes on `main`, and by `workflow_dispatch`:

- Both jobs are guarded by
  `if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'`,
  so a failed CI run on `main` produces no deployment at all.
- **build** job: checkout at `github.event.workflow_run.head_sha` (exactly the commit CI
  verified), `actions/setup-node@v5` with Node 24 and npm cache, `npm ci`, `npm run build`,
  then `actions/upload-pages-artifact@v4` with `path: dist`.
- **deploy** job: `needs: build`, environment `github-pages`, `actions/deploy-pages@v4`.
- Permissions are the minimum the OIDC deployment needs: `contents: read`, `pages: write`,
  `id-token: write`.
- `concurrency: { group: pages, cancel-in-progress: false }` — deployments serialise, and a
  running deployment is never cancelled half-way.
- Manual `workflow_dispatch` exists so the site can be republished without an empty commit.

Correctness is verified **once**, by `ci.yml` (ADR 0008), and the deploy consumes that
result rather than repeating it. Re-running typecheck, lint, unit tests and the full browser
matrix inside the deploy would double the cost and halve the deploy speed for no new
information; skipping the gate entirely would let a red build reach users, and because the
service worker pushes new builds to already-installed clients (QA risk R06), a wrong tax
rule shipped that way is an S1 defect. `workflow_run` gives the gate without the duplication.

## Consequences

- A merge to `main` is a release. There is no staging environment and no manual promotion,
  which suits a free static app with no backend and no data migration risk on the server
  side (client schema migrations are handled in ADR 0005).
- Deploy time is roughly a minute, so a rule fix can reach travellers the same day — which
  matters when the rules themselves are still moving.
- Rolling back means reverting the commit and letting `main` redeploy. There is no artefact
  promotion mechanism to roll back to a previous build.
- A deployed build can briefly coexist with an older one in users' browsers; the update
  prompt (ADR 0007) is how that resolves.
- The deployment runs with GitHub's OIDC token; no long-lived secret exists in the
  repository.
- Because the deployment is gated on a CI *conclusion*, CI must be allowed to finish on
  `main`. `ci.yml` therefore cancels superseded runs only on pull request branches
  (`cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`). Observed during the first
  merge train: three CI runs on `main` were cancelled by concurrency and the deployment was
  correctly skipped three times — the gate behaved as designed, but no commit should reach
  `main` unverified.

## Alternatives considered

- **Deploying from a `gh-pages` branch (`peaceiris/actions-gh-pages`).** Works, but writes
  build output into git history, needs a push token, and conflicts with the already-enabled
  workflow build type. Rejected.
- **A single workflow that tests and deploys.** Fewer files, but every deploy would pay for
  the full browser matrix again, and a flaky E2E would block a deploy of code that already
  passed on the pull request. Rejected.
- **Netlify or Cloudflare Pages.** Nicer previews and redirect rules (which would make
  path-based routing viable), but it adds a third-party account to a project whose selling
  point is that it has no backend and no third parties. Rejected.
- **Deploy previews per pull request.** Genuinely useful for UX review, and not possible on
  GitHub Pages without a second host. Revisit in M2 if screenshot review proves insufficient.
