import type { JSX } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useId, useRef } from 'preact/hooks';
import styles from './BottomSheet.module.css';
import type { BottomSheetProps } from './contracts.ts';

/** Everything focusable inside the sheet, in tab order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Past this, a downward drag is a dismissal rather than a scroll nudge. */
const SWIPE_CLOSE_PX = 72;

/**
 * `components.md` section 12.
 *
 * Browser back closes the sheet too, but that is not this component's job: sheet state
 * lives in the URL as `?sheet=<id>` on the current route (`navigation.ts`), so back is
 * already a route change and the screen hands us `open: false`. What is here is
 * everything a URL cannot do — the focus trap, the restore, Escape, the scrim, the drag,
 * and making the rest of the page `inert` so a screen reader cannot wander behind it.
 */
export function BottomSheet({
  title,
  open,
  onClose,
  children,
}: BottomSheetProps): JSX.Element | null {
  const headingId = useId();
  const layerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const dragStartY = useRef<number | null>(null);

  // Remember the trigger before the sheet takes focus, and give it back on close.
  useEffect(() => {
    if (!open) return;
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    const first = sheet?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? sheet)?.focus();
    return () => {
      // A trigger that has since left the document would send focus to `<body>`, which is
      // a worse place to land than where the user was.
      const trigger = returnFocusTo.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  /**
   * The background is inert while the sheet is up: not clickable, not reachable by tab,
   * and — the part that only this does — not readable by a screen reader walking the
   * document, because browse mode follows the DOM rather than tab order.
   *
   * The sheet is portalled to `<body>` so that "everything that is not the sheet" is
   * exactly body's other children. Rendered inline it would sit inside `#app`, which is
   * body's only element child, so the filter would remove the only candidate and the loop
   * would run over nothing — the mechanism silently absent while the focus trap kept every
   * keyboard assertion passing (found by QALead on #121).
   */
  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    const background = [...document.body.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node !== layerRef.current && !node.contains(sheet),
    );
    // The attribute rather than the property: `[inert]` is what a stylesheet, a test and
    // an older engine can all see, and setting the property does not always reflect.
    const marked = background.filter((node) => !node.hasAttribute('inert'));
    for (const node of marked) node.setAttribute('inert', '');
    return () => {
      for (const node of marked) node.removeAttribute('inert');
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...(sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    // `inert` already stops tab leaving forwards in a real browser; this closes the loop
    // for the backwards case and for environments that do not implement it.
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return createPortal(
    <div class={styles.layer} ref={layerRef}>
      {/* The scrim is a button so a tap closes the sheet for pointer and keyboard alike,
          and is hidden from the accessibility tree because Escape is the documented way
          out and a second unlabelled control would only add noise. */}
      <button
        type="button"
        class={styles.scrim}
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        class={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        ref={sheetRef}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          dragStartY.current = event.clientY;
        }}
        onPointerUp={(event) => {
          const start = dragStartY.current;
          dragStartY.current = null;
          if (start !== null && event.clientY - start > SWIPE_CLOSE_PX) onClose();
        }}
      >
        <span class={styles.grabber} aria-hidden="true" />
        <h2 class={styles.title} id={headingId}>
          {title}
        </h2>
        <div class={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
