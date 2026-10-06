import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * `gallery-dev` project only — see `core.spec.ts` for the carve-out rationale.
 *
 * M1-3d (#26): the sheet's touch gestures, through the browser's real gesture pipeline.
 *
 * The unit suite drives swipe-to-close with synthetic `pointerdown`/`pointerup`, which
 * proves the threshold arithmetic and nothing about a finger. On a touch screen the
 * browser claims a downward drag as a pan unless `touch-action` says otherwise, and a pan
 * ends in `pointercancel`: the handler never sees a `pointerup`, so the sheet stays open.
 * That is what this suite measured before the sheet declared its touch behaviour. CDP's
 * `Input.dispatchTouchEvent` goes through the same gesture detection a finger does, which
 * is why these run in Chromium.
 */

test.use({ hasTouch: true, isMobile: true, viewport: { width: 412, height: 520 } });

/** A finger, not a pointer event: touchstart, ten moves, touchend. */
async function touchDrag(page: Page, from: { x: number; y: number }, dy: number): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  for (let step = 1; step <= 10; step += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x, y: from.y + (dy * step) / 10 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

/**
 * Opens a sheet and waits for it to come to rest. The sheet slides in, and a box measured
 * mid-slide puts the drag where the sheet was rather than where it is.
 */
async function openSheet(page: Page, trigger: string): Promise<Locator> {
  await page.getByRole('button', { name: trigger }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
  return dialog;
}

test.describe('bottom sheet touch gestures (#26)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/dev/gallery');
    await page.locator('[data-gallery-root]').getByTestId('language-en').click();
  });

  test('a downward drag on the sheet header closes it', async ({ page }) => {
    const dialog = await openSheet(page, 'Open the sheet');

    const heading = await dialog.getByRole('heading').boundingBox();
    if (!heading) throw new Error('the sheet rendered no heading to drag');
    await touchDrag(
      page,
      { x: heading.x + heading.width / 2, y: heading.y + heading.height / 2 },
      200,
    );

    await expect(dialog).toBeHidden();
  });

  test('a drag inside a long list scrolls the list and leaves the sheet open', async ({ page }) => {
    const dialog = await openSheet(page, 'Choose a refund company');

    // The precondition the assertion depends on: a list that does not overflow cannot be
    // scrolled, and a drag that "leaves the sheet open" there would prove nothing.
    const scroller = dialog.getByTestId('sheet-content');
    const room = await scroller.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(room, 'the select sheet must overflow at this viewport').toBeGreaterThan(0);

    const box = await scroller.boundingBox();
    if (!box) throw new Error('the sheet content has no box');
    await touchDrag(page, { x: box.x + box.width / 2, y: box.y + box.height - 20 }, -150);

    await expect(dialog).toBeVisible();
    expect(await scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  });
});

/**
 * Focus restore, where `inert` is real. jsdom implements neither `inert` nor its effect on
 * focus, so the unit suite's restore test passes whatever order the sheet tears down in;
 * in a browser, focusing a trigger that is still inside an inert subtree does nothing.
 */
test.describe('bottom sheet focus (#26)', () => {
  for (const [how, close] of [
    ['Escape', (page: Page) => page.keyboard.press('Escape')],
    [
      'the Done button',
      (page: Page) => page.getByRole('dialog').getByRole('button', { name: 'Done' }).click(),
    ],
  ] as const) {
    test(`closing with ${how} returns focus to the trigger, and the page is interactive again`, async ({
      page,
    }) => {
      await page.goto('./#/dev/gallery');
      await page.locator('[data-gallery-root]').getByTestId('language-en').click();
      const trigger = page.getByRole('button', { name: 'Open the sheet' });
      await trigger.focus();
      await trigger.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();

      await close(page);

      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(await page.locator('[inert]').count(), 'nothing is left inert').toBe(0);
    });
  }

  /**
   * The sheet must hold focus from the moment it is in the document. Taking it after paint
   * leaves a frame with the sheet on screen, focus on the trigger and the page not yet
   * inert, in which an Escape goes nowhere — real, but a test that presses Escape "soon"
   * catches it only sometimes. This observes the property directly instead: the observer's
   * callback is delivered after the render that inserted the dialog, and focus is either
   * inside the dialog by then or it is not.
   */
  test('the sheet holds focus from the moment it is in the document', async ({ page }) => {
    await page.goto('./#/dev/gallery');
    const trigger = page.getByRole('button', { name: 'Open the sheet' });
    await trigger.focus();
    await page.evaluate(() => {
      const observer = new MutationObserver(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return;
        observer.disconnect();
        document.body.dataset.focusOnArrival = String(dialog.contains(document.activeElement));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    await trigger.press('Enter');

    await expect(page.locator('body')).toHaveAttribute('data-focus-on-arrival', 'true');
  });
});
