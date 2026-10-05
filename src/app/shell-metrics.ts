/**
 * Publishes the sticky navigation's measured block size to the scrolling root, where
 * `--shell-nav-block-size` is declared with a token-derived fallback.
 *
 * The fallback in `base.css` is a claim about the nav that nothing enforces once a label
 * wraps at 320 px, a user raises their text size, or a safe-area inset appears on rotate.
 * Measuring turns the claim into an observation: the constant is the floor that applies
 * before first paint and without JavaScript, and this is the truth afterwards.
 *
 * Original design by FrontendEngE.
 */

const PROPERTY = '--shell-nav-block-size';

/**
 * Starts observing `element` and keeps the custom property in step with its height.
 * Returns a function that stops observing and restores the declared fallback.
 */
export function observeShellMetrics(element: Element): () => void {
  const root = document.documentElement;
  let published = '';

  const publish = (blockSize: number): void => {
    // Rounded before comparing, not after: a fractional safe-area inset otherwise
    // produces a new string on every frame, and a ResizeObserver whose callback mutates
    // style on every frame is one layout dependency away from a notification loop.
    const next = `${Math.round(blockSize)}px`;
    if (next === published) return;
    published = next;
    root.style.setProperty(PROPERTY, next);
  };

  // Synchronously, so the first paint after a locale switch reserves the measured height
  // rather than trailing the first observer callback by a frame.
  publish(element.getBoundingClientRect().height);

  if (typeof ResizeObserver === 'undefined') {
    return () => {
      root.style.removeProperty(PROPERTY);
    };
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const border = entry.borderBoxSize?.[0];
    publish(border ? border.blockSize : entry.contentRect.height);
  });
  observer.observe(element);

  return () => {
    observer.disconnect();
    root.style.removeProperty(PROPERTY);
  };
}
