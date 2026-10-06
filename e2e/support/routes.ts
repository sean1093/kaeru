/**
 * The routes the end-to-end suite visits, in one place.
 *
 * Three specs grew their own copy of this list — smoke, layout and production — and three
 * lists that must be edited together will diverge. The failure is silent in the worst way:
 * a route simply stops being checked, and nothing goes red to say so. Adding a screen in M2
 * should mean one edit here, not three edits nobody is tracking.
 *
 * Kept as paths rather than imported from `src/app/screens.ts` on purpose: a test that
 * derives its targets from the code it is testing cannot notice that the code lost one.
 */
export interface E2eRoute {
  readonly name: string;
  /** Relative to the Playwright `baseURL`, which already carries the `/kaeru/` base path. */
  readonly path: string;
  /** The chrome this route declares, so a spec can pick one of each kind. */
  readonly chrome: 'tabs' | 'fullscreen' | 'mode';
}

export const E2E_ROUTES: readonly E2eRoute[] = [
  { name: 'home', path: './', chrome: 'tabs' },
  { name: 'settings', path: './#/settings', chrome: 'tabs' },
];

export const E2E_LOCALES = [
  { id: 'zh-TW', testId: 'language-zh-TW' },
  { id: 'en', testId: 'language-en' },
] as const;
