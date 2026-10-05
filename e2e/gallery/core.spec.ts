import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * `gallery-dev` project only (`playwright.config.ts`). Component conformance against the
 * dev server; NOT evidence for any accessibility claim about a real screen — see the
 * carve-out recorded in `docs/qa/test-strategy.md` section 3 and in the project comment.
 *
 * Scope: `[data-gallery-root]`, the gallery's own content, not the surrounding app
 * chrome. The route is rendered through the current M0 shell scaffold (`src/app/**`),
 * which M1-5 (#31–#33) is actively replacing, and that scaffold has its own latent
 * issues (reported separately) unrelated to the M1-3 components under test here.
 */
const GALLERY_ROOT = '[data-gallery-root]';

test.describe('UI kit gallery — M1-3a components (#23)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/dev/gallery');
  });

  test('renders every M1-3a section with no horizontal scroll at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1200 });
    await expect(page.getByRole('heading', { level: 1, name: 'UI kit gallery' })).toBeVisible();
    for (const section of ['App bar', 'Buttons', 'Cards', 'List rows', 'Status chips']) {
      await expect(
        page.getByRole('heading', { level: 2, name: new RegExp(section) }),
      ).toBeVisible();
    }
    const overflow = await page.locator(GALLERY_ROOT).evaluate((el) => el.scrollWidth > 320);
    expect(overflow).toBe(false);
  });

  test('renders in Traditional Chinese with no raw i18n key visible', async ({ page }) => {
    await page.getByTestId('language-zh-TW').click();
    await expect(page.getByRole('heading', { level: 1, name: 'UI 元件庫' })).toBeVisible();
    await expect(page.getByText(/^gallery\./)).toHaveCount(0);
  });

  test('every interactive specimen is reachable by keyboard with a visible focus ring', async ({
    page,
  }) => {
    const firstButton = page.getByRole('button', { name: 'Save' });
    await firstButton.focus();
    await expect(firstButton).toBeFocused();
    const outline = await firstButton.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('an inactive button stays in the tab order and exposes aria-disabled', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Next step' }).last();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await button.focus();
    await expect(button).toBeFocused();
  });

  test('has zero serious or critical axe violations within the gallery content (TC-A11Y-001)', async ({
    page,
  }, testInfo) => {
    const results = await new AxeBuilder({ page })
      .include(GALLERY_ROOT)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    /**
     * `target-size` findings whose only related node is a link inside the M0 shell
     * scaffold's persistent nav (`src/app/BottomNav.tsx`, which marks each tab
     * `data-testid="nav-<feature id>"`) are known, reported to the Architect and routed
     * into #32's acceptance criteria: a `position: sticky` element with no reserved
     * content height or stacking isolation floats over whatever specimen renders in its
     * footprint on a page this tall. That is a real defect, just not one `src/ui/**` or
     * this gallery can fix — `.exclude()` does not suppress it, because axe still checks
     * a kept node's proximity against an excluded one. The rules stay enabled and active
     * for every other node, so a new target-size regression inside M1-3a's own
     * components still fails this test.
     */
    const isTrackedShellOverlap = (violation: (typeof results.violations)[number]) =>
      violation.id === 'target-size' &&
      violation.nodes.every((node) => {
        const checks = node.all.concat(node.any, node.none);
        return (
          checks.length > 0 &&
          checks.every((check) => {
            const related = check.relatedNodes ?? [];
            return (
              related.length > 0 &&
              related.every((node_) =>
                node_.target.some(
                  (selector) => typeof selector === 'string' && /data-testid="nav-/.test(selector),
                ),
              )
            );
          })
        );
      });

    const blocking = results.violations
      .filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
      .filter((violation) => !isTrackedShellOverlap(violation));

    expect(blocking, `${testInfo.project.name}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
  });
});
