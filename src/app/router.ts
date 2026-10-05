import { signal } from '@preact/signals';

/**
 * Hash routing.
 *
 * GitHub Pages serves static files only: a reload of `/kaeru/settings` would 404 unless
 * we ship a 404.html redirect hack. Hashes keep every URL resolvable to the one
 * precached `index.html`, which is also what makes offline deep links work. See ADR 0004.
 */

/**
 * The route a hash points at, or `null` when the hash is an in-page anchor such as the
 * skip link's `#main`. Routes always start with `/`; anything else is left to the
 * browser so plain fragment links keep working.
 */
export function routeFromHash(hash: string): string | null {
  const raw = (hash.replace(/^#/, '').split('?')[0] ?? '').trim();
  if (raw === '') return '/';
  if (!raw.startsWith('/')) return null;
  return raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export function hrefFor(path: string): string {
  return `#${path}`;
}

export const currentPath = signal<string>('/');

export function navigate(path: string): void {
  window.location.hash = hrefFor(path);
}

/** Starts syncing the signal with the address bar. Returns a stop function. */
export function startRouter(): () => void {
  const sync = () => {
    const route = routeFromHash(window.location.hash);
    if (route !== null) currentPath.value = route;
  };
  sync();
  window.addEventListener('hashchange', sync);
  return () => window.removeEventListener('hashchange', sync);
}
