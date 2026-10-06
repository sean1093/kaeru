import type { Page } from '@playwright/test';
import type { Result } from 'axe-core';

/**
 * Shared between `smoke.spec.ts` and `gallery/core.spec.ts`: one definition of "this node
 * is inside the persistent chrome" rather than two spellings that drift (`src/app/**`,
 * Architect; lifted into this shared module per #98).
 *
 * axe evaluates a page at whatever scroll offset it finds it in, so a persistent bottom
 * bar makes `target-size` report every control beneath it as obscured. That report is
 * true about the moment it was taken and says nothing about whether the control is
 * operable, which is what SC 2.5.8 is about.
 *
 * This filter exists only because something stronger replaces it. TC-A11Y-017 — "every
 * interactive control can be brought clear of the persistent navigation" in
 * `smoke.spec.ts`, specified in `docs/qa/test-cases.md` and reasoned through in PR #91 —
 * asserts operability over every control on the route rather than the ones visible at one
 * offset, and it still fails the build when a control genuinely cannot be cleared. Delete
 * that test and this filter loses its justification; they are meant to fail together.
 *
 * And the replacement has been watched failing, which is what makes it one: with
 * `scroll-padding-block-end` removed from the scrolling root, TC-A11Y-017 names the controls
 * the bar obscures — on #143, the three theme options and two backup buttons on Settings, in
 * every project. Its first version could not fail at all: it scrolled each control to the
 * *centre* of the viewport, clear of a bottom bar by definition, so it proved that
 * `scrollIntoView` centres things. Nor can any version fail while the bar is not pinned,
 * which is why `chrome.spec.ts` asserts the pinning itself (#150). A compensating control is
 * not a control until it has been watched failing (#141).
 *
 * Deliberately narrow: only `target-size`, and only when every node blamed for the
 * obstruction resolves to an element inside the navigation. Anything else covering a
 * control is a real finding and still fails the build.
 *
 * It asks the DOM rather than reading axe's selector text. The first version of this
 * matched `selector.includes('bottom-nav')` and silently matched nothing: axe generates
 * whatever selector it finds shortest, which for these nodes is `a[data-testid="nav-home"]`
 * and `a[href$="#/settings"]`, and it changed strategy the moment `aria-current` appeared.
 * The selector string is an implementation detail axe never promised; "is this element
 * inside the nav" is a question only the document can answer.
 */
export function nodesBlamedForObstruction(violation: Result): readonly string[] {
  const related = violation.nodes.flatMap((node) =>
    [...node.all, ...node.any, ...node.none].flatMap((check) => check.relatedNodes ?? []),
  );
  // `target` is one selector per frame; these pages have no cross-frame content, so the
  // last entry is the one that resolves in the main document.
  return related.map((node) => {
    const last = (node.target as unknown as (string | readonly string[])[]).at(-1);
    return Array.isArray(last) ? (last.at(-1) ?? '') : ((last as string) ?? '');
  });
}

export async function isChromeOverlapAtOneScrollPosition(
  page: Page,
  violation: Result,
): Promise<boolean> {
  if (violation.id !== 'target-size') return false;
  const selectors = nodesBlamedForObstruction(violation);
  if (selectors.length === 0) return false;
  return page.evaluate(
    (list) =>
      list.every(
        (selector) =>
          document.querySelector(selector)?.closest('[data-testid="bottom-nav"]') != null,
      ),
    selectors as string[],
  );
}
