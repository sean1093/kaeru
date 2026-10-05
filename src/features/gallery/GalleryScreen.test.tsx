import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { setActiveLocale } from '../../i18n/index.ts';
import { GalleryScreen } from './GalleryScreen.tsx';

describe('GalleryScreen', () => {
  it('renders every M1-3a and M1-3b component section', () => {
    setActiveLocale('en');
    render(<GalleryScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'UI kit gallery' })).toBeVisible();
    for (const section of [
      'App bar',
      'Buttons',
      'Cards',
      'List rows',
      'Status chips',
      'Bottom navigation',
      'Progress',
      'Banner',
      'Toast',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: new RegExp(section) })).toBeVisible();
    }
  });

  it('renders in Traditional Chinese with no raw message key visible', () => {
    setActiveLocale('zh-TW');
    render(<GalleryScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'UI 元件庫' })).toBeVisible();
    expect(screen.queryByText(/^gallery\./)).toBeNull();
  });

  it('carries a stable data-screen attribute for QA', () => {
    setActiveLocale('en');
    render(<GalleryScreen />);
    expect(screen.getByText('UI kit gallery').closest('[data-screen]')).toHaveAttribute(
      'data-screen',
      'DEV-GALLERY',
    );
  });
});
