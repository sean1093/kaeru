import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { List, ListRow } from './List.tsx';

describe('ListRow', () => {
  it('is a single announce unit: one link per row, not fragments', () => {
    render(
      <List label="Receipts">
        <ListRow
          href="#/receipts/1"
          primary="Matsumoto Kiyoshi"
          secondary="4 Nov · ¥12,800"
          status={{ status: 'logged', label: 'Logged' }}
        />
      </List>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName(/Matsumoto Kiyoshi/);
    expect(link.querySelectorAll('a, button')).toHaveLength(0);
  });

  it('renders the chevron as decorative when the row is interactive', () => {
    render(
      <List>
        <ListRow href="#/x" primary="Shop" />
      </List>,
    );
    const svg = screen.getByRole('link').querySelector('svg[aria-hidden="true"]');
    expect(svg).not.toBeNull();
  });

  it('omits a chevron and any link/button role for a display-only row', () => {
    render(
      <List>
        <ListRow primary="Shop" />
      </List>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('uses onActivate as a button for multi-select rows and reflects selected state', () => {
    const onActivate = vi.fn();
    render(
      <List>
        <ListRow onActivate={onActivate} primary="Shop" selected />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Shop' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('wraps a very long bilingual shop name instead of truncating it (TC-I18N-010)', () => {
    render(
      <List>
        <ListRow href="#/x" primary="松本清薬粧店新宿東口駅前店" secondary="4 Nov" last />
      </List>,
    );
    expect(screen.getByText('松本清薬粧店新宿東口駅前店')).toBeVisible();
  });
});

describe('List', () => {
  it('renders a real <ul> so the row count is announced', () => {
    render(
      <List label="Receipts">
        <ListRow href="#/1" primary="A" />
        <ListRow href="#/2" primary="B" last />
      </List>,
    );
    const list = screen.getByRole('list', { name: 'Receipts' });
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
