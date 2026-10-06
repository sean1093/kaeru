import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Field } from './Field.tsx';

describe('Field', () => {
  it('renders the label associated with the control via for/id', () => {
    render(
      <Field id="shop" label="Shop name">
        <input id="shop" />
      </Field>,
    );
    expect(screen.getByLabelText('Shop name')).toBeVisible();
  });

  it('shows the error instead of the helper when both are present', () => {
    render(
      <Field id="amount" label="Amount" helper="Integer yen" error="Enter an amount">
        <input id="amount" />
      </Field>,
    );
    expect(screen.getByText('Enter an amount')).toBeVisible();
    expect(screen.queryByText('Integer yen')).toBeNull();
  });

  it('shows the helper when there is no error', () => {
    render(
      <Field id="amount" label="Amount" helper="Integer yen">
        <input id="amount" />
      </Field>,
    );
    expect(screen.getByText('Integer yen')).toBeVisible();
  });
});
