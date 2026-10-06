/**
 * S62 — the data screen, and the seeding path the rest of the E2E suite stands on.
 *
 * This spec is doing two jobs. The first is `M2-A3`'s own acceptance: an import describes
 * the file before anything is written, and cancelling writes nothing. The second is that
 * **importing a backup through the product's own button is how every other spec will put
 * data on the device** — the Architect's recommendation on #99 was to seed through the
 * backup v2 document, because it is the one serialisation the app already validates on the
 * way in, so a fixture that drifts from the schema fails at import rather than producing a
 * half-populated screen. That makes this file the thing that proves seeding works at all.
 *
 * Sources: `docs/design/wireframes.md` S62, `docs/qa/test-cases.md` TC-DATA-015..021.
 */
import { readFile } from 'node:fs/promises';
import { expect, type Page, test } from '@playwright/test';
import { backupDocument } from './support/seed.ts';

/** Three receipts on one trip, built by the shared fixture so it cannot drift. */
const aBackup = (receipts: number): string =>
  backupDocument({
    receipts: Array.from({ length: receipts }, (_, index) => ({ id: `receipt-${index + 1}` })),
  });

/**
 * How many receipts are actually on the device, read through the **exporter**.
 *
 * Deliberately a different surface from the import preview's collision count: two
 * independent readings agreeing is what makes "nothing was written" a claim rather than an
 * inference drawn from the one mechanism that could itself be broken.
 */
async function receiptsOnDevice(page: Page): Promise<number> {
  const download = page.waitForEvent('download');
  await page.getByTestId('export-backup').click();
  const path = await (await download).path();
  const text = await readFile(path, 'utf8');
  return (JSON.parse(text) as { receipts: readonly unknown[] }).receipts.length;
}

async function chooseBackup(page: Page, contents: string): Promise<void> {
  await page.getByTestId('import-backup').setInputFiles({
    name: 'kaeru-backup-2026-11-20.json',
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  });
}

test.describe('S62 — your data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/settings/data');
    await expect(page.locator('[data-screen="S62"]')).toHaveCount(1);
  });

  test('TC-DATA-015: photos are off by default and their cost is shown before the choice', async ({
    page,
  }) => {
    await expect(page.getByTestId('include-photos')).not.toBeChecked();
    // DR-042: opt-in, and informed — a checkbox with no size beside it is a guess.
    await expect(page.getByTestId('export-size')).not.toBeEmpty();
  });

  test('TC-DATA-016: an import is described before anything is written, and cancelling writes nothing', async ({
    page,
  }) => {
    await chooseBackup(page, aBackup(3));

    const preview = page.getByTestId('import-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('3');

    await page.getByTestId('cancel-import').click();
    await expect(preview).toBeHidden();

    // Nothing was written, read two independent ways: the device still exports zero
    // receipts, and a second import of the same file sees nothing to collide with.
    expect(await receiptsOnDevice(page)).toBe(0);
    await chooseBackup(page, aBackup(3));
    await expect(page.getByTestId('import-conflicts')).toHaveCount(0);
  });

  test('TC-DATA-017: confirming writes, and the result is reported in the user\u2019s language', async ({
    page,
  }) => {
    await chooseBackup(page, aBackup(3));
    await page.getByTestId('confirm-import').click();

    await expect(page.getByTestId('data-notice')).toContainText('3');
    expect(await receiptsOnDevice(page)).toBe(3);
    // And re-importing the same file collides with itself, which is the same fact read
    // through the other surface.
    await chooseBackup(page, aBackup(3));
    await expect(page.getByTestId('import-conflicts')).toBeVisible();
  });

  test('TC-DATA-020: a file we will not accept gets a sentence, never an exception', async ({
    page,
  }) => {
    await chooseBackup(page, '{ not json');
    await expect(page.getByTestId('data-failure')).not.toBeEmpty();
    await expect(page.getByTestId('import-preview')).toHaveCount(0);
  });

  test('TC-SEC-005: deleting everything takes a second, deliberate step', async ({ page }) => {
    await chooseBackup(page, aBackup(3));
    await page.getByTestId('confirm-import').click();
    await expect(page.getByTestId('data-notice')).toContainText('3');

    await page.getByTestId('delete-all').click();
    const confirm = page.getByTestId('delete-confirm');
    await expect(confirm).toBeVisible();
    // Export sits inside the confirmation, where the decision is actually made.
    await expect(confirm.getByTestId('export-first')).toBeVisible();

    await page.getByTestId('confirm-delete').click();
    await expect(page.getByTestId('data-notice')).not.toBeEmpty();
    // Gone: the same file imports cleanly again, with nothing to collide with.
    await chooseBackup(page, aBackup(3));
    await expect(page.getByTestId('import-conflicts')).toHaveCount(0);
  });

  test('the delete confirmation is inline, not a trap: Tab moves on past it', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'webkit',
      'Safari tabs to buttons only with Full Keyboard Access, an OS setting the test would measure',
    );
    await page.getByTestId('delete-all').click();
    // Settled first: the confirmation takes focus when it appears, and a test that moves
    // focus before then is measuring timing, not the trap.
    await expect(page.locator('#delete-confirm-title')).toBeFocused();
    // The last control in the confirmation. A trap would send Tab back to its first one.
    await page.getByTestId('cancel-delete').focus();
    await page.keyboard.press('Tab');

    const stillInside = await page
      .getByTestId('delete-confirm')
      .evaluate((panel) => panel.contains(document.activeElement));
    expect(stillInside).toBe(false);
  });
});
