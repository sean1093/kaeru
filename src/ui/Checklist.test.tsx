import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { ChecklistGroup, ChecklistRow } from './Checklist.tsx';

describe('ChecklistRow', () => {
  it('toggles from anywhere in the row, not just the 24 px box', () => {
    const onChange = vi.fn();
    render(
      <ChecklistRow
        id="r1"
        checked={false}
        onChange={onChange}
        primary="松本清 マツキヨ"
        secondary="11/04 · ¥8,900"
      />,
    );
    // Clicking the text is clicking the label, which is the whole row: a 24 px target
    // held one-handed in a queue with luggage is not acceptable.
    fireEvent.click(screen.getByText('11/04 · ¥8,900'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('unticking is allowed, because nothing here is a one-way door (DR-063)', () => {
    const onChange = vi.fn();
    render(<ChecklistRow id="r1" checked onChange={onChange} primary="GU 御殿場" />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('puts the warning inside the accessible name, so it cannot be seen and not heard', () => {
    render(
      <ChecklistRow
        id="r1"
        checked={false}
        onChange={vi.fn()}
        primary="ABC Mart"
        secondary="11/07 · ¥9,800"
        warning={{ tone: 'attention', text: '標記為託運' }}
      />,
    );
    expect(screen.getByRole('checkbox', { name: /標記為託運/ })).toBeInTheDocument();
  });

  it('renders a counter-routed receipt as a link, never as a checkbox (DR-035)', () => {
    render(
      <ChecklistRow
        id="r1"
        checked={false}
        onChange={vi.fn()}
        primary="松本清 マツキヨ"
        secondary="11/04 · ¥8,900"
        excluded={{ reason: '已經用掉了，要走海關櫃檯', href: '#/airport/used-goods' }}
      />,
    );
    // The official instruction is not to use the kiosk for this receipt. An unchecked box
    // would invite the traveler to tick it and walk to the machine.
    expect(screen.queryByRole('checkbox')).toBeNull();
    const link = screen.getByRole('link', { name: /已經用掉了/ });
    expect(link).toHaveAttribute('href', '#/airport/used-goods');
  });

  it('carries its row id so the stepper gate can scroll to it', () => {
    const { container } = render(
      <ChecklistRow id="receipt-7" checked={false} onChange={vi.fn()} primary="LoFt 澀谷" />,
    );
    expect(container.querySelector('[data-row-id="receipt-7"]')).not.toBeNull();
  });
});

describe('ChecklistGroup', () => {
  it('names the traveler in every row via the legend (UJ-019, UJ-027)', () => {
    render(
      <ChecklistGroup
        legend="宜君 Yi-chun"
        progress={{ value: 3, max: 5, label: 'Progress', valueText: '3/5' }}
      >
        <ChecklistRow id="r1" checked={false} onChange={vi.fn()} primary="唐吉訶德 ドンキ" />
      </ChecklistGroup>,
    );
    // Each passport is a separate customs procedure, so a row read without its owner is
    // ambiguous in a family's list.
    expect(screen.getByRole('group', { name: /宜君/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /唐吉訶德/ })).toBeInTheDocument();
  });

  it('shows per-traveler progress as a number, not only a bar', () => {
    render(
      <ChecklistGroup
        legend="志豪 Chih-hao"
        progress={{ value: 0, max: 6, label: 'Progress', valueText: '0/6' }}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
