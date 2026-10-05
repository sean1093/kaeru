import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImportPreview } from '../../data/index.ts';
import { backupService } from '../../data/index.ts';
import { setActiveLocale } from '../../i18n/index.ts';
import { DataScreen } from './DataScreen.tsx';

/**
 * S62 component tests (`M2-A3`, #36).
 *
 * The behaviour worth defending here is not that the buttons exist: it is that **nothing
 * is written before it has been described**, that photos stay opt-in with their cost
 * visible, and that a file we refuse produces a sentence rather than an exception.
 */

/**
 * A preview the service would return. The screen is the subject here, so the service is
 * stubbed: what is being defended is that nothing is written until the traveller says so,
 * which is a property of this component and not of the importer.
 */
const aPreview = (overrides: Partial<ImportPreview> = {}): ImportPreview => ({
  schemaVersion: 2,
  exportedAt: '2026-11-20T00:00:00.000Z',
  trips: 1,
  receipts: 3,
  photos: 0,
  conflicts: 0,
  rejectedKeys: [],
  ...overrides,
});

const A_BACKUP = JSON.stringify({ format: 'kaeru.backup', schemaVersion: 2 });

function chooseFile(contents: string, name = 'kaeru-backup-2026-11-20.json'): void {
  const input = screen.getByTestId('import-backup') as HTMLInputElement;
  const file = new File([contents], name, { type: 'application/json' });
  // jsdom will not let a FileList be assigned, so the property is defined directly.
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

beforeEach(() => {
  setActiveLocale('zh-TW');
  vi.spyOn(backupService, 'estimateSize').mockResolvedValue(2_000_000);
});

describe('S62 export (DR-042)', () => {
  it('TC-DATA-015 leaves photos off and shows what including them would cost', async () => {
    render(<DataScreen />);
    const photos = screen.getByTestId('include-photos') as HTMLInputElement;
    expect(photos.checked).toBe(false);
    // The size is the thing that makes the choice informed; a bare checkbox is a guess.
    await waitFor(() => expect(screen.getByTestId('export-size')).not.toHaveTextContent(/^$/));
  });

  it('TC-DATA-015 re-estimates when photos are switched on, so the cost is current', async () => {
    const estimate = vi.spyOn(backupService, 'estimateSize');
    render(<DataScreen />);
    await waitFor(() => expect(estimate).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId('include-photos'));
    await waitFor(() =>
      expect(estimate).toHaveBeenCalledWith(expect.anything(), {
        includePhotos: true,
        includeArchived: true,
      }),
    );
  });
});

describe('S62 import (IA flow I)', () => {
  it('TC-DATA-016 describes the file before writing anything', async () => {
    vi.spyOn(backupService, 'preview').mockResolvedValue(aPreview());
    const write = vi.spyOn(backupService, 'import');

    render(<DataScreen />);
    chooseFile(A_BACKUP);

    const preview = await screen.findByTestId('import-preview');
    expect(preview).toHaveTextContent('行程 1 個');
    // The whole point: a preview is not a dry run that gets committed, it is a path on
    // which no write has happened yet.
    expect(write).not.toHaveBeenCalled();
  });

  it('TC-DATA-016 writes nothing when the preview is cancelled', async () => {
    vi.spyOn(backupService, 'preview').mockResolvedValue(aPreview());
    const write = vi.spyOn(backupService, 'import');

    render(<DataScreen />);
    chooseFile(A_BACKUP);
    fireEvent.click(await screen.findByTestId('cancel-import'));

    await waitFor(() => expect(screen.queryByTestId('import-preview')).toBeNull());
    expect(write).not.toHaveBeenCalled();
  });

  it('TC-DATA-017 imports in the mode the traveller chose, not a default', async () => {
    vi.spyOn(backupService, 'preview').mockResolvedValue(aPreview());
    const write = vi.spyOn(backupService, 'import').mockResolvedValue(aPreview());

    render(<DataScreen />);
    chooseFile(A_BACKUP);
    fireEvent.click(await screen.findByTestId('import-mode-replace'));
    fireEvent.click(screen.getByTestId('confirm-import'));

    await waitFor(() => expect(write).toHaveBeenCalledWith(expect.anything(), A_BACKUP, 'replace'));
  });

  it('TC-DATA-020 explains a file it will not accept, in words, in both locales', async () => {
    render(<DataScreen />);
    chooseFile('{ not json', 'notes.txt');
    await waitFor(() =>
      expect(screen.getByTestId('data-failure')).toHaveTextContent('這個檔案不是有效的 JSON。'),
    );

    setActiveLocale('en');
    await waitFor(() =>
      expect(screen.getByTestId('data-failure')).toHaveTextContent('That file is not valid JSON.'),
    );
  });

  it('TC-DATA-021 says so when the importer refused part of the file (DR-043)', async () => {
    vi.spyOn(backupService, 'preview').mockResolvedValue(
      aPreview({ conflicts: 1, rejectedKeys: ['travelers.0.passportRef'] }),
    );

    render(<DataScreen />);
    chooseFile(A_BACKUP);

    expect(await screen.findByTestId('import-rejected')).toBeVisible();
    // A collision is not a failure, but it is the thing merge-or-replace is about, so it
    // has to be on screen before that choice is made.
    expect(screen.getByTestId('import-conflicts')).toBeVisible();
  });
});

describe('S62 delete all (TC-SEC-005)', () => {
  it('does not delete on the first tap, and offers the export beside the confirmation', async () => {
    const erase = vi.spyOn(backupService, 'deleteAll').mockResolvedValue(undefined);
    render(<DataScreen />);

    fireEvent.click(screen.getByTestId('delete-all'));
    const confirm = await screen.findByTestId('delete-confirm');
    expect(erase).not.toHaveBeenCalled();
    // Offered here rather than three paragraphs up: the moment someone decides to erase
    // everything is exactly when they will not go and find it.
    expect(confirm).toContainElement(screen.getByTestId('export-first'));

    fireEvent.click(screen.getByTestId('confirm-delete'));
    await waitFor(() => expect(erase).toHaveBeenCalledTimes(1));
  });

  it('delivers the modal behaviour the alertdialog role promises', async () => {
    // Claiming the role and not containing focus is worse than not claiming it: a screen
    // reader user is told this is modal and then finds it is not.
    render(<DataScreen />);
    fireEvent.click(screen.getByTestId('delete-all'));

    const dialog = await screen.findByTestId('delete-confirm');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { name: '確定要刪除所有資料？' }),
      ),
    );

    // Escape is a way out that does not require finding a button, and focus goes back
    // where it came from rather than to the top of the document.
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('delete-confirm')).toBeNull());
    expect(document.activeElement).toBe(screen.getByTestId('delete-all'));
  });
});
