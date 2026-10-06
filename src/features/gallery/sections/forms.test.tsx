import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { setActiveLocale } from '../../../i18n/index.ts';
import { FormsSection } from './forms.tsx';

/**
 * Regression coverage for the DR-023 tax-rate specimen (#25, QA re-review on PR #115):
 * the segmented control must stay translated per the active locale and its visible
 * percentages must track `kaeruRules`, not a frozen or hard-coded pair.
 */
describe('FormsSection tax rate specimen', () => {
  it('renders the category helper text in English on first render, not Chinese', () => {
    setActiveLocale('en');
    render(<FormsSection />);
    expect(screen.getByText('Food and drink, not alcohol')).toBeVisible();
    expect(screen.queryByText('食品、飲料（不含酒類）')).toBeNull();
  });

  it('resolves a different rate set when the purchase date moves into another dated window', () => {
    setActiveLocale('en');
    render(<FormsSection />);
    // 2026-11-04 is in the two-rate window (10%, 8%).
    expect(screen.getByText('10%')).toBeVisible();
    expect(screen.getByText('8%')).toBeVisible();
    expect(screen.queryByText('1%')).toBeNull();

    // 2027-06-01 falls in the three-rate window (10%, 1% food, 8% newspapers, UR-08).
    fireEvent.input(screen.getByLabelText('Purchase date'), {
      target: { value: '2027-06-01' },
    });

    expect(screen.getByText('10%')).toBeVisible();
    expect(screen.getByText('1%')).toBeVisible();
    expect(screen.getByText('8%')).toBeVisible();
  });
});
