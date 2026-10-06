import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl.tsx';

const TAX_RATE_OPTIONS = [
  { value: 0.1, label: '10%', helper: '大部分商品 / most goods' },
  { value: 0.08, label: '8%', helper: '食品、飲料（不含酒類）/ food and drink, not alcohol' },
] as const;

describe('SegmentedControl', () => {
  it('renders each option as a native radio with the legend as its group name', () => {
    render(
      <SegmentedControl
        legend="Tax rate"
        options={TAX_RATE_OPTIONS}
        value={0.1}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('group', { name: 'Tax rate' })).toBeVisible();
    expect(screen.getByRole('radio', { name: /10%/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /8%/ })).not.toBeChecked();
  });

  it('calls onChange with the selected option value', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        legend="Tax rate"
        options={TAX_RATE_OPTIONS}
        value={0.1}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: /8%/ }));
    expect(onChange).toHaveBeenCalledWith(0.08);
  });

  it('renders the helper line, load-bearing for telling 8% food from 10% goods apart', () => {
    render(
      <SegmentedControl
        legend="Tax rate"
        options={TAX_RATE_OPTIONS}
        value={0.1}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/food and drink, not alcohol/)).toBeVisible();
  });

  it('rejects more than three options and points the author at SelectSheet', () => {
    const fourOptions = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
      { value: 'd', label: 'D' },
    ];
    expect(() =>
      render(
        <SegmentedControl legend="Too many" options={fourOptions} value="a" onChange={vi.fn()} />,
      ),
    ).toThrow(/SelectSheet/);
  });

  it('rejects an English label long enough to wrap, like "Checked luggage"', () => {
    const options = [
      { value: 'with_me', label: 'With me' },
      { value: 'checked_bag', label: 'Checked luggage' },
    ];
    expect(() =>
      render(
        <SegmentedControl legend="Packing" options={options} value="with_me" onChange={vi.fn()} />,
      ),
    ).toThrow(/SelectSheet/);
  });

  it('does not reject a short English label or a CJK label of any length', () => {
    const options = [
      { value: 'a', label: 'With me' },
      { value: 'b', label: '松本清藥粧店新宿東口駅前店' },
    ];
    expect(() =>
      render(<SegmentedControl legend="OK" options={options} value="a" onChange={vi.fn()} />),
    ).not.toThrow();
  });
});
