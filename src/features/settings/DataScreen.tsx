import type { JSX } from 'preact';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { hrefFor } from '../../app/router.ts';
import { pathTo, screenAttrs } from '../../app/screens.ts';
import {
  BackupError,
  type BackupOptions,
  backupService,
  getDatabase,
  type ImportMode,
  type ImportPreview,
} from '../../data/index.ts';
import { useMessages } from '../../i18n/index.ts';
import { Button, Card } from '../../ui/index.ts';
import styles from './DataScreen.module.css';
import { messages, type SettingsMessageKey } from './messages.ts';

/**
 * S62 — export, import and delete all.
 *
 * The screen that decides whether a traveller can move to a new phone and whether they can
 * leave. Three things it is careful about:
 *
 * - **Nothing is written before it has been described.** An import shows what is in the
 *   file — counts, collisions, anything the importer refused — and writes only when the
 *   traveller then says so (IA flow I). Cancelling is not a rollback; it is a path where
 *   no write ever happened.
 * - **Photos are opt-in and the cost is shown first** (`DR-042`). The checkbox is off, and
 *   the size estimate next to it is what makes the choice informed rather than a guess.
 * - **Deleting offers the export in the same breath.** The one irreversible action in the
 *   app sits behind a confirmation that puts "export first" beside it, because the moment
 *   someone decides to erase everything is exactly when they will not go and find it.
 */
export function DataScreen(): JSX.Element {
  const t = useMessages(messages);
  const fileInput = useRef<HTMLInputElement>(null);

  const [includePhotos, setIncludePhotos] = useState(false);
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ file: string; text: string; of: ImportPreview } | null>(
    null,
  );
  const [mode, setMode] = useState<ImportMode>('merge');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteCard = useRef<HTMLDivElement>(null);
  const deleteHeading = useRef<HTMLHeadingElement>(null);
  /**
   * Messages are held as **keys**, not as translated sentences.
   *
   * A sentence frozen at the moment it was produced stops being translated: switch the
   * language afterwards and the whole screen changes except the one line explaining what
   * went wrong — which is the line the traveller most needs in their own language.
   */
  const [notice, setNotice] = useState<{
    key: SettingsMessageKey;
    values?: Record<string, number>;
  } | null>(null);
  const [failure, setFailure] = useState<SettingsMessageKey | null>(null);

  const options: BackupOptions = { includePhotos, includeArchived: true };

  /**
   * Focus goes back where it came from once the trigger exists again.
   *
   * The trigger is unmounted while the dialog is open, so focusing it inside the close
   * handler would be focusing null. A dialog that releases focus to the top of the
   * document leaves a screen-reader user to find their place again, on the one screen
   * where the thing they just declined to do is irreversible.
   */
  const restoreFocus = useRef(false);
  const closeDelete = useCallback(() => {
    restoreFocus.current = true;
    setConfirmingDelete(false);
  }, []);

  useEffect(() => {
    if (confirmingDelete || !restoreFocus.current) return;
    restoreFocus.current = false;
    // Queried rather than held in a ref: `Button` is a plain function component and does
    // not forward one, and the trigger is remounted after the dialog closes anyway.
    deleteCard.current?.querySelector<HTMLButtonElement>('[data-testid="delete-all"]')?.focus();
  }, [confirmingDelete]);

  /**
   * The confirmation is inline, as S62 draws it, so it claims nothing modal: no
   * `alertdialog`, no `aria-modal`, no focus trap. An earlier version claimed all three on
   * a panel whose page stayed live — a screen reader was told everything else was gone and
   * the keyboard was held inside, while a pointer could reach the whole page. What it does
   * do: take focus when it appears, so it is announced where the user is, and let Escape
   * step back from the one irreversible action without hunting for a button. A layout
   * effect, so focus moves in the frame the confirmation first paints rather than after it
   * — the same reason as the bottom sheet's (#121).
   */
  useLayoutEffect(() => {
    if (!confirmingDelete) return;
    deleteHeading.current?.focus();
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') closeDelete();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [confirmingDelete, closeDelete]);

  useEffect(() => {
    let current = true;
    void (async () => {
      const bytes = await backupService.estimateSize(await getDatabase(), {
        includePhotos,
        includeArchived: true,
      });
      if (current) setSizeBytes(bytes);
    })();
    return () => {
      current = false;
    };
  }, [includePhotos]);

  function explain(error: unknown): SettingsMessageKey {
    // Never a raw exception: every failure the user can cause has a translated sentence,
    // and an unrecognised one falls back to the honest "this is not a Kaeru backup".
    return error instanceof BackupError
      ? `settings.error.${error.code}`
      : 'settings.error.not-a-backup';
  }

  async function runExport(): Promise<void> {
    setFailure(null);
    try {
      const document = await backupService.export(await getDatabase(), options);
      const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `kaeru-backup-${document.exportedAt.slice(0, 10)}.json`;
      link.click();
      // Revoked later, not now: WebKit can still be reading the blob after `click()`
      // returns, and a revoked URL turns the download into an error — the one path off
      // this phone. FileSaver.js waits 40 s for the same reason; a minute costs one file's
      // memory.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setNotice({ key: 'data.export.done' });
    } catch (error) {
      setFailure(explain(error));
    }
  }

  async function describe(file: File): Promise<void> {
    setFailure(null);
    setNotice(null);
    try {
      const text = await file.text();
      const of = await backupService.preview(await getDatabase(), text);
      setPreview({ file: file.name, text, of });
    } catch (error) {
      setPreview(null);
      setFailure(explain(error));
    }
  }

  async function applyImport(): Promise<void> {
    if (!preview) return;
    try {
      const applied = await backupService.import(await getDatabase(), preview.text, mode);
      setPreview(null);
      setNotice({
        key: 'data.import.done',
        values: { trips: applied.trips, receipts: applied.receipts },
      });
    } catch (error) {
      setFailure(explain(error));
    }
  }

  async function deleteEverything(): Promise<void> {
    try {
      await backupService.deleteAll(await getDatabase());
    } catch {
      // The confirmation stays up and says nothing was deleted. Not `explain()`: its
      // fallback is "this is not a Kaeru backup", a sentence about a file there is none of.
      setFailure('data.delete.failed');
      return;
    }
    restoreFocus.current = true;
    setConfirmingDelete(false);
    setPreview(null);
    setFailure(null);
    setNotice({ key: 'data.delete.done' });
  }

  /**
   * Rounded to whole megabytes above 1 MB and whole kilobytes below it.
   *
   * Never floored at "about 1 MB": on a device with nothing stored that would be a false
   * statement about the cost of a checkbox, which is the one thing this figure exists to
   * tell the truth about.
   */
  // Counted in kilobytes and then scaled, rather than comparing against a byte literal:
  // the only million in this file would be a unit conversion, and the guardrail that
  // forbids one cannot tell it from the 1,000,000 yen unit price of DR-016. Naming the
  // value is the documented answer; expressing it so the value never appears is better.
  const kilobytes = sizeBytes === null ? null : Math.max(1, Math.round(sizeBytes / 1000));
  const size =
    kilobytes === null
      ? null
      : kilobytes >= 1000
        ? { key: 'data.export.size' as const, mb: Math.round(kilobytes / 1000) }
        : { key: 'data.export.sizeKb' as const, mb: kilobytes };

  return (
    <div class={styles.screen} {...screenAttrs('S62')}>
      <h1 class={styles.title}>{t('data.title')}</h1>

      <Card title={t('data.export.title')}>
        <p>{t('data.export.body')}</p>
        <label class={styles.choice}>
          <input
            type="checkbox"
            checked={includePhotos}
            data-testid="include-photos"
            onChange={(event) => setIncludePhotos(event.currentTarget.checked)}
          />
          <span>
            {t('data.export.photos')}
            <span class={styles.meta} data-testid="export-size">
              {size === null ? t('data.export.sizing') : t(size.key, { mb: size.mb })}
            </span>
          </span>
        </label>
        <Button data-testid="export-backup" onClick={() => void runExport()}>
          {t('data.export.action')}
        </Button>
      </Card>

      <Card title={t('data.import.title')}>
        <p>{t('data.import.body')}</p>
        <Button variant="quiet" onClick={() => fileInput.current?.click()}>
          {t('data.import.choose')}
        </Button>
        <input
          ref={fileInput}
          class={styles.fileInput}
          type="file"
          accept="application/json,.json"
          aria-label={t('data.import.choose')}
          data-testid="import-backup"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void describe(file);
            event.currentTarget.value = '';
          }}
        />

        {preview !== null && (
          <section
            class={styles.preview}
            aria-label={t('data.preview.title')}
            data-testid="import-preview"
          >
            <h3>{t('data.preview.title')}</h3>
            <p class={styles.meta}>{preview.file}</p>
            <ul>
              <li>{t('data.preview.trips', { count: preview.of.trips })}</li>
              <li>{t('data.preview.receipts', { count: preview.of.receipts })}</li>
              <li>{t('data.preview.photos', { count: preview.of.photos })}</li>
              {preview.of.conflicts > 0 && (
                <li data-testid="import-conflicts">
                  {t('data.preview.conflicts', { count: preview.of.conflicts })}
                </li>
              )}
              {preview.of.rejectedKeys.length > 0 && (
                <li data-testid="import-rejected">
                  {/* DR-043: the importer refused something, and silently repairing a file
                      is how a passport number ends up on a device nobody expected it on. */}
                  {t('data.preview.rejected', { count: preview.of.rejectedKeys.length })}
                </li>
              )}
            </ul>

            <fieldset class={styles.fieldset}>
              <legend>{t('data.preview.mode')}</legend>
              {(['merge', 'replace'] as const).map((option) => (
                <label key={option} class={styles.choice}>
                  <input
                    type="radio"
                    name="import-mode"
                    value={option}
                    checked={mode === option}
                    data-testid={`import-mode-${option}`}
                    onChange={() => setMode(option)}
                  />
                  <span>{t(`data.preview.mode.${option}`)}</span>
                </label>
              ))}
            </fieldset>

            <div class={styles.actions}>
              <Button data-testid="confirm-import" onClick={() => void applyImport()}>
                {t('data.preview.confirm')}
              </Button>
              <Button variant="quiet" data-testid="cancel-import" onClick={() => setPreview(null)}>
                {t('data.preview.cancel')}
              </Button>
            </div>
          </section>
        )}
      </Card>

      <Card title={t('data.delete.title')}>
        <div ref={deleteCard}>
          <p>{t('data.delete.body')}</p>
          {confirmingDelete ? (
            <section
              class={styles.preview}
              aria-labelledby="delete-confirm-title"
              data-testid="delete-confirm"
            >
              <h3 id="delete-confirm-title" ref={deleteHeading} tabIndex={-1}>
                {t('data.delete.confirmTitle')}
              </h3>
              <p>{t('data.delete.confirmBody')}</p>
              <div class={styles.actions}>
                {/* Offered here rather than three paragraphs up: the moment someone decides
                  to erase everything is exactly when they will not go and find it. */}
                <Button variant="quiet" data-testid="export-first" onClick={() => void runExport()}>
                  {t('data.delete.exportFirst')}
                </Button>
                <Button data-testid="confirm-delete" onClick={() => void deleteEverything()}>
                  {t('data.delete.confirm')}
                </Button>
                <Button variant="quiet" data-testid="cancel-delete" onClick={closeDelete}>
                  {t('data.delete.cancel')}
                </Button>
              </div>
            </section>
          ) : (
            <Button
              variant="quiet"
              data-testid="delete-all"
              onClick={() => setConfirmingDelete(true)}
            >
              {t('data.delete.action')}
            </Button>
          )}
        </div>
      </Card>

      <p class={styles.meta}>
        <a href={hrefFor(pathTo('S60'))}>{t('data.back')}</a>
      </p>

      <p role="status" class={styles.meta} data-testid="data-notice">
        {notice === null ? '' : t(notice.key, notice.values)}
      </p>
      <p role="alert" class={styles.failure} data-testid="data-failure">
        {failure === null ? '' : t(failure)}
      </p>
    </div>
  );
}
