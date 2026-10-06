/**
 * The CI scope gate: which changed paths force the full browser matrix.
 *
 * A pull request runs **one** Playwright project unless the paths say otherwise
 * (`ci.yml`, #133). That makes this regex the thing deciding how much evidence every other
 * check on a pull request provides — and its failure mode is silent by construction. A hole
 * does not go red; it produces a green check that means less than the reader thinks, on the
 * pull request where an engine difference was most likely.
 *
 * So the expression is read out of the workflow and run against a table, in the unit suite,
 * which already runs on every code change. It costs no CI time and it fails in a job that is
 * already there. The guardrail conventions in `test-strategy.md` apply in full: this is a
 * matcher, so it needs a **positive control** — a pattern that matches nothing is
 * indistinguishable from a codebase that is clean.
 *
 * **When this fails**, the fix is a judgement about risk, never a widened table. A path
 * moves into the full matrix when an engine or viewport difference there is both plausible
 * and expensive; it stays narrow when the change cannot behave differently between engines.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SRC } from './sources.ts';

const WORKFLOW = join(SRC, '..', '.github', 'workflows', 'ci.yml');

/** Reads a `name='…'` shell assignment out of the scope job, so the test runs what CI runs. */
function patternFrom(name: string): RegExp {
  const workflow = readFileSync(WORKFLOW, 'utf8');
  const match = new RegExp(`^\\s*${name}='([^']+)'`, 'm').exec(workflow);
  if (match?.[1] === undefined) {
    throw new Error(
      `ci.yml has no ${name}='…' assignment. The scope job decides which browser projects a pull request runs; if it has been renamed or restructured, this test must follow it rather than be deleted.`,
    );
  }
  return new RegExp(match[1]);
}

/**
 * Why each path is where it is. The `full` entries are the places an engine or viewport
 * difference is both plausible and expensive; the `narrow` entries are changes that cannot
 * behave differently between engines, or whose breakage fails the verify job regardless of
 * which project runs.
 */
const MATRIX: readonly { path: string; full: boolean; because: string }[] = [
  { path: 'e2e/smoke.spec.ts', full: true, because: 'the suite itself' },
  { path: 'src/app/router.ts', full: true, because: 'shell chrome and navigation' },
  { path: 'src/features/airport/Mode.tsx', full: true, because: 'where a mistake costs a refund' },
  {
    path: 'src/data/db.ts',
    full: true,
    because: 'IndexedDB diverges by engine and a loss is unrecoverable',
  },
  {
    path: 'src/ui/BottomSheet.tsx',
    full: true,
    because: 'sticky positioning, focus, inert and dialog semantics differ by engine',
  },
  {
    path: 'src/styles/tokens.css',
    full: true,
    because: 'drives every layout; 320 px reflow and 200% text are viewport tests',
  },
  { path: 'public/manifest.webmanifest', full: true, because: 'PWA install behaviour, R14' },
  {
    path: 'index.html',
    full: true,
    because: 'the app shell: viewport meta, theme-color, safe areas',
  },
  {
    path: 'package.json',
    full: true,
    because: 'a dependency bump is the likeliest cross-engine regression we will merge',
  },
  { path: 'package-lock.json', full: true, because: 'as above, and nobody can read its radius' },
  { path: 'vite.config.ts', full: true, because: 'the build and the service worker' },
  { path: 'playwright.config.ts', full: true, because: 'what every project means' },
  { path: '.github/workflows/ci.yml', full: true, because: 'this gate' },

  {
    path: 'src/features/receipts/AddScreen.tsx',
    full: false,
    because: 'a feature screen composing primitives that are themselves in the full set',
  },
  {
    path: 'src/domain/airport.ts',
    full: false,
    because: 'pure logic with no engine dependence — deliberately narrow despite the name',
  },
  { path: 'src/content/guide.en.ts', full: false, because: 'content data, asserted in unit tests' },
  { path: 'src/guardrails/sources.ts', full: false, because: 'a unit-suite scanner' },
  { path: 'tsconfig.json', full: false, because: 'breakage fails verify whatever project runs' },
  { path: 'docs/qa/test-strategy.md', full: false, because: 'docs skip CI entirely' },
];

const GALLERY: readonly { path: string; runs: boolean }[] = [
  { path: 'src/ui/Button.tsx', runs: true },
  { path: 'src/features/gallery/GalleryScreen.tsx', runs: true },
  { path: 'e2e/gallery/core.spec.ts', runs: true },
  // The gallery is DEV-gated and absent from the production bundle, so on a change that
  // cannot touch it the run proves nothing and its dev server is started for nobody.
  { path: 'src/domain/money.ts', runs: false },
  { path: 'src/data/backup.ts', runs: false },
];

describe('the CI scope gate decides the browser matrix from the changed paths', () => {
  const full = patternFrom('full');
  const gallery = patternFrom('gallery');

  it('fires on a known violation, so "no match" means something', () => {
    // Positive control. Without this the table below would pass just as happily against a
    // pattern that matches nothing at all — green, plausible, and incapable of being
    // otherwise, which is the failure this gate decides the blast radius of.
    expect(full.test('src/app/router.ts')).toBe(true);
    expect(full.test('src/domain/money.ts')).toBe(false);
    expect(gallery.test('src/features/gallery/GalleryScreen.tsx')).toBe(true);
    expect(gallery.test('src/domain/money.ts')).toBe(false);
  });

  for (const { path, full: expected, because } of MATRIX) {
    it(`${expected ? 'runs the full matrix' : 'runs one project'} for ${path} — ${because}`, () => {
      expect(full.test(path)).toBe(expected);
    });
  }

  for (const { path, runs } of GALLERY) {
    it(`${runs ? 'runs' : 'skips'} the gallery for ${path}`, () => {
      expect(gallery.test(path)).toBe(runs);
    });
  }

  it('anchors at the start, so a path merely containing a guarded name stays narrow', () => {
    // `docs/src/ui/notes.md` is not `src/ui/`. An unanchored pattern would quietly widen
    // the matrix, which is the failure that looks like caution and costs throughput.
    expect(full.test('docs/src/ui/notes.md')).toBe(false);
    expect(full.test('scripts/e2e/helper.mjs')).toBe(false);
  });
});
