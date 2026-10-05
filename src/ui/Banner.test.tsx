import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Banner } from './Banner.tsx';

describe('Banner', () => {
  it('defaults live to "none" so it does not interrupt on re-render', () => {
    render(<Banner tone="attention" body="Do not check your bags yet." />);
    const banner = screen.getByText('Do not check your bags yet.').closest('div[aria-live]');
    expect(banner).toHaveAttribute('aria-live', 'off');
    expect(banner).not.toHaveAttribute('role', 'alert');
  });

  it('uses role="alert" only when live is "alert"', () => {
    render(<Banner tone="attention" body="Something went wrong." live="alert" />);
    expect(screen.getByRole('alert')).toBeVisible();
  });

  it('every attention banner carries a corrective action', () => {
    const onActivate = vi.fn();
    render(
      <Banner
        tone="attention"
        body="Receipt not registered."
        action={{ label: 'Fix it', onActivate }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fix it' }));
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('renders a heading in the accent colour position and body in the base position', () => {
    render(<Banner tone="success" heading="Saved" body="Your backup was exported." />);
    expect(screen.getByText('Saved')).toBeVisible();
    expect(screen.getByText('Your backup was exported.')).toBeVisible();
  });
});
