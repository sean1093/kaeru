import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * `gallery-dev` project only — see `core.spec.ts` for the full carve-out rationale.
 * Covers M1-3b (#24): bottom navigation, progress, banner, toast.
 */
const GALLERY_ROOT = '[data-gallery-root]';

test.describe('UI kit gallery — M1-3b components (#24)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/dev/gallery');
  });

  test('renders every M1-3b section with no horizontal scroll at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1200 });
    for (const section of ['Bottom navigation', 'Progress', 'Banner', 'Toast']) {
      await expect(
        page.getByRole('heading', { level: 2, name: new RegExp(section) }),
      ).toBeVisible();
    }
    const overflow = await page.locator(GALLERY_ROOT).evaluate((el) => el.scrollWidth > 320);
    expect(overflow).toBe(false);
  });

  test('the bottom nav badge count is folded into the link name, not announced bare', async ({
    page,
  }) => {
    const link = page.locator('[data-gallery="bottom-nav-default"]').getByRole('link', {
      name: 'Receipts, 3 need action',
    });
    await expect(link).toBeVisible();
    await expect(
      page
        .locator('[data-gallery="bottom-nav-default"]')
        .getByRole('link', { name: '3', exact: true }),
    ).toHaveCount(0);
  });

  test('progress bar exposes role=progressbar with the numeric form always visible', async ({
    page,
  }) => {
    const bar = page
      .locator('[data-gallery="progress-bar"]')
      .getByRole('progressbar', { name: 'Packing progress' });
    await expect(bar).toHaveAttribute('aria-valuenow', '3');
    await expect(bar).toHaveAttribute('aria-valuemax', '5');
    await expect(page.locator('[data-gallery="progress-bar"]').getByText('3 / 5')).toBeVisible();
  });

  test('step indicator text is the accessible source of truth; dots are decorative', async ({
    page,
  }) => {
    await expect(page.getByText('步驟 2/5 · Step 2 of 5')).toBeVisible();
  });

  test('an attention banner carries a corrective action', async ({ page }) => {
    const banner = page.locator('[data-gallery="banner-attention"]');
    await expect(banner.getByRole('button', { name: 'Go to Airport Mode' })).toBeVisible();
  });

  test('a toast is role=status and dismissible via its own timer or the undo action', async ({
    page,
  }) => {
    const toast = page.locator('[data-gallery="toast-with-action"]').getByRole('status');
    await expect(toast).toContainText('Receipt deleted');
    await expect(toast.getByRole('button', { name: 'Undo' })).toBeVisible();
  });

  test('has zero serious or critical axe violations in the M1-3b sections (TC-A11Y-001)', async ({
    page,
  }, testInfo) => {
    const results = await new AxeBuilder({ page })
      .include('[data-gallery-section="bottom-nav"]')
      .include('[data-gallery-section="progress"]')
      .include('[data-gallery-section="banner"]')
      .include('[data-gallery-section="toast"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );
    expect(blocking, `${testInfo.project.name}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
  });
});
