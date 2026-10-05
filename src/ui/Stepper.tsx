import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Banner } from './Banner.tsx';
import { Button } from './Button.tsx';
import type { CountdownProps, StepperProps } from './contracts.ts';
import { CloseIcon } from './icons.tsx';
import { StepIndicator } from './ProgressBar.tsx';
import styles from './Stepper.module.css';

/**
 * `components.md` section 9. The countdown to the "be at the airport by" time (`UJ-032`).
 *
 * `role="timer"` rather than a bare paragraph, for two reasons that happen to agree: a
 * generic element cannot carry an accessible name, so `aria-label` would be ignored and
 * the countdown would read as bare numerals; and `timer` is the role whose implicit live
 * politeness is already `off`.
 *
 * That `off` is the whole accessibility design of this element. It updates once a minute,
 * and a region that announces every minute to someone standing in a customs queue is
 * noise they learn to ignore — at which point the one announcement that matters is gone
 * too. It is read on demand, never pushed.
 */
function Countdown({ text, urgent, accessibleName }: CountdownProps): JSX.Element {
  return (
    <p
      class={`${styles.countdown} ${urgent ? styles.urgent : ''}`}
      role="timer"
      aria-live="off"
      aria-label={accessibleName}
    >
      {text}
    </p>
  );
}

/**
 * `components.md` section 9. The Airport Mode shell: full viewport, no bottom navigation,
 * no floating action button.
 *
 * Three decisions here are load-bearing rather than stylistic.
 *
 * **The primary button never greys out.** When the step has unresolved rows, `onAdvance`
 * returns which row blocked it and how many remain; the stepper scrolls there, moves
 * focus and announces the count. A disabled button in a queue is a dead end — the person
 * holding the phone may have a reason we cannot see, so this is friction, never a cage
 * (IA flow F, `UJ-024`).
 *
 * **The banner is rendered here, once, by the shell.** It is the non-dismissible "do not
 * check your bags yet" state that persists across every step and clears only at step 4
 * (`UJ-026`, `UJ-031`). It carries no live region of its own: a permanently-present
 * message that re-announces on every step change is one the user tunes out, and this is
 * the message that must never become noise.
 *
 * **Leaving is explicit and keeps progress.** There is a close control and no "back" that
 * could be mistaken for one — abandoning the procedure partway counts as having had no
 * customs confirmation at all, and nobody compensates the result (`DR-032`).
 */
export function Stepper({
  step,
  title,
  countdown,
  onClose,
  closeLabel,
  primary,
  secondary,
  banner,
  children,
}: StepperProps): JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announcementRef = useRef<HTMLParagraphElement>(null);

  // Focus lands on the step heading at every step change, so a screen-reader user starts
  // at the top of the new step rather than wherever the old step's DOM left them.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the step number is the change.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step.current]);

  const onAdvance = () => {
    const blocked = primary.onAdvance();
    if (!blocked) return;
    const row = document.querySelector<HTMLElement>(`[data-row-id="${blocked.blockedBy}"]`);
    // Focus is the load-bearing half and works everywhere; scrolling is the courtesy, and
    // jsdom does not implement it.
    row?.scrollIntoView?.({ block: 'center' });
    // Focus the control inside the row rather than the row, so the user lands on the thing
    // they have to act on.
    (row?.querySelector<HTMLElement>('input, button, a') ?? row)?.focus();
    // A live region announces on *mutation*, and writing the same string twice is not a
    // mutation — so pressing Next a second time against the same blocker would say
    // nothing, at the exact moment the user is most confused about why they did not move.
    // Clearing first and setting on the next task makes the second press a real change.
    const region = announcementRef.current;
    if (region) {
      const message = primary.blockedAnnouncement(blocked.count);
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 0);
    }
  };

  return (
    <section class={styles.stepper}>
      <header class={styles.header}>
        <button type="button" class={styles.close} onClick={onClose}>
          <span class={styles.closeIcon} aria-hidden="true">
            <CloseIcon />
          </span>
          <span class={styles.closeLabel}>{closeLabel}</span>
        </button>
        <StepIndicator {...step} />
        {countdown ? <Countdown {...countdown} /> : null}
      </header>

      {banner ? (
        <div class={styles.banner}>
          <Banner {...banner} />
        </div>
      ) : null}

      <div class={styles.body}>
        <h1 class={styles.title} tabIndex={-1} ref={headingRef}>
          {title}
        </h1>
        {children}
      </div>

      <footer class={styles.footer}>
        <Button variant="primary" size="airport" fullWidth onClick={onAdvance}>
          {primary.label}
        </Button>
        {secondary ? (
          <Button variant="quiet" fullWidth onClick={secondary.onActivate}>
            {secondary.label}
          </Button>
        ) : null}
      </footer>

      {/* Polite, and written to only when the advance gate actually blocks — so it carries
          one message at the moment the user pressed a button and expected to move. */}
      <p class={styles.announcement} aria-live="polite" ref={announcementRef} />
    </section>
  );
}
