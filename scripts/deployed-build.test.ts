import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEPLOY_WINDOW_MINUTES,
  decide,
  dueCommit,
  IGNORED_BY_CI,
  readLiveSite,
  STAMPING_COMMIT,
  servedBuild,
  startsDeploy,
  // @ts-expect-error — plain ESM script, deliberately not TypeScript: the workflow runs it
  // with bare `node`, and a build step between an alert and its answer is a liability.
} from './deployed-build.mjs';

const MINUTE = 60_000;
const NOW = Date.parse('2026-11-02T03:00:00Z');
const ago = (minutes: number) => new Date(NOW - minutes * MINUTE).toISOString();
const page = (sha: string) =>
  `<!doctype html><html><head><meta name="build-sha" content="${sha}" /></head></html>`;

describe('which commits start a deploy (#130)', () => {
  it('is any commit touching a path the CI filter does not ignore', () => {
    expect(startsDeploy(['src/app/App.tsx'])).toBe(true);
    expect(startsDeploy(['docs/qa/test-cases.md', 'e2e/smoke.spec.ts'])).toBe(true);
  });

  it('is never a docs-only commit, at the root or under docs/', () => {
    expect(startsDeploy(['docs/qa/test-cases.md'])).toBe(false);
    expect(startsDeploy(['README.md', 'docs/content/guide.zh-TW.md'])).toBe(false);
  });

  it('agrees with the filter ci.yml actually applies to a push', () => {
    // The deploy follows CI, so whatever CI ignores never deploys. If the filter changes,
    // this fails rather than the alert starting to judge commits that can never be live.
    const workflow = readFileSync(
      join(import.meta.dirname, '..', '.github', 'workflows', 'ci.yml'),
      'utf8',
    );
    const push = /^\s*push:\s*\n(?:\s+.*\n)*?\s+paths-ignore:\s*\[([^\]]*)\]/m.exec(workflow);
    const ignored = push?.[1]?.split(',').map((glob) => glob.trim().replace(/^'|'$/g, ''));
    expect(ignored).toEqual(IGNORED_BY_CI);
  });
});

describe('which commit the site must already contain (#130)', () => {
  const code = async () => ['src/app/App.tsx'];
  const commits = [
    { sha: 'head', committedAt: ago(5) },
    { sha: 'prev', committedAt: ago(DEPLOY_WINDOW_MINUTES) },
    { sha: 'older', committedAt: ago(90) },
  ];

  it('is the newest commit that has been on main for a whole deploy window', async () => {
    // Exactly at the window counts as due: the boundary belongs to "should be live".
    expect(await dueCommit(commits, NOW, code)).toBe('prev');
  });

  it('is nothing at all while every commit is still inside the window', async () => {
    expect(await dueCommit([{ sha: 'head', committedAt: ago(5) }], NOW, code)).toBeNull();
  });

  it('skips a docs-only commit, which no deploy will ever follow', async () => {
    const filesOf = async (sha: string) =>
      sha === 'prev' ? ['docs/qa/test-cases.md'] : ['src/x.ts'];
    expect(await dueCommit(commits, NOW, filesOf)).toBe('older');
  });
});

describe('is the live site serving main? (#113, #130)', () => {
  const base = { ok: true, status: 200, due: 'prev', containsDue: true, stampingInDue: true };

  it('is current when the served build contains the due commit', () => {
    expect(decide({ ...base, served: 'head' })).toMatchObject({ stale: false, reason: 'current' });
  });

  it('is stale when the served build does not contain it', () => {
    expect(decide({ ...base, served: 'older', containsDue: false })).toEqual({
      stale: true,
      served: 'older',
      reason: 'behind',
    });
  });

  it('judges nothing while nothing is due, however old the served build looks', () => {
    expect(decide({ ...base, served: 'older', due: null, containsDue: false })).toMatchObject({
      stale: false,
      reason: 'nothing due yet',
    });
  });

  it('calls an unstamped build stale once the due commit contains the stamping commit', () => {
    // The case the first version got backwards, and was measured blind during the incident
    // it exists for: four undeployed commits, one of them the stamping commit itself.
    expect(decide({ ...base, served: '', containsDue: false })).toEqual({
      stale: true,
      served: 'no build-sha meta tag',
      reason: 'unstamped build',
    });
    expect(decide({ ...base, served: '', containsDue: false, stampingInDue: false })).toMatchObject(
      {
        stale: false,
      },
    );
  });

  it('treats a served "dev" build like an unstamped one, so this and the deploy smoke agree', () => {
    expect(decide({ ...base, served: 'dev', containsDue: false })).toMatchObject({ stale: true });
    expect(
      decide({ ...base, served: 'dev', containsDue: false, stampingInDue: false }),
    ).toMatchObject({ stale: false });
  });

  it('does not call an unreachable site stale: that is availability, which the smoke reports', () => {
    expect(decide({ ...base, ok: false, status: 503, served: '' })).toMatchObject({
      stale: false,
      served: 'unreachable (HTTP 503)',
    });
  });

  it('reads the stamp out of a real document and reports its absence as empty', () => {
    expect(servedBuild('<meta charset="utf-8"><meta name="build-sha" content="abc123" />')).toBe(
      'abc123',
    );
    expect(servedBuild('<meta name="description" content="Kaeru" />')).toBe('');
  });
});

describe('reading both sides (#130)', () => {
  /** main, newest first, with the stamping commit at the root of its history. */
  const history = ['head', 'prev', 'older', STAMPING_COMMIT];
  const github = {
    rest: {
      repos: {
        listCommits: async () => ({
          data: [
            { sha: 'head', commit: { committer: { date: ago(5) } } },
            { sha: 'prev', commit: { committer: { date: ago(40) } } },
            { sha: 'older', commit: { committer: { date: ago(90) } } },
          ],
        }),
        getCommit: async () => ({ data: { files: [{ filename: 'src/app/App.tsx' }] } }),
        compareCommitsWithBasehead: async ({ basehead }: { basehead: string }) => {
          const [ancestor = '', sha = ''] = basehead.split('...');
          const distance = history.indexOf(ancestor) - history.indexOf(sha);
          return {
            data: { status: distance === 0 ? 'identical' : distance > 0 ? 'ahead' : 'behind' },
          };
        },
      },
    },
  };
  const context = { repo: { owner: 'sean1093', repo: 'kaeru' } };
  const serving = (sha: string) => async () => ({
    ok: true,
    status: 200,
    text: async () => page(sha),
  });

  it('does not report a merge that is still on its way to the site', async () => {
    // The false S1 this replaces: main's head landed five minutes ago and is in CI, the
    // site serves the commit before it, and comparing against the head called that stale.
    const result = await readLiveSite({
      github,
      context,
      fetch: serving('prev'),
      now: NOW,
      cacheKey: '1',
    });
    expect(result).toMatchObject({ stale: false, reason: 'current', head: 'head', due: 'prev' });
  });

  it('reports a site that is behind a commit that has had time to deploy', async () => {
    const result = await readLiveSite({
      github,
      context,
      fetch: serving('older'),
      now: NOW,
      cacheKey: '1',
    });
    expect(result).toMatchObject({ stale: true, served: 'older', due: 'prev' });
  });
});
