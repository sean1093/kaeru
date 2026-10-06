import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { DateField } from './DateField.tsx';

describe('DateField', () => {
  it('reports the raw input value on change', () => {
    const onChange = vi.fn();
    render(
      <DateField
        id="date"
        label="Date"
        value="2026-11-04"
        onChange={onChange}
        todayLabel="Today"
      />,
    );
    fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-12-01' } });
    expect(onChange).toHaveBeenCalledWith('2026-12-01');
  });

  it('resets to today when the Today chip is activated', () => {
    const onChange = vi.fn();
    render(
      <DateField
        id="date"
        label="Date"
        value="2026-11-04"
        onChange={onChange}
        todayLabel="Today"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    const [call] = onChange.mock.calls;
    expect(call?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('renders the derived deadline as read-only text, never a second input', () => {
    const { container } = render(
      <DateField
        id="date"
        label="Purchase date"
        value="2026-11-04"
        onChange={vi.fn()}
        todayLabel="Today"
        deadlineHint="Customs deadline 2 Feb 2027 · 90 days"
      />,
    );
    expect(screen.getByText('Customs deadline 2 Feb 2027 · 90 days')).toBeVisible();
    expect(container.querySelectorAll('input')).toHaveLength(1);
  });

  it('uses a native date input', () => {
    render(
      <DateField id="date" label="Date" value="2026-11-04" onChange={vi.fn()} todayLabel="Today" />,
    );
    expect(screen.getByLabelText('Date')).toHaveAttribute('type', 'date');
  });
});
