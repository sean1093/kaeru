#!/usr/bin/env node
/**
 * Reads the production smoke's JSON report and decides what, if anything, to file.
 *
 * Two jobs, both of which a plain exit code cannot do:
 *
 *   1. **Refuse a green run that ran nothing.** A suite that matched zero tests exits 0 in
 *      most runners, which is how a misconfigured filter becomes a permanently passing
 *      smoke that is checking nothing at all.
 *   2. **Classify the failure.** `@content` failures are true of the build regardless of
 *      who serves it — the shell did not render, a locale is missing, the worker's scope is
 *      wrong, axe found something serious, a third-party request appeared — and are `S1`.
 *      `@infra` failures are a non-2xx, a connection failure or a timeout against a CDN we
 *      do not control, and are `S2` after the retry the config already performs.
 *
 * Writes `severity`, `failed` and `summary` to `$GITHUB_OUTPUT` when present, so the
 * workflow can file an issue without re-parsing anything.
 *
 * Usage: node scripts/check-smoke-report.mjs <report.json>
 * Exit 0 — the smoke passed. Exit 1 — it failed, or it ran nothing.
 */
import { appendFileSync, readFileSync } from 'node:fs';

const reportPath = process.argv[2];
if (!reportPath) {
  console.error('Usage: node scripts/check-smoke-report.mjs <report.json>');
  process.exit(1);
}

function emit(outputs) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  for (const [key, value] of Object.entries(outputs)) {
    // Heredoc form, because the summary is multi-line: it carries one line per failed test.
    appendFileSync(file, `${key}<<KAERU_EOF\n${value}\nKAERU_EOF\n`);
  }
}

/** Playwright nests suites; every spec in the tree is one test title with a result. */
function collectSpecs(suite, trail = []) {
  const title = [...trail, suite.title].filter(Boolean);
  const specs = (suite.specs ?? []).map((spec) => ({
    title: [...title, spec.title].join(' > '),
    ok: spec.ok === true,
  }));
  const nested = (suite.suites ?? []).flatMap((child) => collectSpecs(child, title));
  return [...specs, ...nested];
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (error) {
  console.error(`Could not read the smoke report at ${reportPath}: ${error.message}`);
  // No report at all means the run died before writing one — an infrastructure failure by
  // definition, and never something to treat as a pass.
  emit({ severity: 'S2', failed: 'true', summary: `No smoke report at ${reportPath}.` });
  process.exit(1);
}

const specs = (report.suites ?? []).flatMap((suite) => collectSpecs(suite));

if (specs.length === 0) {
  console.error('The production smoke ran zero tests. A smoke that checks nothing is not a pass.');
  emit({ severity: 'S2', failed: 'true', summary: 'The production smoke ran zero tests.' });
  process.exit(1);
}

const failures = specs.filter((spec) => !spec.ok);
if (failures.length === 0) {
  console.log(`Production smoke green: ${specs.length} checks passed.`);
  emit({ severity: '', failed: 'false', summary: `${specs.length} checks passed.` });
  process.exit(0);
}

// A single content failure outranks any number of infrastructure ones: it is a statement
// about the build, which a different CDN would not fix.
const severity = failures.some((spec) => spec.title.includes('@content')) ? 'S1' : 'S2';
const summary = failures.map((spec) => `- ${spec.title}`).join('\n');
console.error(`Production smoke failed (${severity}):\n${summary}`);
emit({ severity, failed: 'true', summary });
process.exit(1);
