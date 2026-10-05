/**
 * The rule constants that live in `src/domain/rules-data.ts` and nowhere else.
 *
 * One list, imported by both the domain's own scan (`rules-data.test.ts`, which guards
 * `src/domain`) and the guardrail suite (which guards everywhere else). Two lists would
 * drift, and the one that drifted would be the one nobody was watching.
 *
 * These are deliberately broad — `90` and every decimal literal are banned outright — so a
 * false positive will arrive before a catch does. When one does: **name the value in the
 * rules document, or add it to the documented allowlist in the scan that fired.** Never
 * loosen a pattern. A guard relaxed on first contact protects nothing.
 */
export interface ForbiddenConstant {
  rule: string;
  what: string;
  pattern: RegExp;
}

export const FORBIDDEN_CONSTANTS: readonly ForbiddenConstant[] = [
  { rule: 'DR-010', what: 'the 5,000 yen threshold', pattern: /\b5_?000\b/ },
  { rule: 'DR-016', what: 'the 1,000,000 yen unit price', pattern: /\b1_?000_?000\b/ },
  { rule: 'DR-027', what: 'the 2,000 yen fee warning floor', pattern: /\b2_?000\b/ },
  { rule: 'DR-031', what: 'the 90-day export window', pattern: /\b90\b/ },
  { rule: 'DR-023', what: 'a tax rate', pattern: /\b\d*\.\d+\b/ },
  { rule: 'DR-001', what: 'an effective date', pattern: /\b\d{4}-\d{2}-\d{2}\b/ },
];

/** Comments quote the rules on purpose; only executable text is scanned. */
export function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
