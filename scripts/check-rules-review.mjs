#!/usr/bin/env node
/**
 * Reports when the shipped rules document has not been reviewed recently (TC-DOM-052, R19).
 *
 * Run on a weekly schedule, never in the pull-request pipeline: a stale review date is a
 * reason to look at the rules, not a reason to turn a pull request red on a day nobody
 * pushed. The workflow that calls this (issue #52) only has to read the exit code, so
 * everything it needs is printed here.
 *
 * Usage: node scripts/check-rules-review.mjs
 * Exit 0 — within the window. Exit 1 — overdue. Exit 2 — could not read the rules.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RULES_DATA = fileURLToPath(new URL('../src/domain/rules-data.ts', import.meta.url));

function field(source, name, pattern) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`${name} not found in ${RULES_DATA}`);
  return match[1];
}

function daysBetween(from, to) {
  const day = 86_400_000;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / day);
}

try {
  const source = readFileSync(RULES_DATA, 'utf8');
  const lastReviewed = field(source, 'lastReviewed', /lastReviewed:\s*'(\d{4}-\d{2}-\d{2})'/);
  const maxAgeDays = Number(
    field(source, 'RULES_REVIEW_MAX_AGE_DAYS', /RULES_REVIEW_MAX_AGE_DAYS\s*=\s*(\d+)/),
  );

  // The same JST calendar date the app resolves rules against (UR-07).
  const todayInJapan = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const ageDays = daysBetween(lastReviewed, todayInJapan);
  const summary = `Rules data last reviewed ${lastReviewed} — ${ageDays} days ago (limit ${maxAgeDays}).`;

  if (ageDays > maxAgeDays) {
    console.error(`${summary} Review docs/product/domain-rules.md and src/domain/rules-data.ts.`);
    process.exit(1);
  }
  console.log(summary);
} catch (error) {
  console.error(`Could not check the rules review date: ${error.message}`);
  process.exit(2);
}
