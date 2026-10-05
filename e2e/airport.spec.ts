/**
 * Airport Mode — the executable form of the TC-AIR acceptance (M2-D, #48 to #51).
 *
 * Written before the screens, deliberately. Airport Mode is the one flow where a mistake
 * costs a traveler real money, and the behaviours below are the ones the wireframes and
 * `domain-rules.md` §5 fix in advance: customs before bag drop, all-or-nothing per
 * receipt, consumed goods to the counter, and the whole sequence working with the radio
 * off. Writing them now means the screens are built against the acceptance rather than
 * the acceptance being written to match whatever the screens turned out to do.
 *
 * Every case is `fixme` until the screen it exercises exists. Each one names the issue
 * that enables it, so turning a case on is part of that issue's work and an unturned case
 * is visible in the report rather than silently absent.
 *
 * Sources: `docs/qa/test-cases.md` TC-AIR ids, `docs/design/wireframes.md` §5 (S30-S39,
 * including the microcopy table), `docs/design/information-architecture.md` §3.1 (S34 and
 * S35 are states of S33's route, so `data-screen` is what distinguishes them, not the URL).
 */
import { expect, type Page, test } from '@playwright/test';

/** Installs the worker and reloads once so it controls the page (ADR 0007). */
async function activateServiceWorker(page: Page): Promise<void> {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register(`${new URL('sw.js', document.baseURI)}`, {
      scope: new URL('./', document.baseURI).pathname,
    });
    await navigator.serviceWorker.ready;
  });
  await page.reload();
}

/** The screen id a route is actually rendering, which is not always the route's own. */
async function currentScreen(page: Page): Promise<string | null> {
  return page.locator('[data-screen]').first().getAttribute('data-screen');
}

test.describe('Airport Mode — entry and readiness (S30, S39)', () => {
  test.fixme(true, 'Enabled by #48 (M2-D1): mode entry, readiness and the something-wrong hatch.');

  test('TC-AIR-003 (entry): S30 states the governing rule before the start button', async ({
    page,
  }) => {
    await page.goto('./#/airport');
    expect(await currentScreen(page)).toBe('S30');
    // The rule the whole mode exists to enforce, stated once, before anything else.
    await expect(
      page.getByText(/先過海關，再託運行李|Customs first, bag drop second/),
    ).toBeVisible();
  });

  test('TC-AIR-009: S30 lists blockers with their counts before offering Start', async ({
    page,
  }) => {
    await page.goto('./#/airport');
    const blockers = page.getByTestId('airport-blockers');
    await expect(blockers).toBeVisible();
    // Each blocker names how many receipts it covers; a bare "something is wrong" is not
    // actionable in a queue (wireframes S30, "5 receipts: goods in checked bags").
    await expect(blockers.getByRole('listitem').first()).toContainText(/\d/);
  });

  test('DR-079: nothing to do is said plainly, never shown as an empty list', async ({ page }) => {
    await page.goto('./#/airport');
    // With no claimable receipts the mode must say so rather than render an empty
    // checklist that looks like a loading failure.
    await expect(page.getByTestId('airport-nothing-to-do')).toBeVisible();
  });

  test('TC-AIR-019: the countdown is absent, not zero, when the trip has no flight time', async ({
    page,
  }) => {
    await page.goto('./#/airport');
    await expect(page.getByTestId('airport-countdown')).toHaveCount(0);
  });

  test('S39 is reachable from the start screen and offers all six branches', async ({ page }) => {
    await page.goto('./#/airport');
    await page.getByRole('link', { name: /遇到問題|Something is wrong/ }).click();
    expect(await currentScreen(page)).toBe('S39');
    await expect(page.getByRole('link')).toHaveCount(6);
  });
});

test.describe('Airport Mode — step 1, the hard gate (S31)', () => {
  test.fixme(true, 'Enabled by #49 (M2-D2): gather goods, the advance gate and the banner.');

  test('TC-AIR-009: advancing with an unresolved receipt explains instead of greying out', async ({
    page,
  }) => {
    await page.goto('./#/airport/goods');
    expect(await currentScreen(page)).toBe('S31');
    const next = page.getByRole('button', { name: /都帶了，下一步|Next/ });
    // Friction, never a cage: the button stays enabled and names the count (IA flow F).
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText(/還有 \d+ 張沒確認|\d+ receipts still unresolved/)).toBeVisible();
    // It did not advance.
    expect(await currentScreen(page)).toBe('S31');
  });

  test('TC-AIR-009: a receipt still marked checked-bag carries its own row warning', async ({
    page,
  }) => {
    await page.goto('./#/airport/goods');
    await expect(page.getByText(/標記為託運|marked as checked/).first()).toBeVisible();
  });

  test('TC-AIR-012: two travelers get independent lists and independent progress', async ({
    page,
  }) => {
    await page.goto('./#/airport/goods');
    const groups = page.getByRole('group');
    await expect(groups).toHaveCount(2);
    // Ticking everything for one traveler must not complete the other (DR-004).
    const first = groups.first();
    for (const box of await first.getByRole('checkbox').all()) await box.check();
    await expect(first.getByRole('progressbar')).toHaveAttribute('aria-valuenow', /.+/);
    await expect(groups.nth(1).getByRole('checkbox').first()).not.toBeChecked();
  });

  test('TC-AIR-016: a consumed-goods receipt is excluded here and points at S36', async ({
    page,
  }) => {
    await page.goto('./#/airport/goods');
    // It must not appear as a tickable row — the kiosk is the wrong place for it (DR-035).
    const pointer = page.getByTestId('airport-used-goods-pointer');
    await expect(pointer).toBeVisible();
    await pointer.click();
    expect(await currentScreen(page)).toBe('S36');
  });

  test('TC-AIR-017: an old-system receipt never appears in the checklist', async ({ page }) => {
    await page.goto('./#/airport/goods');
    await expect(page.getByText(/2026-10-30|10\/30/)).toHaveCount(0);
  });

  test('TC-AIR-010: the do-not-check-bags banner is present and not dismissible', async ({
    page,
  }) => {
    await page.goto('./#/airport/goods');
    const banner = page.getByTestId('shell-banner');
    await expect(banner).toContainText(/還不要託運行李|Do not check your bags yet/);
    await expect(banner.getByRole('button', { name: /關閉|Dismiss|Close/ })).toHaveCount(0);
  });
});

test.describe('Airport Mode — landside, the terminal and its results (S32-S36)', () => {
  test.fixme(true, 'Enabled by #50 (M2-D3): landside, the terminal, green, red and used goods.');

  test('S32 states landside-before-security and names the final departure airport', async ({
    page,
  }) => {
    await page.goto('./#/airport/terminal');
    expect(await currentScreen(page)).toBe('S32');
    await expect(page.getByText(/還沒過安檢|before check-in and before security/)).toBeVisible();
    // DR-037: for a connecting itinerary this is the last airport, not the first.
    await expect(
      page.getByText(/你這趟從這裡離開日本|This is where you leave Japan/),
    ).toBeVisible();
  });

  test('DR-033: the Visit Japan Web alternative carries its constraint, never bare', async ({
    page,
  }) => {
    await page.goto('./#/airport/terminal');
    const vjw = page.getByText(/Visit Japan Web/);
    if ((await vjw.count()) > 0) {
      await expect(page.getByText(/Wi-Fi 區域|Wi-Fi area/)).toBeVisible();
    }
  });

  test('TC-AIR-015: red is a routing decision, with no error styling and no probability', async ({
    page,
  }) => {
    await page.goto('./#/airport/kiosk');
    expect(await currentScreen(page)).toBe('S33');
    await page.getByRole('button', { name: /紅燈|Red/ }).click();
    expect(await currentScreen(page)).toBe('S35');
    // The reassurance comes first, before the instructions (UJ-029, wireframes S35).
    await expect(
      page.getByText(/這不是出錯|This is not an error and you are not in trouble/),
    ).toBeVisible();
    // UR-04: never state or imply an inspection probability.
    await expect(page.getByText(/%/)).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('DR-030: the red screen restates the per-receipt, all-or-nothing rule once', async ({
    page,
  }) => {
    await page.goto('./#/airport/kiosk');
    await page.getByRole('button', { name: /紅燈|Red/ }).click();
    await expect(page.getByText(/一張收據為單位|Inspection is per receipt/)).toHaveCount(1);
  });

  test('TC-AIR-014: green marks that traveler done and the banner stays', async ({ page }) => {
    await page.goto('./#/airport/kiosk');
    await page.getByRole('button', { name: /綠燈|Green/ }).click();
    expect(await currentScreen(page)).toBe('S34');
    // UJ-031: the gate is released at step 4, never here.
    await expect(page.getByTestId('shell-banner')).toContainText(
      /還不要託運行李|Do not check your bags yet/,
    );
  });

  test('the reported result is persisted before the step content changes', async ({ page }) => {
    await page.goto('./#/airport/kiosk');
    await page.getByRole('button', { name: /紅燈|Red/ }).click();
    expect(await currentScreen(page)).toBe('S35');
    // The walk to an inspection desk is the longest the app is out of sight anywhere in
    // the journey. A resume that re-offers two buttons with Green as the primary lets
    // someone who got red mark a traveler customs_confirmed by tapping the obvious one.
    await page.reload();
    expect(await currentScreen(page)).toBe('S35');
    await expect(page.getByTestId('red-self-check')).toBeVisible();
  });

  test('TC-AIR-016: S36 gives the official instruction — the desk, not the terminal', async ({
    page,
  }) => {
    await page.goto('./#/airport/used-goods');
    expect(await currentScreen(page)).toBe('S36');
    await expect(
      page.getByText(/不要使用免稅手續機台|Do not use the tax-free terminal/),
    ).toBeVisible();
    await expect(page.getByText(/海關人員櫃檯|customs officer at the desk/)).toBeVisible();
  });
});

test.describe('Airport Mode — customs done and what happens next (S37, S38)', () => {
  test.fixme(true, 'Enabled by #51 (M2-D4): customs done, what happens next, something is wrong.');

  test('TC-AIR-010: the banner clears only at S37, after every traveler is done', async ({
    page,
  }) => {
    await page.goto('./#/airport/done');
    expect(await currentScreen(page)).toBe('S37');
    await expect(page.getByTestId('shell-banner')).toHaveCount(0);
    await expect(
      page.getByText(/現在可以去報到|Now you can check in and drop your bags/),
    ).toBeVisible();
  });

  test('TC-AIR-011: an incomplete traveler is named rather than silently allowed', async ({
    page,
  }) => {
    await page.goto('./#/airport/done');
    // S37's quiet escape hatch exists precisely so the release is never reached by
    // accident with someone unfinished (wireframes S37).
    await expect(
      page.getByRole('link', { name: /還有一位旅客沒做|Someone is left/ }),
    ).toBeVisible();
  });

  test('DR-036 and DR-039: S38 says who pays and that there is no legal time limit', async ({
    page,
  }) => {
    await page.goto('./#/airport/next');
    expect(await currentScreen(page)).toBe('S38');
    await expect(page.getByText(/不是日本政府|not the government/)).toBeVisible();
    await expect(page.getByText(/沒有法定時間|no legal time limit/)).toBeVisible();
  });

  test('TC-AIR-019: the out-of-time branch states the trade-off and never decides', async ({
    page,
  }) => {
    await page.goto('./#/airport/wrong/out-of-time');
    await expect(
      page.getByText(/中途放棄檢查就等於沒有確認|counts as no confirmation/),
    ).toBeVisible();
    await expect(page.getByText(/沒有人賠|Nobody compensates/)).toBeVisible();
    // Biggest-first, so the user can see what a decision costs (UJ-032).
    await expect(page.getByTestId('out-of-time-receipts')).toBeVisible();
  });
});

test.describe('Airport Mode — offline (TC-AIR-001 to TC-AIR-003)', () => {
  test.fixme(true, 'Enabled by #48 to #51: the whole sequence, with the radio off.');

  test('TC-AIR-002: a deep link into Airport Mode resolves offline from cache', async ({
    page,
    context,
  }) => {
    await activateServiceWorker(page);
    await context.setOffline(true);
    await page.goto('./#/airport');
    expect(await currentScreen(page)).toBe('S30');
  });

  test('TC-AIR-003: the whole sequence completes offline and survives a reload', async ({
    page,
    context,
  }) => {
    await activateServiceWorker(page);
    await context.setOffline(true);
    await page.goto('./#/airport');
    await page.getByRole('button', { name: /開始|Start/ }).click();
    expect(await currentScreen(page)).toBe('S31');
    // Progress is persisted after every interaction, so a backgrounded app resumes where
    // it was rather than at the start (components.md §9).
    await page.reload();
    expect(await currentScreen(page)).toBe('S31');
  });

  test('no network request is attempted on any Airport Mode screen', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (!request.url().includes('/kaeru/')) external.push(request.url());
    });
    for (const path of ['./#/airport', './#/airport/goods', './#/airport/terminal']) {
      await page.goto(path);
    }
    expect(external).toEqual([]);
  });
});
