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

  it('concatenates a count badge fragment onto the label, not a bare number', () => {
    render(
      <BottomNav
        label="Main"
        items={[
          item({
            badge: { kind: 'count', value: 3, accessibleName: ', 3 need action' },
          }),
        ]}
      />,
    );
    const link = screen.getByTestId('nav-receipts');
    expect(link).toHaveAttribute('aria-label', 'Receipts, 3 need action');
    expect(screen.queryByRole('link', { name: '3', exact: true })).toBeNull();
  });

  it('a count badge with value 0 renders nothing and does not fold into the name', () => {
    render(
      <BottomNav
        label="Main"
        items={[
          item({
            badge: { kind: 'count', value: 0, accessibleName: ', 0 need action' },
          }),
        ]}
      />,
    );
    const link = screen.getByTestId('nav-receipts');
    expect(link).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('link', { name: 'Receipts' })).toBeVisible();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('owns no separator: the caller\u2019s fragment carries its own locale-correct leading connector', () => {
    render(
      <BottomNav
        label="主要導覽"
        items={[
          item({
            label: '收據',
            badge: { kind: 'count', value: 3, accessibleName: '，3 項待處理' },
          }),
        ]}
      />,
    );
    const link = screen.getByTestId('nav-receipts');
    // Exact, not a substring match: pins the full-width 「，」 specifically, so a trim,
    // a collapse, or a lint rule stripping the connector fails this rather than an
    // ASCII-comma assertion that would pass either way.
    expect(link).toHaveAttribute('aria-label', '收據，3 項待處理');
    expect(link.getAttribute('aria-label')).toMatch(/^收據/);
  });

  it('renders the nav with its label as the accessible name', () => {
    render(<BottomNav label="Main navigation" items={[item()]} />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});
