import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM script, deliberately not TypeScript: the workflow runs it
// with bare `node`, and a build step between an alert and its answer is a liability.
import { compareDeployedBuild, servedBuild } from './deployed-build.mjs';

const page = (sha: string) =>
  `<!doctype html><html><head><meta name="build-sha" content="${sha}" /></head></html>`;
const unstamped = '<!doctype html><html><head><meta charset="utf-8" /></head></html>';

describe('is the live site serving the current main? (#113, #130)', () => {
  it('reports stale when the served build is a different commit', () => {
    expect(
      compareDeployedBuild({
        ok: true,
        status: 200,
        html: page('old'),
        headSha: 'new',
        stampingLanded: true,
      }),
    ).toEqual({ stale: true, served: 'old' });
  });

  it('reports current when the served build is the head', () => {
    expect(
      compareDeployedBuild({
        ok: true,
        status: 200,
        html: page('same'),
        headSha: 'same',
        stampingLanded: true,
      }),
    ).toEqual({ stale: false, served: 'same' });
  });

  it('reports an unstamped build as STALE once main contains the stamping commit', () => {
    // The case that matters, and the one the first version got backwards. A document with
    // no stamp was built before stamping existed; if main already has that commit, the
    // site is by definition behind. QALead measured the earlier version blind during the
    // incident it exists for — four undeployed commits, one of them the stamping commit.
    expect(
      compareDeployedBuild({
        ok: true,
        status: 200,
        html: unstamped,
        headSha: 'new',
        stampingLanded: true,
      }),
    ).toEqual({ stale: true, served: 'no build-sha meta tag' });
  });

  it('reports an unstamped build as current before the stamping commit lands', () => {
    // The window in which every live build legitimately has no stamp. Firing here would
    // have alerted continuously until the first stamped deploy, which is how a new job
    // teaches everyone to ignore it.
    expect(
      compareDeployedBuild({
        ok: true,
        status: 200,
        html: unstamped,
        headSha: 'new',
        stampingLanded: false,
      }),
    ).toEqual({ stale: false, served: 'no build-sha meta tag' });
  });

  it('treats a served "dev" build the same way, so this and the deploy smoke agree', () => {
    // The smoke calls a `dev` build a loud failure. Calling it fine here would be two
    // checks disagreeing about one observation.
    expect(
      compareDeployedBuild({
        ok: true,
        status: 200,
        html: page('dev'),
        headSha: 'new',
        stampingLanded: true,
      }),
    ).toEqual({ stale: true, served: 'dev' });
    expect(
      compareDeployedBuild({
        ok: true,
        status: 200,
        html: page('dev'),
        headSha: 'new',
        stampingLanded: false,
      }),
    ).toEqual({ stale: false, served: 'dev' });
  });

  it('does not call an unreachable site stale: that is availability, which the smoke reports', () => {
    expect(
      compareDeployedBuild({
        ok: false,
        status: 503,
        html: '',
        headSha: 'new',
        stampingLanded: true,
      }),
    ).toEqual({ stale: false, served: 'unreachable (HTTP 503)' });
  });

  it('reads the stamp out of a real document and reports its absence as empty', () => {
    expect(servedBuild('<meta charset="utf-8"><meta name="build-sha" content="abc123" />')).toBe(
      'abc123',
    );
    expect(servedBuild('<meta name="description" content="Kaeru" />')).toBe('');
  });
});
