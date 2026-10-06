#!/usr/bin/env node
/**
 * Is the live site serving the current `main`?
 *
 * The logic lives here rather than inline in `alerts.yml` for the reason the whole of #113
 * is about: logic in a workflow file is logic nothing runs until the day it matters. The
 * decisions are pure functions with tests; `readLiveSite` is the one place that talks to
 * GitHub and the site, and both workflow steps call it, so the confirming read cannot drift
 * from the first one.
 */

/** The commit that introduced `<meta name="build-sha">`. See `decide` below. */
export const STAMPING_COMMIT = 'e95a810';

export const SITE = 'https://sean1093.github.io/kaeru/';

/**
 * How long a commit on `main` may take to reach the site before its absence means
 * something. Measured on #130: a narrow-scope push is live in 5–6 minutes, but a
 * full-matrix CI run alone took 9–17, plus about 2 for the deploy. Twenty covers every
 * successful run measured.
 */
export const DEPLOY_WINDOW_MINUTES = 20;

/** Pulls the build stamp out of a served document. Empty when the build predates stamping. */
export function servedBuild(html) {
  return /<meta name="build-sha" content="([^"]*)"/.exec(html)?.[1] ?? '';
}

/**
 * What `ci.yml`'s `push` filter ignores. A push that touches nothing else runs no CI, and
 * the deploy is gated on CI succeeding, so such a commit is never deployed at all. A unit
 * test reads the filter out of `ci.yml` and fails when the two disagree.
 */
export const IGNORED_BY_CI = ['docs/**', '**/*.md'];

/** Does a commit touching `files` start a deploy? Only if one of them escapes the filter. */
export function startsDeploy(files) {
  return files.some((file) => !file.startsWith('docs/') && !file.endsWith('.md'));
}

/**
 * The CI conclusions the `ci-failure` alert in `alerts.yml` reports. A commit whose CI
 * concluded this way never deploys, by design, and has already been filed as red CI — so it
 * is never due here, or one root cause would be filed twice, once as S1 "CI failed" and
 * again twenty minutes later as S1 "the live site is behind" (#117).
 *
 * `cancelled` is deliberately absent. A cancelled run is also alerted on, but a cancelled
 * commit is exactly the #113 condition: nothing failed, nothing deployed, and the site
 * really is behind. It stays due, and the staleness alert names the cancellation.
 */
export const OWNED_BY_CI_ALERT = ['failure'];

/**
 * The commit the site must already contain: the newest commit on `main` that has been
 * there for a full deploy window, starts a deploy, and whose CI did not fail. `null` when
 * there is none — nothing is due yet. `ci` is that commit's CI conclusion, for the alert
 * body: `success`, `cancelled`, `in progress`, `none` (no run at all), and so on.
 *
 * Judging against this rather than against `main`'s head is what keeps an ordinary merge
 * from being reported: the head is usually still in CI, and a head-based check fires on
 * every merge that lands shortly before it runs. It also never goes blind during a busy
 * stretch, which a "head is old enough" rule would — each merge would reset the clock.
 *
 * A docs-only commit is never due: CI ignores it, so no deploy follows, and the site can
 * never contain it. Judged against one, every docs merge that happened to land last would
 * be reported as an S1 twenty minutes later — found by running this against the real
 * repository on #130, where `main`'s head was a docs-only merge.
 *
 * A commit whose CI failed is skipped for the same reason — it can never be live — and
 * because the red-CI alert already owns it (see {@link OWNED_BY_CI_ALERT}). The commit
 * before it is then the one the site must contain, which it does while main is red.
 *
 * `main` only receives squash merges, so a commit's committer date is the moment it
 * landed. A commit pushed long after it was made would look older than it is.
 *
 * @param {readonly { sha: string, committedAt: string }[]} commits newest first
 * @param {number} now epoch milliseconds
 * @param {(sha: string) => Promise<readonly string[]>} filesOf asked only for candidates
 * @param {(sha: string) => Promise<string>} ciOf a commit's CI conclusion, asked only for
 *   candidates that start a deploy
 * @returns {Promise<{ sha: string, ci: string } | null>}
 */
export async function dueCommit(commits, now, filesOf, ciOf) {
  const cutoff = now - DEPLOY_WINDOW_MINUTES * 60_000;
  for (const commit of commits) {
    if (Date.parse(commit.committedAt) > cutoff) continue;
    if (!startsDeploy(await filesOf(commit.sha))) continue;
    const ci = await ciOf(commit.sha);
    if (OWNED_BY_CI_ALERT.includes(ci)) continue;
    return { sha: commit.sha, ci };
  }
  return null;
}

/**
 * Summarises a commit's push-triggered CI runs, newest first, as one conclusion. The
 * newest run decides: a failed run that was re-run green is green.
 *
 * @param {readonly { status: string, conclusion: string | null }[]} runs
 */
export function ciConclusion(runs) {
  const [latest] = runs;
  if (!latest) return 'none';
  if (latest.status !== 'completed') return 'in progress';
  return latest.conclusion ?? 'unknown';
}

/**
 * @param {object} input
 * @param {boolean} input.ok              the site answered
 * @param {number}  input.status          its HTTP status
 * @param {string}  input.served          the build stamp, `''` when there is none
 * @param {string | null} input.due       see {@link dueCommit}
 * @param {boolean} input.containsDue     the served commit is `due` or a descendant of it
 * @param {boolean} input.stampingInDue   `due` already contains {@link STAMPING_COMMIT}
 * @returns {{ stale: boolean, served: string, reason: string }}
 *
 * An **unreachable** site is not stale. That is an availability problem, which the
 * production smoke reports; conflating the two would make this alert fire for a reason its
 * own title does not describe, which is how an alert stops being read.
 *
 * An **unstamped** build is decided by ancestry rather than waved through. A document with
 * no `build-sha` was built before the stamping commit, so if the due commit already
 * contains that commit, the site is by definition behind. The earlier version treated
 * unstamped as current, and QALead measured it blind during the exact incident it exists
 * for: four undeployed commits, one of them the stamping commit itself. The rule needs no
 * stored state and retires itself once any stamped build is live. A served `dev` is
 * handled the same way, so this and the deploy smoke — which calls `dev` a loud failure —
 * do not disagree about one observation.
 */
export function decide({ ok, status, served, due, containsDue, stampingInDue }) {
  if (!ok) return { stale: false, served: `unreachable (HTTP ${status})`, reason: 'unreachable' };
  const shown = served === '' ? 'no build-sha meta tag' : served;
  if (due === null) return { stale: false, served: shown, reason: 'nothing due yet' };
  if (served === '' || served === 'dev') {
    return { stale: stampingInDue, served: shown, reason: 'unstamped build' };
  }
  return { stale: !containsDue, served: shown, reason: containsDue ? 'current' : 'behind' };
}

/** `compare` says the right side is the left side or a descendant of it. */
async function contains(github, repo, ancestor, sha) {
  try {
    const { data } = await github.rest.repos.compareCommitsWithBasehead({
      ...repo,
      basehead: `${ancestor}...${sha}`,
    });
    return data.status === 'identical' || data.status === 'ahead';
  } catch {
    // A sha the repository does not know — a build from a force-pushed or foreign commit —
    // contains nothing on `main`.
    return false;
  }
}

/**
 * Reads both sides as they are right now. Both workflow steps call this; the second one,
 * after the confirmation wait, re-reads `main` too, because a comparison against the
 * commits this job started with would judge the site against a question that has moved.
 *
 * `cacheKey` must differ per read: a unique query string is a different Pages CDN cache
 * key by construction, where `Cache-Control: no-cache` on the request is a hint an edge
 * may ignore.
 */
export async function readLiveSite({ github, context, fetch, now, cacheKey }) {
  const { data: commits } = await github.rest.repos.listCommits({
    ...context.repo,
    sha: 'main',
    per_page: 50,
  });
  const head = commits[0]?.sha ?? '';
  const found = await dueCommit(
    commits.map((commit) => ({ sha: commit.sha, committedAt: commit.commit.committer.date })),
    now,
    async (ref) => {
      const { data } = await github.rest.repos.getCommit({ ...context.repo, ref });
      return (data.files ?? []).map((file) => file.filename);
    },
    async (sha) => {
      const { data } = await github.rest.actions.listWorkflowRuns({
        ...context.repo,
        workflow_id: 'ci.yml',
        head_sha: sha,
        event: 'push',
        per_page: 5,
      });
      return ciConclusion(data.workflow_runs ?? []);
    },
  );
  const due = found?.sha ?? null;

  const response = await fetch(`${SITE}?build-check=${encodeURIComponent(cacheKey)}`);
  const served = response.ok ? servedBuild(await response.text()) : '';
  const stamped = served !== '' && served !== 'dev';
  const containsDue =
    due !== null && stamped && (await contains(github, context.repo, due, served));
  const stampingInDue =
    due !== null && !stamped && (await contains(github, context.repo, STAMPING_COMMIT, due));

  return {
    ...decide({
      ok: response.ok,
      status: response.status,
      served,
      due,
      containsDue,
      stampingInDue,
    }),
    head,
    due: due ?? 'none yet',
    dueCi: found?.ci ?? 'n/a',
  };
}
