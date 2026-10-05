import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '../i18n/index.ts';
import { App } from './App.tsx';
import { currentPath, startRouter } from './router.ts';

let stop: (() => void) | undefined;

beforeEach(() => {
  window.location.hash = '';
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
    expect(screen.getByRole('link', { name: /Settings/ })).toBeVisible();
    expect(document.documentElement.lang).toBe('en');
  });

  it('builds the bottom navigation from the registered features, in order', () => {
    render(<App />);
    const links = screen.getByTestId('bottom-nav').querySelectorAll('a');
    expect([...links].map((link) => link.getAttribute('href'))).toEqual(['#/', '#/settings']);
    expect(links[0]?.getAttribute('aria-current')).toBe('page');
  });

  it('renders the registered screen for a known route', () => {
    currentPath.value = '/settings';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeVisible();
  });

  it('shows the not-found screen for an unknown route', () => {
    currentPath.value = '/no-such-page';
    render(<App />);
    expect(screen.getByTestId('not-found')).toBeVisible();
    expect(screen.getByRole('heading', { name: '找不到這個頁面' })).toBeVisible();
  });
});
