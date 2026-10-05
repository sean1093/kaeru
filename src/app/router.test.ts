import { afterEach, describe, expect, it } from 'vitest';
import { collectFeatures } from './registry.ts';
import { currentPath, hrefFor, navigate, routeFromHash, startRouter } from './router.ts';

describe('routeFromHash', () => {
  it('treats an empty or bare hash as the home route', () => {
    expect(routeFromHash('')).toBe('/');
    expect(routeFromHash('#')).toBe('/');
    expect(routeFromHash('#/')).toBe('/');
  });

  it('normalises a trailing slash', () => {
    expect(routeFromHash('#/settings')).toBe('/settings');
    expect(routeFromHash('#/settings/')).toBe('/settings');
  });

  it('drops a query string so deep links with parameters still resolve', () => {
    expect(routeFromHash('#/settings?from=email')).toBe('/settings');
  });

  it('leaves in-page anchors alone so the skip link keeps working', () => {
    expect(routeFromHash('#main')).toBeNull();
    expect(routeFromHash('#section-2')).toBeNull();
  });
});

describe('router', () => {
  let stop: (() => void) | undefined;

  afterEach(() => {
    stop?.();
    window.location.hash = '';
  });

  it('tracks the address bar', async () => {
    window.location.hash = hrefFor('/settings');
    stop = startRouter();
    expect(currentPath.value).toBe('/settings');

    const { promise, resolve } = Promise.withResolvers<void>();
    window.addEventListener('hashchange', () => resolve(), { once: true });
    navigate('/');
    await promise;
    expect(currentPath.value).toBe('/');
  });

  it('keeps the current route when an in-page anchor is followed', async () => {
    window.location.hash = hrefFor('/settings');
    stop = startRouter();

    const { promise, resolve } = Promise.withResolvers<void>();
    window.addEventListener('hashchange', () => resolve(), { once: true });
    window.location.hash = '#main';
    await promise;
    expect(currentPath.value).toBe('/settings');
  });
});

describe('collectFeatures', () => {
  const stub = (id: string, path: string) =>
    ({ id, path, messages: { 'zh-TW': {}, en: {} }, screen: () => null }) as never;

  it('refuses two features claiming the same route', () => {
    expect(() => collectFeatures([stub('a', '/x'), stub('b', '/x')])).toThrow(
      /claimed by both "a" and "b"/,
    );
  });

  it('accepts distinct routes', () => {
    expect(collectFeatures([stub('a', '/x'), stub('b', '/y')])).toHaveLength(2);
  });
});
