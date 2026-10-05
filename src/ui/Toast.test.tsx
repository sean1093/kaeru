import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast.tsx';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  it('is role="status" / aria-live="polite", never an interruption', () => {
    render(<Toast message="Receipt saved." onDismiss={vi.fn()} />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Receipt saved.');
  });

  it('dismisses itself after 5 seconds with no action', () => {
    const onDismiss = vi.fn();
    render(<Toast message="Receipt saved." onDismiss={onDismiss} />);
    vi.advanceTimersByTime(4999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('extends to 10 seconds when it carries an action', () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        message="Receipt deleted."
        action={{ label: 'Undo', onActivate: vi.fn() }}
        onDismiss={onDismiss}
      />,
    );
    vi.advanceTimersByTime(5000);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('undo is a convenience, not the only path: activating it does not itself dismiss', () => {
    const onActivate = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Toast
        message="Receipt deleted."
        action={{ label: 'Undo', onActivate }}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onActivate).toHaveBeenCalledOnce();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
