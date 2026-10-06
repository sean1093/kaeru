import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { setActiveLocale } from '../i18n/index.ts';
import { AmountEntry } from './AmountEntry.tsx';

describe('AmountEntry', () => {
  it('renders null as an empty field rather than a zero', () => {
    render(<AmountEntry id="amount" label="Amount" value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('strips non-digit characters and reports a number to onChange', () => {
    const onChange = vi.fn();
    render(<AmountEntry id="amount" label="Amount" value={null} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.input(input, { target: { value: '12,345' } });
    expect(onChange).toHaveBeenLastCalledWith(12345);
  });

  it('reports null when every character is cleared', () => {
    const onChange = vi.fn();
    render(<AmountEntry id="amount" label="Amount" value={1200} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.input(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('is type="text" with inputmode="numeric", never type="number"', () => {
    render(<AmountEntry id="amount" label="Amount" value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('focuses the field on mount when autoFocus is set', () => {
    render(<AmountEntry id="amount" label="Amount" value={null} onChange={vi.fn()} autoFocus />);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('does not steal focus when autoFocus is not set', () => {
    render(<AmountEntry id="amount" label="Amount" value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });

  it('shows raw digits while focused and grouped digits once blurred', () => {
    setActiveLocale('en');
    render(<AmountEntry id="amount" label="Amount" value={12345} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('12,345');

    fireEvent.focus(input);
    expect(input).toHaveValue('12345');

    fireEvent.blur(input);
    expect(input).toHaveValue('12,345');
  });

  it('calls onBlur when the field loses focus', () => {
    const onBlur = vi.fn();
    render(
      <AmountEntry id="amount" label="Amount" value={null} onChange={vi.fn()} onBlur={onBlur} />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('shows the derived hint as calculated, distinct from the error', () => {
    render(
      <AmountEntry
        id="amount"
        label="Amount"
        value={1000}
        onChange={vi.fn()}
        derivedHint="Calculated from tax-included amount"
      />,
    );
    expect(screen.getByText('Calculated from tax-included amount')).toBeVisible();
  });

  it('UX review, #115: never invents bilingual content — the accessible name is label alone without accessibleName', () => {
    render(<AmountEntry id="amount" label="Amount" value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Amount');
  });

  it('uses the caller-supplied, already-translated accessibleName when given', () => {
    render(
      <AmountEntry
        id="amount"
        label="未稅金額"
        value={null}
        onChange={vi.fn()}
        accessibleName="未稅金額，日圓"
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleName('未稅金額，日圓');
  });
});
