import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import type { SelectSheetOption } from './contracts.ts';
import { SelectSheet } from './SelectSheet.tsx';

const OPERATORS: readonly SelectSheetOption[] = [
  { value: 'jj-taxfree', label: 'J&J Tax Free', group: '常見 Common' },
  { value: 'pie-vat', label: 'PIE VAT', group: '常見 Common' },
  { value: 'smart-detax', label: 'Smart Detax', group: '常見 Common' },
  { value: 'global-blue', label: 'Global Blue', group: '常見 Common' },
  { value: 'tourego', label: 'Tourego', group: '其他 Others' },
  { value: 'ocean', label: 'Ocean', group: '其他 Others' },
  { value: 'wamazing', label: 'WAmazing', group: '其他 Others' },
  { value: 'unknown', label: '還不確定', secondary: '晚點再補就好', sentinel: true },
];

function renderSheet(overrides: Partial<Parameters<typeof SelectSheet>[0]> = {}) {
  const props = {
    title: '哪一家退稅業者？',
    options: OPERATORS,
    value: null,
    onChange: vi.fn(),
    searchLabel: '搜尋',
    doneLabel: '完成',
    onClose: vi.fn(),
    ...overrides,
  };
  render(<SelectSheet {...props} />);
  return props;
}

describe('SelectSheet', () => {
  it('commits only on Done, so a mis-tap in a queue changes nothing', () => {
    const props = renderSheet();
    fireEvent.click(screen.getByRole('radio', { name: /PIE VAT/ }));
    // Tapping an option selects it visually but writes nothing: the value the receipt
    // carries must not change behind the user on a screen they have already left.
    expect(props.onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    expect(props.onChange).toHaveBeenCalledWith('pie-vat');
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('discards the draft when closed without Done', () => {
    const props = renderSheet({ value: 'ocean' });
    fireEvent.click(screen.getByRole('radio', { name: /Tourego/ }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('offers search above six options and filters on it', () => {
    renderSheet();
    fireEvent.input(screen.getByLabelText('搜尋'), { target: { value: 'tour' } });
    expect(screen.getByRole('radio', { name: /Tourego/ })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /PIE VAT/ })).toBeNull();
  });

  it('does not offer search at six options or fewer', () => {
    renderSheet({ options: OPERATORS.slice(0, 4) });
    expect(screen.queryByLabelText('搜尋')).toBeNull();
  });

  it('keeps the not-sure sentinel reachable even while a search excludes everything', () => {
    renderSheet();
    fireEvent.input(screen.getByLabelText('搜尋'), { target: { value: 'zzzz' } });
    // The traveler who cannot find their operator is exactly the person who needs the
    // sentinel, and a search that hides it strands them (DR-050: unknown is valid).
    expect(screen.getByRole('radio', { name: /還不確定/ })).toBeInTheDocument();
  });

  it('groups options under their headings', () => {
    renderSheet();
    expect(screen.getByText('常見 Common')).toBeInTheDocument();
    expect(screen.getByText('其他 Others')).toBeInTheDocument();
  });

  it('marks the current value as selected when it opens', () => {
    renderSheet({ value: 'global-blue' });
    expect(screen.getByRole('radio', { name: /Global Blue/ })).toBeChecked();
  });
});
