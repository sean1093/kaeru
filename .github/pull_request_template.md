## Summary

<!-- What changed and why, in two or three sentences. -->

## Linked issue

Closes #

## Type

<!-- Pick one. -->

- [ ] feat — user-facing feature
- [ ] fix — bug fix
- [ ] docs — documentation
- [ ] test — tests only
- [ ] refactor — no behavior change
- [ ] chore / infra — tooling, CI, dependencies

## How verified

<!-- Commands run and what you observed. "CI is green" alone is not a verification. -->

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test` (unit + component)
- [ ] `npm run e2e`
- [ ] Manual check: <!-- device, browser, locale, online/offline -->

Notes:

## Screenshots

<!-- Required for any UI change: the same screen in both languages, phone-sized viewport. -->

| zh-TW | en |
|---|---|
| <!-- image --> | <!-- image --> |

## Offline behavior

<!-- How this behaves with no network, or "not applicable" with a reason. Silence is not an answer. -->

## Checklist

- [ ] Tests added or updated at the right level; a bug fix includes a test that fails without the fix
- [ ] New numeric or date rules have boundary tests on both sides of the boundary
- [ ] Test titles carry their `TC-` id and the covered requirement (`DR-xxx` / `UJ-xxx`) is referenced
- [ ] Works in **zh-TW and en** — no missing strings, no raw keys, no truncation or overflow
- [ ] Accessibility checked: keyboard reachable, visible focus, accessible names, axe clean (no serious/critical)
- [ ] No console errors or unhandled rejections in the happy path
- [ ] No new third-party network request; no new persisted personal data
- [ ] Docs updated (rules, architecture, ADR, QA) when behavior changed
- [ ] CI green; no new flaky test introduced

## Review

<!-- Reviewer: a different role. Start your review comment with your role tag, e.g. **[QA]**.
End an approval with LGTM. Feature PRs also need QA verification. -->
