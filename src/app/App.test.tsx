import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '../i18n/index.ts';
import { App } from './App.tsx';
import { routes } from './registry.ts';
import { currentLocation, registerRoutes, startRouter } from './router.ts';

let stop: (() => void) | undefined;

beforeEach(() => {
  window.location.hash = '';
  registerRoutes(routes);
  stop = startRouter();
  setActiveLocale('zh-TW');
});

afterEach(() => {
  stop?.();
});

describe('app shell', () => {
  it('renders the home feature at the root route in Traditional Chinese', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '日本退稅，安心帶回家' })).toBeVisible();
  });

  it('switches every visible string when the language changes', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('language-en'));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bring your Japan tax refund home' }),
    ).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    expect(document.documentElement.lang).toBe('en');
  });

  it('builds the bottom navigation from the features that registered a tab', () => {
    render(<App />);
    const links = screen.getByTestId('bottom-nav').querySelectorAll('a');
    const hrefs = [...links].map((link) => link.getAttribute('href'));
    // Settings is an app-bar route, not a fifth tab, and four is the maximum that keeps
    // every target >= 64 px wide with English labels un-truncated at 320 px (IA section 2).
    expect(hrefs).toContain('#/');
    expect(hrefs).not.toContain('#/settings');
    expect(hrefs.length).toBeLessThanOrEqual(4);
    // Home is the route under test, so it is the one marked current.
    expect(links[0]?.getAttribute('aria-current')).toBe('page');
  });

  it('renders the registered screen for a known route', () => {
    currentLocation.value = { path: '/settings', sheet: null };
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeVisible();
  });

  it('writes the live screen id into data-screen, so QA can assert which screen is on', () => {
    render(<App />);
    expect(document.querySelector('[data-screen]')?.getAttribute('data-screen')).toBe('S10');

    currentLocation.value = { path: '/settings', sheet: null };
    render(<App />);
    expect(document.querySelector('[data-screen="S60"]')).not.toBeNull();
  });

  it('shows the not-found screen for an unknown route', () => {
    currentLocation.value = { path: '/no-such-page', sheet: null };
    render(<App />);
    expect(screen.getByTestId('not-found')).toBeVisible();
    expect(screen.getByRole('heading', { name: '找不到這個頁面' })).toBeVisible();
  });
});
