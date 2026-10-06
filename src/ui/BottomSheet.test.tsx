import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet.tsx';

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <BottomSheet title="Who bought this?" open={false} onClose={vi.fn()}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a modal dialog labelled by its own heading', () => {
    render(
      <BottomSheet title="Who bought this?" open onClose={vi.fn()}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Who bought this?' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet title="Who bought this?" open onClose={onClose}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('moves focus into the sheet and restores it to the trigger on close', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    const { rerender } = render(
      <BottomSheet title="Who bought this?" open onClose={vi.fn()}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Yi-chun' }));

    rerender(
      <BottomSheet title="Who bought this?" open={false} onClose={vi.fn()}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    // Back where they were: a sheet that drops focus to <body> loses a keyboard user
    // their place on the screen behind it.
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('keeps Tab inside the sheet, wrapping at both ends', () => {
    render(
      <BottomSheet title="Who bought this?" open onClose={vi.fn()}>
        <button type="button">First</button>
        <button type="button">Last</button>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog');
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('makes the app background inert while open, and restores it on close', () => {
    // The defect this pins (QALead, #121): the sheet used to render inline inside #app,
    // so "body's children that do not contain the sheet" was the empty set and nothing was
    // ever marked. Keyboard users were fine — the focus trap held — which is exactly what
    // hid it, because a screen reader in browse mode walks the DOM rather than tab order.
    const { rerender } = render(
      <BottomSheet title="Who bought this?" open onClose={vi.fn()}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    expect(document.querySelectorAll('[inert]').length).toBeGreaterThan(0);

    rerender(
      <BottomSheet title="Who bought this?" open={false} onClose={vi.fn()}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    expect(document.querySelectorAll('[inert]').length).toBe(0);
  });

  it('renders outside the app root, so nothing it covers can contain it', () => {
    render(
      <BottomSheet title="Who bought this?" open onClose={vi.fn()}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('[data-testid="app-root"]')).toBeNull();
    // Its own child of `<body>`: the inert sweep marks body's other children, so the sheet
    // must not share one with the content it covers.
    const own = [...document.body.children].find((node) => node.contains(dialog));
    expect(own).toBeDefined();
    expect(own?.querySelector('[data-testid="app-root"]')).toBeNull();
  });

  it('closes on a downward drag of the header, but not on a tap that moves a little', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet title="Who bought this?" open onClose={onClose}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    const heading = screen.getByRole('heading', { name: 'Who bought this?' });

    fireEvent.pointerDown(heading, { clientY: 100 });
    fireEvent.pointerUp(heading, { clientY: 110 });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(heading, { clientY: 100 });
    fireEvent.pointerUp(heading, { clientY: 300 });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('never closes on a drag that starts in the content — that is a scroll or a selection', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet title="Who bought this?" open onClose={onClose}>
        <button type="button">Yi-chun</button>
      </BottomSheet>,
    );
    const option = screen.getByRole('button', { name: 'Yi-chun' });

    fireEvent.pointerDown(option, { clientY: 100 });
    fireEvent.pointerUp(option, { clientY: 300 });
    expect(onClose).not.toHaveBeenCalled();
  });
});
