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
});

describe('StepIndicator', () => {
  it('uses the text as the accessible source of truth and hides the dots', () => {
    render(<StepIndicator current={2} total={5} text="步驟 2/5 · Step 2 of 5" />);
    expect(screen.getByText('步驟 2/5 · Step 2 of 5')).toBeVisible();
    const dots = document.querySelector('[aria-hidden="true"]');
    expect(dots).not.toBeNull();
  });
});
