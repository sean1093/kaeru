/**
 * Every workflow and every local action manifest loads.
 *
 * GitHub parses a workflow when it runs, and a local action only when a step reaches it. A
 * manifest that does not parse therefore fails at the worst possible moment and in the
 * quietest possible place: `.github/actions/file-alert/action.yml` had a plain scalar
 * containing ": " from #101 until #151, so every alert job — red CI on main, the
 * production smoke, rules freshness — failed red trying to load it, and no issue was ever
 * filed. Eleven alert runs failed that way and nothing anyone reads said so.
 *
 * This is the unit suite's job because it is the one check that runs on every code change
 * and fails before merge. Only syntax and the top-level shape are asserted here; what a
 * workflow means is #146's and the alert drill's business.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';
import { SRC } from './sources.ts';

const ROOT = join(SRC, '..');
const GITHUB = join(ROOT, '.github');

const manifests = readdirSync(GITHUB, { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('.yml') || path.endsWith('.yaml'))
  .map((path) => join(GITHUB, path));

describe('every workflow and local action manifest loads', () => {
  it('finds the workflows and the shared alert action', () => {
    // Positive control: a glob that matched nothing would make every case below vacuous.
    const found = manifests.map((file) => relative(ROOT, file));
    expect(found).toContain('.github/workflows/ci.yml');
    expect(found).toContain('.github/actions/file-alert/action.yml');
  });

  for (const file of manifests) {
    const name = relative(ROOT, file);
    it(`${name} parses, and has the shape its kind needs`, () => {
      const document = parseDocument(readFileSync(file, 'utf8'));
      expect(document.errors.map((error) => error.message)).toEqual([]);
      const top = document.toJS() as Record<string, unknown>;
      if (name.startsWith('.github/actions/')) {
        expect(top).toHaveProperty('runs');
      } else if (name.startsWith('.github/workflows/')) {
        expect(top).toHaveProperty('on');
        expect(top).toHaveProperty('jobs');
      }
    });
  }
});
