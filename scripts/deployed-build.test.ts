import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM script, deliberately not TypeScript: the workflow runs it
// with bare `node` and a build step between an alert and its answer is a liability.
import { compareDeployedBuild, servedBuild } from './deployed-build.mjs';

const page = (sha: string) =>
  `<!doctype html><html><head><meta name="build-sha" content="${sha}" /></head></html>`;

describe('is the live site serving this commit? (#113, #130)', () => {
  it('reports stale when the served build is a different commit', () => {
    expect(
      compareDeployedBuild({ ok: true, status: 200, html: page('old'), headSha: 'new' }),
    ).toEqual({ stale: true, served: 'old' });
  });

  it('reports current when the served build is this commit', () => {
    expect(
      compareDeployedBuild({ ok: true, status: 200, html: page('same'), headSha: 'same' }),
    ).toEqual({ stale: false, served: 'same' });
  });

  it('treats an unstamped build as current, so it stays quiet until a stamped deploy lands', () => {
    // Every build before #124 carries no stamp. Alerting on those would fire continuously
    // until the next deploy and teach everyone to ignore this job on the day it is new.
    expect(
      compareDeployedBuild({ ok: true, status: 200, html: '<html></html>', headSha: 'new' }),
    ).toEqual({ stale: false, served: 'no build-sha meta tag' });
  });

  it('treats a local build as current rather than reporting "dev" as a wrong commit', () => {
    expect(
      compareDeployedBuild({ ok: true, status: 200, html: page('dev'), headSha: 'new' }),
    ).toEqual({ stale: false, served: 'dev' });
  });

  it('does not call an unreachable site stale: that is availability, which the smoke reports', () => {
    // Conflating them would make this alert fire for a reason its own title does not
    // describe, which is how an alert stops being read.
    expect(compareDeployedBuild({ ok: false, status: 503, html: '', headSha: 'new' })).toEqual({
      stale: false,
      served: 'unreachable (HTTP 503)',
    });
  });

  it('reads the stamp out of a real document, attributes in any order around it', () => {
    expect(servedBuild('<meta charset="utf-8"><meta name="build-sha" content="abc123" />')).toBe(
      'abc123',
    );
    expect(servedBuild('<meta name="description" content="Kaeru" />')).toBe('');
  });
});
