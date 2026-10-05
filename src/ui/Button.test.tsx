import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button.tsx';

describe('Button', () => {
  it('fires onClick by default', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('inactive: true keeps the control focusable and exposes aria-disabled, never the disabled attribute', () => {
    const onClick = vi.fn();
    render(
      <Button inactive onClick={onClick}>
        Next step
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Next step' });

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();

    button.focus();
    expect(button).toHaveFocus();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the longest-string fixture without an ellipsis class or truncation style', () => {
    render(
      <Button fullWidth>
        在日本買東西、拿到收據之後，回來記一筆，確認稅率、金額和退稅業者是否都正確無誤
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button.className).not.toMatch(/truncate|ellipsis/i);
  });

  it.each(['primary', 'secondary', 'quiet', 'destructive'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Button variant={variant}>Label</Button>);
      expect(screen.getByRole('button', { name: 'Label' })).toBeVisible();
    },
  );

  it.each(['default', 'airport', 'inline'] as const)('renders the %s size', (size) => {
    render(<Button size={size}>Label</Button>);
    expect(screen.getByRole('button', { name: 'Label' })).toBeVisible();
  });
});
