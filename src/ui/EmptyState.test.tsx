import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState.tsx';
import { FrogMarkIcon } from './icons.tsx';

describe('EmptyState', () => {
  it('explains why it is empty and what fills it, not just "no data"', () => {
    render(
      <EmptyState
        mark={FrogMarkIcon}
        headline="No receipts yet"
        body="After you buy something in Japan, log the receipt here."
        action={{ label: 'Log a receipt', onActivate: vi.fn() }}
      />,
    );
    expect(screen.getByText('No receipts yet')).toBeVisible();
    expect(
      screen.getByText('After you buy something in Japan, log the receipt here.'),
    ).toBeVisible();
  });

  it('hides the decorative mark from assistive tech', () => {
    render(<EmptyState mark={FrogMarkIcon} headline="Empty" body="Why, and what fills it." />);
    expect(
      screen.getByText('Empty').parentElement?.querySelector('[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  it('renders at most one primary action and one secondary link', () => {
    const onActivate = vi.fn();
    render(
      <EmptyState
        headline="Empty"
        body="Why"
        action={{ label: 'Act', onActivate }}
        secondary={{ label: 'Learn more', href: '#/guide' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Act' }));
    expect(onActivate).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '#/guide');
  });

  it('renders an action with a destination as a link rather than a button', () => {
    render(<EmptyState headline="Empty" body="Why" action={{ label: 'Go', href: '#/x' }} />);
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '#/x');
  });
});
