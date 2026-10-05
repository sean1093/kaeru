#!/usr/bin/env node
/**
 * Is the live site serving a given commit?
 *
 * The comparison lives here rather than inline in `alerts.yml` for the reason the whole
 * of #113 is about: logic in a workflow file is logic nothing runs until the day it
 * matters. The four cases below have tests; a regex in YAML has none (QALead, #130).
 *
 * `main`'s head is passed in by the caller rather than read here, because the caller
 * re-reads it after waiting — a deploy that lands during the wait must not be reported,
 * and a commit that lands during the wait changes what "current" means.
 */

/** Pulls the build stamp out of a served document. Empty when the build predates #124. */
export function servedBuild(html) {
  return /<meta name="build-sha" content="([^"]*)"/.exec(html)?.[1] ?? '';
}

/**
 * @returns `{ stale, served }` — `stale` is true only when the site demonstrably serves a
 * different commit. Unreachable is **not** stale: that is an availability problem, which
 * the production smoke reports, and conflating the two would make this alert fire for a
 * reason its title does not describe.
 *
 * A build with no stamp counts as current. Anything built before #124 carries none, so
 * alerting on it would fire until the next deploy and teach everyone to ignore this job
 * on the one day it is new.
 */
export function compareDeployedBuild({ ok, status, html, headSha }) {
  if (!ok) return { stale: false, served: `unreachable (HTTP ${status})` };
  const served = servedBuild(html);
  if (served === '' || served === 'dev') {
    return { stale: false, served: served === '' ? 'no build-sha meta tag' : 'dev' };
  }
  return { stale: served !== headSha, served };
}
