import { type ComponentChildren, type JSX, render } from 'preact';
import { useId, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import styles from './BottomSheet.module.css';
import type { BottomSheetProps } from './contracts.ts';

/** Everything focusable inside the sheet, in tab order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Past this, a downward drag is a dismissal rather than a scroll nudge. */
const SWIPE_CLOSE_PX = 72;

/**
 * Renders `children` into a root of its own, appended to `<body>`.
 *
 * Not `preact/compat`'s `createPortal`: ADR 0003 admits compat only with an ADR of its own,
 * and on #121 it cost every page 1.2 kB gzip with no sheet anywhere in the product — the
 * package patches Preact's global options on import, so the bundler keeps it for that side
 * effect whether or not anything calls it, and the patching re-maps event props app-wide.
 * A separate root is the core-only equivalent with one difference: context does not cross
 * it. Nothing in Kaeru uses context; state travels as signals and props.
 */
function BodyPortal({ children }: { children: ComponentChildren }): null {
  const host = useMemo(() => document.createElement('div'), []);
  useLayoutEffect(() => {
    document.body.append(host);
    return () => {
      render(null, host);
      host.remove();
    };
  }, [host]);
  // Every render of the owner re-renders the portal, so its content tracks the owner's
  // props and closures exactly as inline children would.
  useLayoutEffect(() => {
    // biome-ignore lint/complexity/noUselessFragments: render() takes one child, and children may be an array.
    render(<>{children}</>, host);
  });
  return null;
}

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
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  /**
   * While the sheet is up the rest of the page is inert — not clickable, not reachable by
   * tab, and, the part only `inert` does, not readable by a screen reader walking the
   * document, because browse mode follows the DOM rather than tab order. The sheet lives in
   * its own root on `<body>`, so "everything that is not the sheet" is exactly body's other
   * children (rendered inline, it would sit inside `#app`, body's only element child, and
   * the loop would run over nothing — found by QALead on #121).
   *
   * One effect, because the teardown order is the contract: the page stops being inert
   * **before** focus goes back to the trigger. A trigger inside an inert subtree cannot
   * take focus, so restoring first drops the user on `<body>` — which is what two separate
   * effects did, measured in a browser on #121; jsdom implements neither `inert` nor its
   * effect on focus, so only the e2e suite can see it.
   *
   * A layout effect, so the sheet takes focus in the frame it first paints. After paint
   * there is a frame with the sheet on screen and focus still on the trigger, in a page not
   * yet inert: an Escape pressed then goes nowhere. The portal renders in its own layout
   * effect, which runs first, so the sheet is in the document by now.
   */
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = document.activeElement;
    const sheet = sheetRef.current;
    // The attribute rather than the property: `[inert]` is what a stylesheet, a test and
    // an older engine can all see, and setting the property does not always reflect.
    const marked = [...document.body.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && !node.contains(sheet) && !node.hasAttribute('inert'),
    );
    for (const node of marked) node.setAttribute('inert', '');
    (sheet?.querySelector<HTMLElement>(FOCUSABLE) ?? sheet)?.focus();
    return () => {
      for (const node of marked) node.removeAttribute('inert');
      // A trigger that has since left the document would send focus to `<body>`, which is
      // a worse place to land than where the user was.
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
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

  return (
    <BodyPortal>
      <div class={styles.layer}>
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
        >
          {/* The drag handle is the header, not the whole sheet: a drag that starts in the
            content is a scroll or a text selection, never a dismissal. Capturing the
            pointer keeps a mouse drag that leaves the header ending here; touch is
            captured implicitly, and jsdom implements neither. */}
          <div
            class={styles.header}
            onPointerDown={(event) => {
              dragStartY.current = event.clientY;
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onPointerUp={(event) => {
              const start = dragStartY.current;
              dragStartY.current = null;
              if (start !== null && event.clientY - start > SWIPE_CLOSE_PX) onClose();
            }}
            onPointerCancel={() => {
              dragStartY.current = null;
            }}
          >
            <span class={styles.grabber} aria-hidden="true" />
            <h2 class={styles.title} id={headingId}>
              {title}
            </h2>
          </div>
          <div class={styles.content} data-testid="sheet-content">
            {children}
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
