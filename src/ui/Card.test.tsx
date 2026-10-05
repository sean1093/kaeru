import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card.tsx';

describe('Card', () => {
  it('renders a non-interactive section when it has neither href nor onActivate', () => {
    render(<Card title="This trip">11 receipts</Card>);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'This trip' })).toBeVisible();
  });

  it('renders as a link when href is given, as one tap target', () => {
    render(
      <Card title="Packing plan" href="#/packing">
        Before you fly
      </Card>,
    );
    const link = screen.getByRole('link', { name: /Packing plan/ });
    expect(link).toHaveAttribute('href', '#/packing');
  });

  it('renders as a button when onActivate is given', () => {
    const onActivate = vi.fn();
    render(
      <Card title="Packing plan" headingLevel={3} onActivate={onActivate}>
        Before you fly
      </Card>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Packing plan/ }));
    expect(onActivate).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { level: 3 })).toBeVisible();
  });
});
