import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { ChecklistRow } from './Checklist.tsx';
import { Stepper } from './Stepper.tsx';

const step = { current: 1, total: 5, text: '步驟 1/5 · Step 1 of 5' };

function advancing(onAdvance: () => { blockedBy: string; count: number } | null) {
  return {
    label: '都帶了，下一步',
    onAdvance,
    blockedAnnouncement: (count: number) => `還有 ${count} 張沒確認`,
  };
}

describe('Stepper', () => {
  it('keeps the primary button enabled even when the step is not satisfied', () => {
    render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(() => ({ blockedBy: 'r2', count: 2 }))}
      />,
    );
    // A disabled button in a queue is a dead end: the person holding the phone may have a
    // reason we cannot see. Friction, never a cage.
    const next = screen.getByRole('button', { name: '都帶了，下一步' });
    expect(next).toBeEnabled();
    expect(next).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('explains and moves focus to the blocking row instead of advancing', () => {
    render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(() => ({ blockedBy: 'r2', count: 2 }))}
      >
        <ChecklistRow id="r1" checked onChange={vi.fn()} primary="松本清" />
        <ChecklistRow id="r2" checked={false} onChange={vi.fn()} primary="ABC Mart" />
      </Stepper>,
    );
    fireEvent.click(screen.getByRole('button', { name: '都帶了，下一步' }));

    expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: /ABC Mart/ }));
    expect(screen.getByText('還有 2 張沒確認')).toBeInTheDocument();
  });

  it('says nothing when the step is satisfied', () => {
    const onAdvance = vi.fn(() => null);
    render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(onAdvance)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '都帶了，下一步' }));
    expect(onAdvance).toHaveBeenCalledOnce();
    expect(screen.queryByText(/還有/)).toBeNull();
  });

  it('moves focus to the step heading on every step change', () => {
    const { rerender } = render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(() => null)}
      />,
    );
    rerender(
      <Stepper
        step={{ current: 2, total: 5, text: '步驟 2/5 · Step 2 of 5' }}
        title="去出境大廳的免稅手續機台"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(() => null)}
      />,
    );
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: '去出境大廳的免稅手續機台' }),
    );
  });

  it('gives the exit a visible label rather than a bare glyph', () => {
    const onClose = vi.fn();
    render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={onClose}
        closeLabel="離開機場流程"
        primary={advancing(() => null)}
      />,
    );
    // Leaving is a decision: abandoning the procedure partway counts as having had no
    // customs confirmation at all (DR-032), so the exit must not read as an ordinary back.
    fireEvent.click(screen.getByRole('button', { name: /離開機場流程/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders the bag-drop banner itself, with no live region of its own', () => {
    render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(() => null)}
        banner={{ tone: 'attention', body: '還不要託運行李' }}
      />,
    );
    const banner = screen.getByText('還不要託運行李').closest('div[aria-live]');
    // A permanently-present message that re-announces on every step change is one the
    // user learns to tune out, and this is the message that must never become noise.
    expect(banner).toHaveAttribute('aria-live', 'off');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('omits the countdown slot entirely when the trip has no flight time', () => {
    const { container } = render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(() => null)}
      />,
    );
    // No placeholder and no zero: a countdown to nothing is worse than no countdown.
    expect(container.querySelector('[aria-live="off"][aria-label]')).toBeNull();
  });

  it('exposes the countdown on demand and never announces it', () => {
    render(
      <Stepper
        step={step}
        title="把東西都帶在身上"
        onClose={vi.fn()}
        closeLabel="離開"
        primary={advancing(() => null)}
        countdown={{
          text: '還有 2 小時 48 分',
          accessibleName: '距離建議辦完時間還有 2 小時 48 分',
        }}
      />,
    );
    const countdown = screen.getByText('還有 2 小時 48 分');
    expect(countdown).toHaveAttribute('aria-live', 'off');
    // A countdown that announces itself would interrupt every other announcement on the
    // screen, once a minute, for the whole time someone is reading instructions.
    expect(countdown.closest('[aria-live="polite"], [aria-live="assertive"]')).toBeNull();
  });
});
