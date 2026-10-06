import { signal } from '@preact/signals';

/**
 * Whether the browser believes it is online.
 *
 * For the few places where being offline changes what a traveller can do — wireframes,
 * "Offline": outbound operator links, the Visit Japan Web handoff, the QR scanner's
 * link-out. Everything else in Kaeru is local and behaves identically offline, so nothing
 * else should consult this.
 *
 * `navigator.onLine` can say "online" on a network that reaches nothing. Then the link opens
 * to the browser's own error page, which is what happens without this signal at all; it
 * errs only in the harmless direction.
 */
export const online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    online.value = true;
  });
  window.addEventListener('offline', () => {
    online.value = false;
  });
}
