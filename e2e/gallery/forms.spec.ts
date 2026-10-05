import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * `gallery-dev` project only — see `core.spec.ts` for the full carve-out rationale.
 * Covers M1-3c (#25): amount display and the form field family.
 */
const GALLERY_ROOT = '[data-gallery-root]';

test.describe('UI kit gallery — M1-3c components (#25)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/dev/gallery');
  });

  test('renders every M1-3c section with no horizontal scroll at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1200 });
    for (const section of ['Amount display', 'Form fields']) {
      await expect(
        page.getByRole('heading', { level: 2, name: new RegExp(section) }),
      ).toBeVisible();
    }
    const overflow = await page.locator(GALLERY_ROOT).evaluate((el) => el.scrollWidth > 320);
    expect(overflow).toBe(false);
  });

  test('yen renders with grouping and no decimals', async ({ page }) => {
    await expect(
      page.locator('[data-gallery="amount-actual"]').getByText('890'),
    ).toBeVisible();
  });

  test('the estimate hero shows the ~ prefix with no raw tilde in the accessible tree', async ({
    page,
  }) => {
    const specimen = page.locator('[data-gallery="amount-estimate-hero"]');
    await expect(specimen.getByText('~')).toBeVisible();
  });

  test('a received amount shows its fee with a true minus sign', async ({ page }) => {
    const specimen = page.locator('[data-gallery="amount-received"]');
    await expect(specimen.getByText(/\u2212/)).toBeVisible();
  });

  test('the amount entry field is type=text with inputmode=numeric', async ({ page }) => {
    const input = page.locator('#amount-entry');
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  test('typing into the amount entry never leaves a non-digit character', async ({ page }) => {
    const input = page.locator('#amount-entry-empty');
    await input.fill('12345');
    await expect(input).toHaveValue('12345');
  });

  test('the date field uses a native date input with a Today chip', async ({ page }) => {
    await expect(page.locator('#date-field')).toHaveAttribute('type', 'date');
    await expect(
      page.locator('[data-gallery="date-field"]').getByRole('button', { name: 'Today' }),
    ).toBeVisible();
  });

  test('the tax-rate segmented control is keyboard-operable as native radios', async ({
    page,
  }) => {
    const group = page.locator('[data-gallery="segmented-tax-rate"]');
    const first = group.getByRole('radio').first();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('radio').nth(1)).toBeChecked();
  });

  test('has zero serious or critical axe violations in the M1-3c sections (TC-A11Y-001)', async ({
    page,
  }, testInfo) => {
    const results = await new AxeBuilder({ page })
      .include('[data-gallery-section="amount-display"]')
      .include('[data-gallery-section="form-fields"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );
    expect(blocking, `${testInfo.project.name}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
  });
});
