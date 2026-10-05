import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { BottomNav } from './BottomNav.tsx';
import type { BottomNavItem } from './contracts.ts';
import { ReceiptIcon } from './icons.tsx';

function item(overrides: Partial<BottomNavItem> = {}): BottomNavItem {
  return {
    id: 'receipts',
    href: '#/receipts',
    label: 'Receipts',
    icon: ReceiptIcon,
    active: false,
    ...overrides,
  };
}

describe('BottomNav', () => {
  it('marks the active item with aria-current="page"', () => {
    render(
      <BottomNav
        label="Main"
        items={[item({ id: 'home', href: '#/', label: 'Home', active: true }), item()]}
      />,
    );
    expect(screen.getByTestId('nav-home')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-receipts')).not.toHaveAttribute('aria-current');
  });

  it('a dot badge adds nothing to the accessible name', () => {
    render(<BottomNav label="Main" items={[item({ badge: { kind: 'dot' } })]} />);
    expect(screen.getByRole('link', { name: 'Receipts' })).toBeVisible();
  });

  it('folds a count badge into the accessible name instead of announcing a bare number', () => {
    render(
      <BottomNav
        label="Main"
        items={[
          item({
            badge: { kind: 'count', value: 3, accessibleName: 'Receipts, 3 need action' },
          }),
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Receipts, 3 need action' })).toBeVisible();
    expect(screen.queryByRole('link', { name: '3' })).toBeNull();
  });

  it('renders the nav with its label as the accessible name', () => {
    render(<BottomNav label="Main navigation" items={[item()]} />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});
