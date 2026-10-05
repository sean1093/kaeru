import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { isChromeOverlapAtOneScrollPosition } from '../a11y-filters.ts';

/**
 * `gallery-dev` project only — see `core.spec.ts` for the full carve-out rationale.
 *
 * M1-3e (#27): one command (`npm run gallery:capture`) produces the evidence a design
 * and accessibility review actually needs, across the conditions that matter and that
 * swapping theme or viewport size alone rarely surfaces: 200 % text, forced
 * `:focus-visible`, and `prefers-reduced-motion: reduce`. Screenshots land in
 * `test-results/screenshots/`, which is gitignored — this is evidence for a PR
 * description and a review thread, not a committed artifact.
 *
 * Non-goal: Storybook. A route this project already knows how to build, test and deploy
 * beats a second toolchain.
 */

const GALLERY_ROOT = '[data-gallery-root]';
const SCREENSHOT_DIR = 'test-results/screenshots';

const LOCALES = ['zh-TW', 'en'] as const;
const THEMES = ['light', 'dark'] as const;
const WIDTHS = [320, 390] as const;
const TEXT_SCALES = [100, 200] as const;

// Observable, not implementation: the actual rendered string/color/size a reviewer would
// see, so a no-op mutation to setLocale/setTheme/setTextScale fails loudly here instead
// of silently producing sixteen captures of the same unchanged page (caught by mutation
// testing, QAEngineer, #128).
const EXPECTED_HEADING: Record<(typeof LOCALES)[number], string> = {
  'zh-TW': 'UI 元件庫',
  en: 'UI kit gallery',
};
const EXPECTED_BG: Record<(typeof THEMES)[number], string> = {
  light: '#faf7f2',
  dark: '#171513',
};

async function setLocale(page: Page, locale: (typeof LOCALES)[number]): Promise<void> {
  await page.getByTestId(`language-${locale}`).click();
  // The gallery's own `<h1>` is a direct child of the gallery root; several AppBar
  // specimens inside it render their own demo `<h1>` ("Receipts"), so an unscoped
  // `getByRole('heading', { level: 1 })` is ambiguous on this page.
  await expect(
    page.locator(`${GALLERY_ROOT} > h1`),
    `heading after requesting ${locale}`,
  ).toHaveText(EXPECTED_HEADING[locale]);
}

async function setTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  await page.evaluate((value) => {
    document.documentElement.setAttribute('data-theme', value);
  }, theme);
  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim(),
  );
  expect(bg, `--color-bg after requesting ${theme} theme`).toBe(EXPECTED_BG[theme]);
}

/**
 * 200 % maps directly to a doubled root font size: every length in this kit is `rem` or a
 * token built from `rem`, so this reproduces what a browser's own text-size setting does
 * without needing a second rendering path.
 */
async function setTextScale(page: Page, percent: (typeof TEXT_SCALES)[number]): Promise<void> {
  const baseline = await page.evaluate(() =>
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  await page.evaluate((value) => {
    document.documentElement.style.fontSize = `${value}%`;
  }, percent);
  const scaled = await page.evaluate(() =>
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  expect(scaled, `root font-size after requesting ${percent}% text scale`).toBeCloseTo(
    baseline * (percent / 100),
    1,
  );
}

/**
 * No arbitrary wait (`test-strategy.md`'s R20: "no arbitrary waitForTimeout, wait for a
 * state, not a duration"). The locale/theme/scale writes above can start a CSS transition
 * (border, background, font-size all have one); waiting for `document.getAnimations()` to
 * drain is the actual state that matters for both the assertions below and the
 * screenshot, which `animations: 'disabled'` alone does not cover — that option only
 * freezes animations for the instant of the screenshot call, not for whatever reads
 * bounding rects or axe runs before it.
 */
async function waitForAnimationsToSettle(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
}

/**
 * Pending #32 (M1-5b hides shell chrome for `fullscreen`/`mode` routes), the app shell's
 * `BottomNav` renders unconditionally today (`src/app/App.tsx`) and is `position:
 * sticky`, so a full-page capture — which scrolls and stitches — paints it a second time
 * at whatever scroll position it last stuck to, across the gallery's own content. This is
 * the same tracked defect `isChromeOverlapAtOneScrollPosition` already filters for axe;
 * neutralizing it here means the matrix photographs the gallery's own content, the thing
 * this issue is actually about, rather than a stale shell artifact #32 will remove. Only
 * chrome outside the gallery root is touched — the gallery's own `BottomNav` specimen,
 * sharing the same `data-testid` by design, is left alone.
 */
async function hideUntrackedShellChrome(page: Page): Promise<void> {
  await page.evaluate((root) => {
    const galleryRoot = document.querySelector(root);
    for (const nav of document.querySelectorAll('[data-testid="bottom-nav"]')) {
      if (!galleryRoot?.contains(nav)) {
        (nav as HTMLElement).style.display = 'none';
      }
    }
  }, GALLERY_ROOT);
}

async function assertGalleryRendered(page: Page): Promise<void> {
  // A capture of an emptied gallery root satisfies every other assertion in this file
  // more easily than a correct one does (no overflow, no overlap, axe clean on nothing).
  // This is the content-presence guard the forced-focus-visible test already has
  // (`expect(count).toBeGreaterThan(0)`), applied to the sixteen capture tests too.
  const sections = await page.locator(`${GALLERY_ROOT} [data-gallery-section]`).count();
  expect(sections, 'gallery root rendered no sections — capture would be blank').toBeGreaterThan(0);
  const specimens = await page.locator(`${GALLERY_ROOT} [data-gallery]`).count();
  expect(specimens, 'gallery root rendered no specimens — capture would be blank').toBeGreaterThan(
    0,
  );
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page
    .locator(GALLERY_ROOT)
    .evaluate((el) => el.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, 'gallery content overflows the viewport horizontally').toBe(false);
}

/**
 * A genuine overlap shows up as two in-flow sibling boxes with intersecting rects, which
 * at 200 % text is where wrapping bugs appear — and they are not confined to inside a
 * single specimen's stage: a specimen's own `<code class="state">` caption can overlap
 * its own stage, and sibling specimens or sibling sections can overlap each other.
 * Recursing from the gallery root itself, through every container at every depth, covers
 * all of that with the same pairwise check applied once per level — section vs section,
 * specimen vs specimen within a section, caption vs stage within a specimen, and (once
 * inside a stage) a component's own internal structure, such as a `BottomNav`'s items or
 * a `List`'s rows.
 *
 * Two kinds of "overlap" are not bugs and are excluded: an `<svg>` icon's internal
 * `path`/`g` elements, which overlap by design (that is how the glyph is drawn, not a
 * layout outcome) — the recursion stops at the `<svg>` boundary and treats it as one
 * leaf box; and an absolutely/fixed-positioned element (a count badge pinned to the
 * corner of its icon, for instance), which is deliberately taken out of flow specifically
 * to sit on top of a sibling.
 */
async function assertNoOverlap(page: Page): Promise<void> {
  const overlaps = await page.locator(GALLERY_ROOT).evaluate((root) => {
    const bad: string[] = [];
    const label = (el: Element): string =>
      `${el.tagName.toLowerCase()}${el.getAttribute('class') ? `.${el.getAttribute('class')}` : ''}`;
    const visit = (container: Element) => {
      const children = [...container.children] as HTMLElement[];
      const inFlow = children.filter((el) => {
        const position = getComputedStyle(el).position;
        return position !== 'absolute' && position !== 'fixed';
      });
      for (let i = 0; i < inFlow.length; i += 1) {
        for (let j = i + 1; j < inFlow.length; j += 1) {
          const elA = inFlow[i];
          const elB = inFlow[j];
          if (!elA || !elB) continue;
          const a = elA.getBoundingClientRect();
          const b = elB.getBoundingClientRect();
          if (a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) continue;
          const intersects =
            a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          if (intersects) {
            bad.push(`${label(elA)} / ${label(elB)}`);
          }
        }
      }
      for (const child of children) {
        if (child.tagName.toLowerCase() !== 'svg') visit(child);
      }
    };
    visit(root);
    return bad;
  });
  expect(overlaps, 'overlapping siblings somewhere in the gallery').toEqual([]);
}

async function assertAxeClean(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(GALLERY_ROOT)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );
  const blocking = [];
  for (const violation of serious) {
    if (!(await isChromeOverlapAtOneScrollPosition(page, violation))) {
      blocking.push(violation);
    }
  }
  expect(blocking, `${label}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
}

test.describe('UI kit gallery capture matrix (#27)', () => {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        for (const textScale of TEXT_SCALES) {
          const name = `${locale}-${theme}-${width}px-${textScale}pct`;

          test(`captures ${name}`, async ({ page }) => {
            await page.setViewportSize({ width, height: 1200 });
            await page.goto('./#/dev/gallery');
            await hideUntrackedShellChrome(page);
            await assertGalleryRendered(page);
            await setLocale(page, locale);
            await setTheme(page, theme);
            await setTextScale(page, textScale);
            await waitForAnimationsToSettle(page);

            await assertNoHorizontalOverflow(page);
            if (textScale === 200) await assertNoOverlap(page);
            await assertAxeClean(page, name);

            await page.screenshot({
              path: `${SCREENSHOT_DIR}/${name}.png`,
              fullPage: true,
              animations: 'disabled',
            });
          });
        }
      }
    }
  }

  test('forced :focus-visible — every interactive control shows a visible ring', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 1200 });
    await page.goto('./#/dev/gallery');

    const controls = page.locator(
      `${GALLERY_ROOT} button, ${GALLERY_ROOT} a[href], ${GALLERY_ROOT} input, ${GALLERY_ROOT} [tabindex="0"]`,
    );
    const count = await controls.count();
    expect(count, 'gallery has no focusable controls to check').toBeGreaterThan(0);

    const unmarked: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const control = controls.nth(i);
      await control.focus();
      const outline = await control.evaluate((el) => getComputedStyle(el).outlineStyle);
      if (outline === 'none') {
        const label = await control.evaluate(
          (el) =>
            el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40) ?? el.tagName,
        );
        unmarked.push(label);
      }
    }
    expect(unmarked, 'controls with no visible focus ring').toEqual([]);

    // One representative screenshot of a forced-focus state for visual review.
    await controls.first().focus();
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/focus-visible-forced.png`,
      fullPage: false,
      animations: 'disabled',
    });
  });

  test('prefers-reduced-motion: reduce collapses every duration token to 1 ms, via the token override only', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 1200 });
    await page.goto('./#/dev/gallery');

    const durations = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        instant: style.getPropertyValue('--duration-instant').trim(),
        fast: style.getPropertyValue('--duration-fast').trim(),
        normal: style.getPropertyValue('--duration-normal').trim(),
        slow: style.getPropertyValue('--duration-slow').trim(),
      };
    });
    for (const [token, value] of Object.entries(durations)) {
      expect(value, `--duration-${token} under reduced motion`).toBe('1ms');
    }

    // The override is global (`*, *::before, *::after`), so any element with a
    // transition or animation must resolve to 1 ms regardless of which token it used —
    // this is the assertion that the override is doing the work, not a component branch.
    // `transitionDuration`/`animationDuration` are comma-separated lists, one entry per
    // transitioned/animated property — reading only the first with a bare `parseFloat`
    // would miss a second property left un-collapsed. The max across all of them is what
    // the user actually experiences.
    const liveDurations = await page.evaluate(() => {
      const longest = (list: string): number =>
        list.length === 0
          ? 0
          : Math.max(...list.split(',').map((part) => Number.parseFloat(part) * 1000));
      const offenders: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('*')) {
        const style = getComputedStyle(el);
        const transition = longest(style.transitionDuration);
        const animation = longest(style.animationDuration);
        if (transition > 1)
          offenders.push(`${el.className || el.tagName}: transition ${transition}ms`);
        if (animation > 1)
          offenders.push(`${el.className || el.tagName}: animation ${animation}ms`);
      }
      return offenders;
    });
    expect(
      liveDurations,
      'elements whose computed duration exceeds 1 ms under reduced motion',
    ).toEqual([]);
  });
});
