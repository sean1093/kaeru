import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import type { ChipStatus } from './contracts.ts';
import { StatusChip } from './StatusChip.tsx';

const ALL_STATUSES: readonly ChipStatus[] = [
  'logged',
  'registered',
  'customs_confirmed',
  'refund_pending',
  'refunded',
  'rejected',
  'refund_disputed',
  'not_claiming',
  'needs_action',
  'operator_unknown',
];

describe('StatusChip', () => {
  it.each(ALL_STATUSES)('renders the closed DR-060 state "%s" with its label text', (status) => {
    render(<StatusChip status={status} label={`Label for ${status}`} />);
    expect(screen.getByText(`Label for ${status}`)).toBeVisible();
  });

  it('is a label, not a control: no role=button, no tabindex', () => {
    render(<StatusChip status="refunded" label="Received" />);
    const chip = screen.getByText('Received').closest('span');
    expect(chip).not.toHaveAttribute('role', 'button');
    expect(chip).not.toHaveAttribute('tabindex');
  });

  it('carries an icon alongside the word, so colour is never the only signal', () => {
    render(<StatusChip status="refund_disputed" label="Amount disputed" />);
    const chip = screen.getByText('Amount disputed').closest('[data-status]');
    expect(chip?.querySelector('svg')).not.toBeNull();
  });
});
