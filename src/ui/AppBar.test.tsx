import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { AppBar } from './AppBar.tsx';
import { ReceiptIcon } from './icons.tsx';

describe('AppBar', () => {
  it('renders the title as the screen h1', () => {
    render(<AppBar title="Receipts" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Receipts' })).toBeVisible();
  });

  it('renders a labelled back control that activates on click', () => {
    const onActivate = vi.fn();
    render(<AppBar title="Receipt detail" leading={{ kind: 'back', label: 'Back', onActivate }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('renders a close control for modal flows instead of back', () => {
    render(
      <AppBar
        title="Add receipt"
        leading={{ kind: 'close', label: 'Close', onActivate: vi.fn() }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  it('renders at most one action, with its own accessible name', () => {
    const onActivate = vi.fn();
    render(
      <AppBar title="Receipts" action={{ icon: ReceiptIcon, label: 'Add receipt', onActivate }} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add receipt' }));
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('renders the longest bilingual title in full, with no character dropped', () => {
    const longest =
      '松本清藥粧店新宿東口駅前店的收據明細與退稅狀態 — full receipt detail and refund status';
    render(<AppBar title={longest} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(longest);
  });
});
