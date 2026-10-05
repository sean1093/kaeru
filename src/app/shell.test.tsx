import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setActiveLocale } from '../i18n/index.ts';
import { App } from './App.tsx';
import type { ScreenRoute } from './navigation.ts';
import * as registry from './registry.ts';
import { routes } from './registry.ts';
import { currentLocation, registerRoutes, startRouter } from './router.ts';
import { appShellBanner, appToastHost, shellBanner, shellToast } from './shell-state.ts';

const noScreen = () => null;

function at(path: string): void {
  currentLocation.value = { path, sheet: null };
}

/** A route of each chrome kind, so chrome is exercised rather than assumed from home. */
const CHROME_ROUTES: readonly ScreenRoute[] = [
  ...routes,
  { pattern: '/receipts/new', screenIds: ['S21'], chrome: 'fullscreen', screen: noScreen },
  { pattern: '/airport', screenIds: ['S30'], chrome: 'mode', screen: noScreen },
];

let stop: (() => void) | undefined;

beforeEach(() => {
  window.location.hash = '';
  registerRoutes(CHROME_ROUTES);
  stop = startRouter();
  setActiveLocale('zh-TW');
});

afterEach(() => {
  stop?.();
  appShellBanner.clear();
  shellToast.value = null;
  registerRoutes(routes);
});

describe('chrome switching (ScreenRoute.chrome)', () => {
  it('shows the bottom navigation on a tabs screen', () => {
    at('/');
    render(<App />);
    expect(screen.getByTestId('bottom-nav')).toBeVisible();
  });

  it('hides the bottom navigation in a full-screen flow', () => {
    // A tab bar inside add-receipt is a one-tap exit from a half-filled form.
    at('/receipts/new');
    render(<App />);
    expect(screen.queryByTestId('bottom-nav')).toBeNull();
  });

  it('hides the bottom navigation in Airport Mode', () => {
    // The strongest case: leaving the sequence halfway is irreversible (DR-032), and
    // the user is in a queue with luggage.
    at('/airport');
    render(<App />);
    expect(screen.queryByTestId('bottom-nav')).toBeNull();
  });

  it('keeps the navigation on an unmatched route, so a mistyped URL is escapable', () => {
    at('/no-such-route');
    render(<App />);
    expect(screen.getByTestId('bottom-nav')).toBeVisible();
    expect(screen.getByTestId('not-found')).toBeVisible();
  });
});

describe('the shell banner (UJ-026, UJ-031)', () => {
  const bagDrop = {
    tone: 'attention',
    heading: '還不能託運',
    body: '海關確認之前，請把免稅商品留在手提行李。',
    dismissible: false,
  } as const;

  it('survives navigation between screens, because a screen cannot own it', () => {
    appShellBanner.set(bagDrop);
    at('/airport');
    render(<App />);
    expect(screen.getByTestId('shell-banner')).toBeVisible();

    // Every Airport Mode step is a different route; the banner is the shell's, not theirs.
    at('/');
    render(<App />);
    expect(screen.getAllByTestId('shell-banner')[0]).toBeVisible();
  });

  it('offers no way to dismiss it', () => {
    appShellBanner.set(bagDrop);
    at('/');
    render(<App />);
    const banner = screen.getByTestId('shell-banner');
    // Not a close button, not a timeout, not an auto-clear: a traveller who dismisses this
    // and checks their bags has put the goods beyond the customs check, unrecoverably.
    expect(banner.querySelectorAll('button')).toHaveLength(0);
  });

  it('clears only through the explicit API', () => {
    appShellBanner.set(bagDrop);
    expect(shellBanner.value).not.toBeNull();

    at('/receipts/new');
    at('/airport');
    expect(shellBanner.value, 'navigation must not clear it').not.toBeNull();

    appShellBanner.clear();
    expect(shellBanner.value).toBeNull();
  });

  it('never announces itself, so it cannot re-interrupt on every step', () => {
    // Forced to live="none" regardless of what the caller passes: five steps would mean
    // five interruptions to someone reading a kiosk screen.
    appShellBanner.set({ ...bagDrop, live: 'alert' });
    expect(shellBanner.value?.live).toBe('none');
  });
});

describe('the toast host', () => {
  it('shows one toast at a time, a new one replacing the current', () => {
    at('/');
    render(<App />);
    act(() => appToastHost.show('已儲存'));
    expect(screen.getByTestId('shell-toast')).toHaveTextContent('已儲存');

    act(() => appToastHost.show('已刪除'));
    const toasts = screen.getAllByTestId('shell-toast');
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveTextContent('已刪除');
  });

  it('restarts for a repeated message rather than inheriting the old countdown', () => {
    appToastHost.show('已儲存');
    const first = shellToast.value?.id;
    appToastHost.show('已儲存');
    // The commonest case in the twenty-second add flow: the same confirmation twice. A
    // component keyed on the message alone would keep the first toast's remaining timer.
    expect(shellToast.value?.id).not.toBe(first);
  });

  it('runs an action and is dismissible by it', () => {
    const onActivate = vi.fn();
    at('/');
    render(<App />);
    act(() => appToastHost.show('已刪除', { label: '復原', onActivate }));

    fireEvent.click(screen.getByRole('button', { name: '復原' }));
    expect(onActivate).toHaveBeenCalledOnce();
  });
});

describe('tab badges', () => {
  const tabbed = (badge: () => unknown) =>
    [
      {
        id: 'home',
        messages: { 'zh-TW': { 'home.nav': '首頁' }, en: { 'home.nav': 'Home' } },
        routes: [{ pattern: '/', screenIds: ['S10'], chrome: 'tabs', screen: noScreen }],
        tab: { order: 10, screenId: 'S10', labelKey: 'home.nav', icon: () => null, badge },
      },
    ] as unknown as Parameters<typeof registerRoutes>[0];

  it('folds a count into the accessible name rather than announcing a bare number', () => {
    setActiveLocale('en');
    vi.spyOn(registry, 'tabFeatures', 'get').mockReturnValue(
      tabbed(() => ({ kind: 'count', value: 3, accessibleName: ', 3 need action' })) as never,
    );
    at('/');
    render(<App />);
    // "Home, 3 need action" — never "Home 3". The visible label stays a prefix of the
    // spoken name (WCAG 2.5.3), which the kit guarantees by plain concatenation.
    expect(screen.getByTestId('nav-home')).toHaveAttribute('aria-label', 'Home, 3 need action');
  });

  it('renders no badge when the selector reports nothing', () => {
    setActiveLocale('en');
    vi.spyOn(registry, 'tabFeatures', 'get').mockReturnValue(tabbed(() => undefined) as never);
    at('/');
    render(<App />);
    expect(screen.getByTestId('nav-home')).not.toHaveAttribute('aria-label');
  });

  it('survives a selector that throws, rather than taking the whole navigation with it', () => {
    setActiveLocale('en');
    vi.spyOn(registry, 'tabFeatures', 'get').mockReturnValue(
      tabbed(() => {
        throw new Error('repository not open yet');
      }) as never,
    );
    at('/');
    render(<App />);
    // The user loses one number, not every tab. And the fallback is no badge rather than a
    // zero: "we could not count" is not "nothing needs doing".
    expect(screen.getByTestId('nav-home')).toBeVisible();
    expect(screen.getByTestId('nav-home')).not.toHaveAttribute('aria-label');
  });
});
