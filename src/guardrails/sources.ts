/**
 * Reading the source tree, for the guardrail suite and for the domain's own scan.
 *
 * Two rules govern everything here, both from `test-strategy.md` section 3:
 *
 * - **Never loosen a pattern to make a failure go away.** When a guardrail fires on
 *   something legitimate, the fix is to name the value in the rules document or to add it
 *   to an allowlist a reviewer can argue with.
 * - **Narrowing the *input* is not loosening the *pattern*.** `stripNonCode` removes SVG
 *   geometry before scanning, because a path coordinate is not a rule constant and never
 *   can be — that is a class of text, not an exception for a file. Every icon added later
 *   is covered by it, where a per-file allowlist would need extending each time and would
 *   quietly become the escape hatch.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface SourceFile {
  /** Path relative to `src/`, e.g. `data/backup.ts`. */
  readonly name: string;
  /** Executable text: comments and SVG geometry removed. */
  readonly code: string;
  /** The file as written, for checks that must see comments and strings. */
  readonly raw: string;
}

/** Comments quote the rules on purpose, so only executable text is scanned. */
export function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/**
 * Removes markup geometry: an attribute whose value is nothing but numbers, separators and
 * signs, plus SVG path data, whose value is numbers and the path command alphabet.
 * `r="2.2"`, `cx="9"`, `stroke-width="1.8"`, `d="M24 34V17M16.5 24.5L24 16l7.5 8.5"`.
 *
 * Two **classes** of text rather than a list of attributes or a list of files, deliberately.
 * An enumerated list needs extending every time an icon uses a tag nobody thought of, and
 * each extension would arrive as a fix for a failing guardrail — which is how an allowlist
 * becomes an escape hatch. Both classes are closed: a rule constant in this codebase is a
 * TypeScript literal, and it is never the entire value of a markup attribute.
 *
 * The path alphabet is spelled out rather than written `[A-Za-z]`: a value holding any
 * letter outside it is not path data, and is left for the guardrails to scan.
 */
export function stripNonCode(source: string): string {
  return withoutComments(source)
    .replace(/\b[a-zA-Z-]+="[\d\s.,+-]+"/g, '')
    .replace(/\bd="[MmLlHhVvCcSsQqTtAaZz\d\s.,+-]+"/g, '');
}
/**
 * Every top-level directory under `src/` that holds product code.
 *
 * `styles` is CSS, `test-support` is scaffolding, `guardrails` is this suite. Anything
 * else appearing under `src/` is unguarded until someone adds it here, which is why the
 * set is asserted rather than assumed.
 */
export const GUARDED_DIRECTORIES = [
  'app',
  'content',
  'data',
  'domain',
  'features',
  'i18n',
  'ui',
] as const;

const NOT_PRODUCT: Record<string, true> = { styles: true, 'test-support': true, guardrails: true };

export const SRC = join(import.meta.dirname, '..');

function filesUnder(directory: string): readonly string[] {
  try {
    return readdirSync(join(SRC, directory), { recursive: true, withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.tsx?$/.test(entry.name) &&
          !entry.name.endsWith('.d.ts') &&
          !entry.name.includes('.test.'),
      )
      .map((entry) => join(entry.parentPath, entry.name));
  } catch {
    return [];
  }
}

export function readSources(): readonly SourceFile[] {
  return GUARDED_DIRECTORIES.flatMap((directory) =>
    filesUnder(directory).map((path) => {
      const raw = readFileSync(path, 'utf8');
      return { name: relative(SRC, path).replaceAll('\\', '/'), code: stripNonCode(raw), raw };
    }),
  );
}

/** The product directories actually present, so a new one cannot appear unguarded. */
export function productDirectories(): readonly string[] {
  return readdirSync(SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && NOT_PRODUCT[entry.name] !== true)
    .map((entry) => entry.name)
    .sort();
}

/** End-to-end specs, for the `test.fixme` gate. */
export function readSpecs(): readonly SourceFile[] {
  const root = join(SRC, '..', 'e2e');
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
    .map((entry) => {
      const path = join(entry.parentPath, entry.name);
      const raw = readFileSync(path, 'utf8');
      return { name: relative(root, path).replaceAll('\\', '/'), code: withoutComments(raw), raw };
    });
}
