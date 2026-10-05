import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setActiveLocale } from '../i18n/index.ts';
import type { ScreenRoute } from './navigation.ts';
import { collectFeatures } from './registry.ts';
import {
  appNavigator,
  currentLocation,
  currentPath,
  currentRoute,
  hrefFor,
  matchRoute,
  parseHash,
  registerRoutes,
  setLeaveConfirm,
  startRouter,
} from './router.ts';

const noScreen = () => null;

function route(pattern: string, extra: Partial<ScreenRoute> = {}): ScreenRoute {
  return { pattern, screenIds: ['S10'], chrome: 'tabs', screen: noScreen, ...extra };
}

function nextHashChange(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  window.addEventListener('hashchange', () => resolve(), { once: true });
  return promise;
}

/**
 * Wait for the state a navigation produces, driven by the real `hashchange` event rather
 * than by a delay. More than one change can be in flight at once — `history.back()` runs
 * while an earlier assignment is still queued — so waiting for "the next event" would pass
 * or fail by timing. Waiting for the condition, event by event, does not.
 */
async function until(predicate: () => boolean, what: string): Promise<void> {
  for (let attempt = 0; attempt < 10 && !predicate(); attempt += 1) {
    await nextHashChange();
  }
  if (!predicate()) throw new Error(`Timed out waiting for ${what}`);
}

describe('parseHash', () => {
  it('treats an empty or bare hash as the home route', () => {
    expect(parseHash('')).toEqual({ path: '/', sheet: null });
    expect(parseHash('#')).toEqual({ path: '/', sheet: null });
    expect(parseHash('#/')).toEqual({ path: '/', sheet: null });
  });

  it('normalises a trailing slash', () => {
    expect(parseHash('#/settings')?.path).toBe('/settings');
    expect(parseHash('#/settings/')?.path).toBe('/settings');
  });

  it('keeps the path and the sheet apart', () => {
    expect(parseHash('#/receipts/abc?sheet=operator')).toEqual({
      path: '/receipts/abc',
      sheet: 'operator',
    });
    expect(parseHash('#/receipts/abc?from=email')).toEqual({ path: '/receipts/abc', sheet: null });
    expect(parseHash('#/receipts/abc?sheet=')).toEqual({ path: '/receipts/abc', sheet: null });
  });

  it('leaves in-page anchors alone so the skip link keeps working', () => {
    expect(parseHash('#main')).toBeNull();
    expect(parseHash('#section-2')).toBeNull();
  });
});

describe('matchRoute', () => {
  const routes = [
    route('/'),
    route('/receipts'),
    route('/receipts/new'),
    route('/receipts/:receiptId', { sheets: ['operator', 'not-claiming'] }),
    route('/receipts/:receiptId/edit'),
    route('/guide/faq/:entryId?'),
  ];
  const at = (path: string, sheet: string | null = null) => matchRoute(routes, { path, sheet });

  it('matches a static route', () => {
    expect(at('/')?.pattern).toBe('/');
    expect(at('/receipts')?.pattern).toBe('/receipts');
  });

  it('extracts parameters', () => {
    expect(at('/receipts/abc123')?.params).toEqual({ receiptId: 'abc123' });
    expect(at('/receipts/abc123/edit')?.params).toEqual({ receiptId: 'abc123' });
  });

  it('decodes an escaped parameter', () => {
    expect(at('/receipts/a%2Fb')?.params).toEqual({ receiptId: 'a/b' });
  });

  it('prefers a static segment over a parameter', () => {
    expect(at('/receipts/new')?.pattern).toBe('/receipts/new');
  });

  it('matches an optional trailing parameter with and without it', () => {
    expect(at('/guide/faq')?.params).toEqual({});
    expect(at('/guide/faq/q11')?.params).toEqual({ entryId: 'q11' });
  });

  it('returns null for an unknown path', () => {
    expect(at('/no-such-route')).toBeNull();
    expect(at('/receipts/abc/edit/extra')).toBeNull();
  });

  it('accepts a sheet the route declares', () => {
    expect(at('/receipts/abc', 'not-claiming')?.sheet).toBe('not-claiming');
  });

  it('ignores an unknown sheet rather than rendering a blank one', () => {
    expect(at('/receipts/abc', 'nonsense')?.sheet).toBeNull();
    // Declared by another route, but not by this one.
    expect(at('/receipts/abc/edit', 'operator')?.sheet).toBeNull();
    expect(at('/receipts', 'operator')?.sheet).toBeNull();
  });

  it('refuses a pattern with a required segment after an optional one', () => {
    expect(() =>
      matchRoute([route('/guide/:entryId?/detail')], { path: '/', sheet: null }),
    ).toThrow(/only the last segment may be optional/);
  });
});

describe('router', () => {
  let stop: (() => void) | undefined;

  beforeEach(() => {
    setActiveLocale('en');
    registerRoutes([
      route('/'),
      route('/settings'),
      route('/receipts/:receiptId', { sheets: ['operator'] }),
    ]);
    setLeaveConfirm(() => true);
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    registerRoutes([]);
    setLeaveConfirm(null);
    // A plain assignment queues a hashchange task that can fire during the *next* test's
    // setup and resolve its first `nextHashChange()` wait with an unrelated event.
    // `replaceState` clears the bar synchronously with no event at all.
    window.history.replaceState(null, '', ' ');
  });

  it('restores a deep link with a parameter on a cold start', () => {
    window.location.hash = hrefFor('/receipts/abc123');
    stop = startRouter();

    expect(currentPath.value).toBe('/receipts/abc123');
    expect(currentRoute.value?.params).toEqual({ receiptId: 'abc123' });
    expect(currentRoute.value?.pattern).toBe('/receipts/:receiptId');
  });

  it('tracks the address bar', async () => {
    window.location.hash = hrefFor('/settings');
    stop = startRouter();
    expect(currentPath.value).toBe('/settings');

    appNavigator.go('/');
    await until(() => currentPath.value === '/', 'home');
  });

  it('keeps the current route when an in-page anchor is followed', async () => {
    window.location.hash = hrefFor('/settings');
    stop = startRouter();

    window.location.hash = '#main';
    await until(() => window.location.hash === '#main', 'the anchor to be applied');
    expect(currentPath.value).toBe('/settings');
  });

  it('replaces without a history entry', () => {
    window.location.hash = hrefFor('/settings');
    stop = startRouter();

    appNavigator.replace('/');
    expect(currentPath.value).toBe('/');
    expect(window.location.hash).toBe('#/');
  });

  it('opens a sheet on the current route and leaves the screen mounted', async () => {
    window.location.hash = hrefFor('/receipts/abc');
    stop = startRouter();

    appNavigator.openSheet('operator');
    await until(() => currentRoute.value?.sheet === 'operator', 'the sheet to open');
    expect(window.location.hash).toBe('#/receipts/abc?sheet=operator');
    expect(currentPath.value).toBe('/receipts/abc');
  });

  it('closes the sheet on back, keeping the screen', async () => {
    window.location.hash = hrefFor('/receipts/abc');
    stop = startRouter();
    appNavigator.openSheet('operator');
    await until(() => currentRoute.value?.sheet === 'operator', 'the sheet to open');

    appNavigator.closeSheet();
    await until(() => currentRoute.value?.sheet === null, 'the sheet to close');
    expect(currentPath.value).toBe('/receipts/abc');
  });

  it('closes a deep-linked sheet without leaving the screen', () => {
    window.location.hash = hrefFor('/receipts/abc?sheet=operator');
    stop = startRouter();
    expect(currentRoute.value?.sheet).toBe('operator');

    appNavigator.closeSheet();
    expect(currentPath.value).toBe('/receipts/abc');
    expect(currentRoute.value?.sheet).toBeNull();
    expect(window.location.hash).toBe('#/receipts/abc');
  });

  it('ignores a sheet the route does not declare', () => {
    window.location.hash = hrefFor('/receipts/abc?sheet=nonsense');
    stop = startRouter();
    expect(currentRoute.value?.sheet).toBeNull();
  });

  it('stays put when a guard is declined', () => {
    registerRoutes([route('/', { guard: () => 'draft.unsaved' }), route('/settings')]);
    window.location.hash = '';
    stop = startRouter();
    setLeaveConfirm(() => false);

    appNavigator.go('/settings');
    expect(currentPath.value).toBe('/');
    expect(window.location.hash).toBe('');
  });

  it('navigates when a guard is accepted', async () => {
    registerRoutes([route('/', { guard: () => 'draft.unsaved' }), route('/settings')]);
    stop = startRouter();
    const confirm = vi.fn(() => true);
    setLeaveConfirm(confirm);

    appNavigator.go('/settings');
    await until(() => currentPath.value === '/settings', 'the settings screen');
    // Asked once, not once per hashchange.
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith('draft.unsaved');
  });

  it('asks the guard when the browser moves the hash, not only in-app links', async () => {
    registerRoutes([route('/', { guard: () => 'draft.unsaved' }), route('/settings')]);
    stop = startRouter();
    setLeaveConfirm(() => false);

    window.location.hash = hrefFor('/settings');
    await until(() => window.location.hash === '#/', 'the address bar to be put back');
    expect(currentPath.value).toBe('/');
  });

  it('does not guard opening a sheet on the screen the user is already on', async () => {
    const guard = vi.fn(() => 'draft.unsaved');
    registerRoutes([route('/receipts/:receiptId', { sheets: ['operator'], guard })]);
    window.location.hash = hrefFor('/receipts/abc');
    stop = startRouter();

    appNavigator.openSheet('operator');
    await until(() => currentRoute.value?.sheet === 'operator', 'the sheet to open');
    expect(guard).not.toHaveBeenCalled();
  });

  it('shows the feature wording for the guard key, falling back to the shell wording', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    registerRoutes([route('/', { guard: () => 'app.update.message' }), route('/settings')]);
    stop = startRouter();
    setLeaveConfirm(null);

    appNavigator.go('/settings');
    expect(confirm).toHaveBeenCalledWith('A new version is available.');

    registerRoutes([route('/', { guard: () => 'no.such.key' }), route('/settings')]);
    currentLocation.value = { path: '/', sheet: null };
    appNavigator.go('/settings');
    expect(confirm).toHaveBeenLastCalledWith(
      'You have unsaved changes on this screen. Leave anyway?',
    );
  });
});

describe('collectFeatures', () => {
  const stub = (id: string, path: string) =>
    ({ id, path, messages: { 'zh-TW': {}, en: {} }, screen: noScreen }) as never;

  it('refuses two features claiming the same route', () => {
    expect(() => collectFeatures([stub('a', '/x'), stub('b', '/x')])).toThrow(
      /claimed by both "a" and "b"/,
    );
  });

  it('accepts distinct routes', () => {
    expect(collectFeatures([stub('a', '/x'), stub('b', '/y')])).toHaveLength(2);
  });
});
