#!/usr/bin/env node
/**
 * Is the live site serving the current `main`?
 *
 * The comparison lives here rather than inline in `alerts.yml` for the reason the whole of
 * #113 is about: logic in a workflow file is logic nothing runs until the day it matters.
 * The cases below have tests; a regex in YAML has none (QALead, #130).
 *
 * `main`'s head is passed in by the caller rather than read here, because the caller
 * re-reads it after waiting — `main` moving during the wait changes what "current" means.
 */

/** The commit that introduced `<meta name="build-sha">`. See `STAMPED_SINCE` below. */
export const STAMPING_COMMIT = 'e95a810';

/** Pulls the build stamp out of a served document. Empty when the build predates stamping. */
export function servedBuild(html) {
  return /<meta name="build-sha" content="([^"]*)"/.exec(html)?.[1] ?? '';
}

/**
 * @param {object} input
 * @param {boolean} input.ok            the site answered
 * @param {number}  input.status        its HTTP status
 * @param {string}  input.html          the served document
 * @param {string}  input.headSha       `main`'s head, read now
 * @param {boolean} input.stampingLanded  does `main` already contain {@link STAMPING_COMMIT}?
 * @returns {{ stale: boolean, served: string }}
 *
 * An **unreachable** site is not stale. That is an availability problem, which the
 * production smoke reports; conflating the two would make this alert fire for a reason its
 * own title does not describe, which is how an alert stops being read.
 *
 * An **unstamped** build is decided by ancestry rather than waved through. A served
 * document with no `build-sha` was built before the stamping commit, so if `main` already
 * contains that commit the site is by definition behind — that is what stale *means*. The
 * earlier version of this treated unstamped as current, and QALead measured it blind
 * during the exact incident it exists for: four undeployed commits, one of them the
 * stamping commit itself, so the job whose purpose is to notice would have stayed quiet
 * because the first thing that had to deploy was the thing that was stuck. The exception
 * removed the alarm during the fire.
 *
 * The ancestry test needs no stored state and retires itself: before the stamping commit
 * lands it answers "current", after it lands it answers "stale", and once any stamped
 * build is live the branch is unreachable.
 *
 * A served `dev` is handled the same way, which also settles a disagreement: the deploy
 * smoke treats `dev` as a loud failure, and treating it as "fine" here would have had two
 * checks disagreeing about one observation.
 */
export function compareDeployedBuild({ ok, status, html, headSha, stampingLanded }) {
  if (!ok) return { stale: false, served: `unreachable (HTTP ${status})` };

  const served = servedBuild(html);
  if (served === '' || served === 'dev') {
    return {
      stale: stampingLanded === true,
      served: served === '' ? 'no build-sha meta tag' : 'dev',
    };
  }

  return { stale: served !== headSha, served };
}
