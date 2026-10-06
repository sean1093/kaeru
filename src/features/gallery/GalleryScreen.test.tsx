import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { setActiveLocale } from '../../i18n/index.ts';
import { GalleryScreen } from './GalleryScreen.tsx';

describe('GalleryScreen', () => {
  it('renders every M1-3a, M1-3b and M1-3c component section', () => {
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
      'Amount display',
      'Form fields',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: new RegExp(section) })).toBeVisible();
    }
    expect(screen.getByText('Step 2 of 5')).toBeVisible();
    expect(screen.queryByText('步驟 2/5')).toBeNull();
  });

  it('renders in Traditional Chinese with no raw message key visible', () => {
    setActiveLocale('zh-TW');
    render(<GalleryScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'UI 元件庫' })).toBeVisible();
    expect(screen.queryByText(/^gallery\./)).toBeNull();
    expect(screen.getByText('步驟 2/5')).toBeVisible();
    expect(screen.queryByText('Step 2 of 5')).toBeNull();
  });
});
