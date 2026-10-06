/**
 * M2-A — onboarding, settings and the guide, written before the screens.
 *
 * Every case is `fixme` until the screen it exercises exists, and each names the issue
 * that turns it on, so enabling a case is part of that issue's work and an unturned case
 * is visible in the report rather than silently absent. Same shape as `airport.spec.ts`
 * (#99), and for the same reason: the screens then get built against the acceptance
 * instead of the acceptance being written to match whatever the screens turned out to do.
 *
 * S62 is **not** here — it exists, and its cases run for real in `data.spec.ts`.
 *
 * Sources: `docs/design/wireframes.md` sections 1 (S01-S05), 7 (S50-S54) and 9 (S60-S63),
 * including the bilingual microcopy tables; `docs/design/information-architecture.md`
 * section 3.1 for which screen ids are states rather than routes.
 */
import { expect, type Page, test } from '@playwright/test';
import { seedDevice } from './support/seed.ts';

/** The screen id a route is actually rendering, which is not always the route's own. */
async function currentScreen(page: Page): Promise<string | null> {
  const marked = page.locator('[data-screen]');
  await expect(marked).toHaveCount(1);
  return marked.getAttribute('data-screen');
}

test.describe('First run — welcome and the explainer (S01, S05)', () => {
  test.fixme(true, 'Enabled by #34 (M2-A1): welcome, explainer, trip setup, travellers, ready.');

  test('S01 leads with what changed, not with a sign-up', async ({ page }) => {
    await page.goto('./');
    expect(await currentScreen(page)).toBe('S01');
    // The one fact that reframes everything else: you pay full price and get it back after
    // customs, which is not how the old system worked (DR-001).
    await expect(page.getByText(/你先付含稅價|You pay the full price first/)).toBeVisible();
    // DR-040, and the reason a traveller can trust the rest: no account, no server.
    await expect(page.getByText(/資料只存在這支手機|Your data stays on this phone/)).toBeVisible();
  });

  test('S01 offers the explainer and a way straight past it', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('link', { name: /60 秒看懂新制|How it works/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /直接設定行程|Set up my trip/ })).toBeVisible();
  });

  test('S05 puts customs-before-bag-drop in the first three steps', async ({ page }) => {
    await page.goto('./#/welcome/explainer');
    expect(await currentScreen(page)).toBe('S05');
    await expect(page.getByText(/海關要在託運之前|Customs comes before bag drop/)).toBeVisible();
    // UJ-026: the sentence the whole product exists for.
    await expect(
      page.getByText(/行李託運後就拿不回來|You cannot get a checked bag back/),
    ).toBeVisible();
  });

  test('S05 is skippable at every step, because the trip is the point', async ({ page }) => {
    await page.goto('./#/welcome/explainer');
    await page.getByRole('link', { name: /跳過|Skip/ }).click();
    expect(await currentScreen(page)).toBe('S02');
  });
});

test.describe('First run — the trip (S02, S03, S04)', () => {
  test.fixme(true, 'Enabled by #34 (M2-A1).');

  test('S02 requires only the departure date', async ({ page }) => {
    await page.goto('./#/welcome/trip');
    expect(await currentScreen(page)).toBe('S02');
    await page.getByLabel(/出境日期|Departure date/).fill('2026-11-20');
    await expect(page.getByRole('button', { name: /下一步|Next/ })).toBeEnabled();
  });

  test('S02 explains that the procedure happens at the final airport out of Japan', async ({
    page,
  }) => {
    // DR-037, load-bearing for a connecting itinerary and invisible for everyone else.
    await page.goto('./#/welcome/trip');
    await page.getByRole('link', { name: /有國內線轉機|Connecting domestically/ }).click();
    await expect(page.getByText(/最後離開日本|final airport/)).toBeVisible();
  });

  test('S03 says why travellers are listed separately before asking for them', async ({ page }) => {
    await page.goto('./#/welcome/travelers');
    expect(await currentScreen(page)).toBe('S03');
    // DR-004: one passport is one customs procedure, which is the reason for the whole
    // screen and has to precede the form rather than follow it.
    await expect(
      page.getByText(/每本護照都是獨立的退稅手續|Each passport is its own/),
    ).toBeVisible();
  });

  test('S03 keeps the passport field optional and capped at four characters', async ({ page }) => {
    // DR-041: at most the last four, and never a full passport number.
    await page.goto('./#/welcome/travelers');
    const passport = page.getByLabel(/護照末四碼|Passport last 4/).first();
    await passport.fill('123456789');
    await expect(passport).toHaveValue(/^.{0,4}$/);
  });

  test('S04 labels the buffer as Kaeru\u2019s suggestion, never an official figure', async ({
    page,
  }) => {
    // UR-03: no official number exists, so presenting one as official would be inventing it.
    await page.goto('./#/welcome/ready');
    expect(await currentScreen(page)).toBe('S04');
    await expect(
      page.getByText(/這是 Kaeru 的建議，不是官方規定|not an official figure/),
    ).toBeVisible();
  });

  test('S04 shows the leave-by time only when a flight time was given', async ({ page }) => {
    // UJ-022 as corrected: the figure is "be at the airport by", and with no flight time
    // there is nothing to compute — so nothing renders, not a dash and not a blank.
    await page.goto('./#/welcome/ready');
    await expect(page.getByTestId('leave-by')).toHaveCount(0);
  });
});

test.describe('Settings (S60, S61, S63)', () => {
  test.fixme(true, 'Enabled by #35 (M2-A2): settings index, trip settings and privacy.');

  test('S61 states the departure-time arithmetic rather than only its result', async ({ page }) => {
    // DR-032: a recommendation the user cannot audit is one they will ignore.
    await seedDevice(page, { trip: { flightTime: '07:45' } });
    await page.goto('./#/settings/trip');
    expect(await currentScreen(page)).toBe('S61');
    await expect(page.getByTestId('leave-by-working')).toContainText('07:45');
    await expect(page.getByTestId('leave-by-working')).toContainText('60');
  });

  test('S61 shows what changing the departure date would cost before it commits', async ({
    page,
  }) => {
    // DR-076a, and the reason it lives here: the deadline warning is never actionable when
    // a receipt is logged. The moment it earns its keep is someone deciding at 23:00
    // whether to stay two more days.
    await seedDevice(page, {
      trip: { departureDate: '2026-11-20' },
      receipts: [{ id: 'r1', purchaseDate: '2026-11-01' }],
    });
    await page.goto('./#/settings/trip');
    await page.getByLabel(/出境日期|Departure date/).fill('2027-02-10');
    await expect(page.getByTestId('departure-change-cost')).toBeVisible();
    await expect(page.getByTestId('departure-change-cost')).toContainText('1');
  });

  test('S63 states the privacy position in both languages without a network claim', async ({
    page,
  }) => {
    await page.goto('./#/settings/privacy');
    expect(await currentScreen(page)).toBe('S63');
    await expect(page.getByText(/沒有帳號|No account/)).toBeVisible();
  });
});

test.describe('Guide (S50, S51, S54)', () => {
  test('S50 reaches every section and says the guide works offline', async ({ page }) => {
    await page.goto('./#/guide');
    expect(await currentScreen(page)).toBe('S50');
    // By destination, not by label. The wireframe's four labels predate the content layer,
    // which titles its own articles and split "what changed" from the five steps; a second
    // set of labels written into the screen would drift from the reviewed prose (#140).
    for (const destination of [
      '#/guide/articles/guide.steps',
      '#/guide/articles/guide.airport',
      '#/guide/operators',
      '#/guide/faq',
    ]) {
      await expect(page.locator(`main a[href$="${destination}"]`)).toBeVisible();
    }
    await expect(page.getByText(/離線也看得到|works offline/)).toBeVisible();
  });

  test('S51 carries its sources with the date they were read', async ({ page }) => {
    // The guide is the only place rule prose lives, and an undated citation is an
    // assertion rather than a source.
    await page.goto('./#/guide/articles/guide.steps');
    expect(await currentScreen(page)).toBe('S51');
    // Every source, not one of them, and by the machine-readable date rather than a
    // rendering: the reader sees the date in their own format.
    const sources = page.getByTestId('source-list').locator('li');
    const listed = await sources.count();
    expect(listed).toBeGreaterThan(0);
    const dates = await sources
      .locator('time')
      .evaluateAll((times) => times.map((time) => time.getAttribute('datetime') ?? ''));
    expect(dates).toHaveLength(listed);
    for (const date of dates) expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('S54 deep-links to one answer, open: the 90-day figure from the rules data', async ({
    page,
  }) => {
    // #37: a deep link opens that entry expanded, through the path route rather than a
    // fragment (the fragment is spent on the hash route). `q06` is "How long do I have?".
    await page.goto('./#/guide/faq/q06');
    expect(await currentScreen(page)).toBe('S54');
    await expect(page.getByText(/90/)).toBeVisible();
  });
});

test.describe('Operators (S52, S53)', () => {
  test('S52 carries the association\u2019s own caveat, not an endorsement', async ({ page }) => {
    // DR-053: the list is operators' declarations. Neither Kaeru nor the Japanese state
    // vouches for any of them, and the UI must not imply either.
    await page.goto('./#/guide/operators');
    expect(await currentScreen(page)).toBe('S52');
    await expect(page.getByTestId('operator-disclaimer')).toBeVisible();
  });

  test('S53 renders an unknown fee as unknown, never as zero', async ({ page }) => {
    // DR-051. Eight of the ten shipped operators publish nothing, so this is the common
    // case and a zero would be a claim we are not entitled to make.
    await page.goto('./#/guide/operators/jptaxfree');
    expect(await currentScreen(page)).toBe('S53');
    // No digit at all, which is stronger than "no zero": any number here would be invented.
    await expect(page.getByTestId('operator-fee')).not.toContainText(/\d/);
    await expect(page.getByTestId('operator-fee')).toContainText(/未公布|Not published/);
  });

  test('S53 dates every fee figure it does show', async ({ page }) => {
    // DR-026: fee data is volatile and unregulated. Ocean's terms changed materially in
    // four weeks, so an undated figure is worse than none.
    await page.goto('./#/guide/operators/ocean');
    await expect(page.getByTestId('operator-fee-date')).toBeVisible();
  });

  test('S53 offline: says what needs a connection and what still works, instead of a dead link', async ({
    page,
    context,
  }) => {
    // #38, wireframes "Offline". The outbound link is one of the few places being offline
    // changes what a traveller can do, so it is the one place the app says so.
    await page.goto('./#/guide/operators/ocean');
    await expect(page.getByTestId('operator-visit')).toBeVisible();

    await context.setOffline(true);
    await expect(page.getByTestId('operator-offline')).toBeVisible();
    await expect(page.getByTestId('operator-offline')).toContainText(/機場流程|Airport Mode/);
    await expect(page.getByTestId('operator-visit')).toHaveCount(0);

    await context.setOffline(false);
    await expect(page.getByTestId('operator-visit')).toBeVisible();
  });
});
