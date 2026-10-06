import { render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '../i18n/index.ts';
import { AmountDisplay } from './AmountDisplay.tsx';

beforeEach(() => {
  setActiveLocale('en');
});

describe('AmountDisplay', () => {
  it('formats yen as integers with grouping and no decimals (DR-071)', () => {
    render(
      <AmountDisplay
        kind="actual"
        value={12345}
        label="Consumption tax"
        accessibleName="12,345 yen"
      />,
    );
    expect(screen.getByText('12,345')).toBeVisible();
  });

  it('renders zh-TW and en with the same digit grouping (TC-I18N-012)', () => {
    setActiveLocale('zh-TW');
    const { unmount } = render(
      <AmountDisplay
        kind="actual"
        value={1280000}
        label="消費稅"
        accessibleName="1,280,000 日圓"
      />,
    );
    const zh = screen.getByText('1,280,000');
    expect(zh).toBeVisible();
    unmount();

    setActiveLocale('en');
    render(
      <AmountDisplay
        kind="actual"
        value={1280000}
        label="Consumption tax"
        accessibleName="1,280,000 yen"
      />,
    );
    expect(screen.getByText('1,280,000')).toBeVisible();
  });

  it('renders the ~ prefix visually but the accessible name says "estimated" instead', () => {
    render(
      <AmountDisplay
        kind="estimate"
        value={24860}
        label="Estimated net"
        accessibleName="Estimated net, 24,860 yen"
      />,
    );
    expect(screen.getByText('~')).toBeVisible();
    const spoken = screen.getByText('Estimated net, 24,860 yen');
    expect(spoken).toBeInTheDocument();
    const visual = screen.getByText('~').closest('[aria-hidden="true"]');
    expect(visual).not.toBeNull();
    expect(visual).not.toContainElement(spoken);
  });

  it('renders a received amount with its fee line using a true minus sign', () => {
    render(
      <AmountDisplay
        kind="received"
        value={520}
        label="Received"
        fee={{ value: 20, label: 'Fee' }}
        accessibleName="Received, 520 yen"
      />,
    );
    expect(screen.getByText(/\u2212/)).toBeVisible();
    expect(screen.getByText(/\u2212.*20/)).toBeVisible();
  });

  it('omits the fee line for kinds other than received', () => {
    render(<AmountDisplay kind="actual" value={520} label="Tax" accessibleName="520 yen" />);
    expect(screen.queryByText(/\u2212/)).toBeNull();
  });

  it('distinguishes an unknown fee from a genuinely zero fee on a received amount (R21)', () => {
    const { unmount } = render(
      <AmountDisplay
        kind="received"
        value={520}
        label="Received"
        accessibleName="Received, 520 yen"
      />,
    );
    expect(screen.queryByText(/\u2212/)).toBeNull();
    unmount();

    render(
      <AmountDisplay
        kind="received"
        value={520}
        label="Received"
        fee={{ value: 0, label: 'Fee' }}
        accessibleName="Received, 520 yen"
      />,
    );
    expect(screen.getByText(/\u2212.*0/)).toBeVisible();
  });
});
