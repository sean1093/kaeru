#!/usr/bin/env node
/**
 * Reports when the shipped rules document needs a human to look at it (TC-DOM-052, R19).
 *
 * Two checks, both read out of `src/domain/rules-data.ts` so the policy stays with the
 * data it governs:
 *
 *   1. `lastReviewed` is older than `RULES_REVIEW_MAX_AGE_DAYS`.
 *   2. A `pending-legislation` row takes effect within `RULES_PENDING_LOOKAHEAD_DAYS`, or
 *      is already in force while still marked pending. Age alone would not catch the one
 *      that matters: the review falls due two days after the 1% food window opens, so the
 *      prompt would arrive after the rate had already changed.
 *
 * Run on a weekly schedule, never in the pull-request pipeline: a date passing is a reason
 * to look at the rules, not a reason to turn a pull request red on a day nobody pushed.
 * The workflow that calls this (issue #52) only has to read the exit code.
 *
 * Usage: node scripts/check-rules-review.mjs [--today=YYYY-MM-DD]
 * Exit 0 — nothing to do. Exit 1 — something needs review. Exit 2 — could not read the rules.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RULES_DATA = fileURLToPath(new URL('../src/domain/rules-data.ts', import.meta.url));
const MS_PER_DAY = 86_400_000;

function field(source, name, pattern) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`${name} not found in ${RULES_DATA}`);
  return match[1];
}

function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** The JST calendar date, which is the calendar the app resolves rules against (UR-07). */
function todayInJapan() {
  const override = process.argv.find((arg) => arg.startsWith('--today='));
  if (override) return override.slice('--today='.length);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

try {
  const source = readFileSync(RULES_DATA, 'utf8');
  const today = todayInJapan();
  const findings = [];

  const lastReviewed = field(source, 'lastReviewed', /lastReviewed:\s*'(\d{4}-\d{2}-\d{2})'/);
  const maxAgeDays = Number(
    field(source, 'RULES_REVIEW_MAX_AGE_DAYS', /RULES_REVIEW_MAX_AGE_DAYS\s*=\s*(\d+)/),
  );
  const lookaheadDays = Number(
    field(source, 'RULES_PENDING_LOOKAHEAD_DAYS', /RULES_PENDING_LOOKAHEAD_DAYS\s*=\s*(\d+)/),
  );

  const ageDays = daysBetween(lastReviewed, today);
  if (ageDays > maxAgeDays) {
    findings.push(
      `Rules data last reviewed ${lastReviewed}, ${ageDays} days ago (limit ${maxAgeDays}).`,
    );
  }

  // Each row writes effectiveFrom before its status, so the first status after a date is
  // that row's. A pending row that has already taken effect is the worse case of the two:
  // the app is resolving a rate as provisional that is either law or was never passed.
  const rows = source.matchAll(
    /effectiveFrom:\s*(?:'(\d{4}-\d{2}-\d{2})'|\w+)[\s\S]*?status:\s*'([a-z-]+)'/g,
  );
  for (const [, effectiveFrom, status] of rows) {
    if (status !== 'pending-legislation' || !effectiveFrom) continue;
    const daysAway = daysBetween(today, effectiveFrom);
    if (daysAway < 0) {
      findings.push(
        `A pending-legislation rule took effect on ${effectiveFrom}, ${-daysAway} days ago, and is still marked pending. Confirm whether the bill passed.`,
      );
    } else if (daysAway <= lookaheadDays) {
      findings.push(
        `A pending-legislation rule takes effect on ${effectiveFrom}, in ${daysAway} days. Confirm whether the bill passed before it does.`,
      );
    }
  }

  if (findings.length > 0) {
    for (const finding of findings) console.error(finding);
    console.error('Review docs/product/domain-rules.md and src/domain/rules-data.ts.');
    process.exit(1);
  }
  console.log(
    `Rules data reviewed ${lastReviewed}, ${ageDays} days ago (limit ${maxAgeDays}); no pending rule due within ${lookaheadDays} days.`,
  );
} catch (error) {
  console.error(`Could not check the rules review date: ${error.message}`);
  process.exit(2);
}
