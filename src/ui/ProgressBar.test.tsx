import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { ProgressBar, StepIndicator } from './ProgressBar.tsx';

describe('ProgressBar', () => {
  it('exposes role=progressbar with value, min, max and a label', () => {
    render(<ProgressBar value={3} max={5} label="Packed" valueText="3/5" />);
    const bar = screen.getByRole('progressbar', { name: 'Packed' });
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
  });

  it('always renders the numeric form beside the bar', () => {
    render(<ProgressBar value={3} max={5} label="Packed" valueText="3/5" />);
    expect(screen.getByText('3/5')).toBeVisible();
  });

  it('clamps aria-valuenow to max so the spoken value never exceeds the fill', () => {
    render(<ProgressBar value={9} max={5} label="Packed" valueText="9/5" />);
    const bar = screen.getByRole('progressbar', { name: 'Packed' });
    expect(bar).toHaveAttribute('aria-valuenow', '5');
  });

  it('omits aria-valuenow and aria-valuemax when max is 0 or less — indeterminate, not a confident zero', () => {
    render(<ProgressBar value={3} max={0} label="Packed" valueText="?" />);
    const bar = screen.getByRole('progressbar', { name: 'Packed' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuemax');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });
});

describe('StepIndicator', () => {
  it('uses the text as the accessible source of truth and hides the dots', () => {
    render(<StepIndicator current={2} total={5} text="步驟 2/5" />);
    expect(screen.getByText('步驟 2/5')).toBeVisible();
    const dots = document.querySelector('[aria-hidden="true"]');
    expect(dots).not.toBeNull();
  });
});
