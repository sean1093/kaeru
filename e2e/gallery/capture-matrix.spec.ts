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

async function setLocale(page: Page, locale: (typeof LOCALES)[number]): Promise<void> {
  await page.getByTestId(`language-${locale}`).click();
}

async function setTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  await page.evaluate((value) => {
    document.documentElement.setAttribute('data-theme', value);
  }, theme);
}

/**
 * 200 % maps directly to a doubled root font size: every length in this kit is `rem` or a
 * token built from `rem`, so this reproduces what a browser's own text-size setting does
 * without needing a second rendering path.
 */
async function setTextScale(page: Page, percent: (typeof TEXT_SCALES)[number]): Promise<void> {
  await page.evaluate((value) => {
    document.documentElement.style.fontSize = `${value}%`;
  }, percent);
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page
    .locator(GALLERY_ROOT)
    .evaluate((el) => el.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, 'gallery content overflows the viewport horizontally').toBe(false);
}

async function assertNoOverlap(page: Page): Promise<void> {
  // Every specimen's stage is a flex column; a genuine overlap shows up as two sibling
  // boxes with intersecting rects, which at 200 % text is where wrapping bugs appear.
  const overlaps = await page.locator(GALLERY_ROOT).evaluate((root) => {
    const stages = [...root.querySelectorAll<HTMLElement>('[class*="stage"]')];
    const bad: string[] = [];
    for (const stage of stages) {
      const children = [...stage.children] as HTMLElement[];
      for (let i = 0; i < children.length; i += 1) {
        for (let j = i + 1; j < children.length; j += 1) {
          const a = children[i]?.getBoundingClientRect();
          const b = children[j]?.getBoundingClientRect();
          if (!a || !b) continue;
          const intersects =
            a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          if (intersects) bad.push(`${children[i]?.className} / ${children[j]?.className}`);
        }
      }
    }
    return bad;
  });
  expect(overlaps, 'overlapping siblings inside a specimen stage').toEqual([]);
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
            await setLocale(page, locale);
            await setTheme(page, theme);
            await setTextScale(page, textScale);
            // One frame for layout to settle after the font-size and theme writes above.
            await page.waitForTimeout(50);

            await assertNoHorizontalOverflow(page);
            if (textScale === 200) await assertNoOverlap(page);
            await assertAxeClean(page, name);

            await page.screenshot({
              path: `${SCREENSHOT_DIR}/${name}.png`,
              fullPage: true,
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
    const liveDurations = await page.evaluate(() => {
      const offenders: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('*')) {
        const style = getComputedStyle(el);
        const transition = Number.parseFloat(style.transitionDuration || '0s') * 1000;
        const animation = Number.parseFloat(style.animationDuration || '0s') * 1000;
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
