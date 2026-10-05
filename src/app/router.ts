import { computed, type ReadonlySignal, signal } from '@preact/signals';
import type {
  Navigator as NavigatorContract,
  PathTo,
  RouteMatch,
  ScreenRoute,
} from './navigation.ts';
import { pathTo } from './screens.ts';

/**
 * Hash routing, v2.
 *
 * GitHub Pages serves static files only: a reload of `/kaeru/receipts/abc` would 404 unless
 * we ship a 404.html redirect hack. Hashes keep every URL resolvable to the one precached
 * `index.html`, which is also what makes offline deep links work. See ADR 0004.
 *
 * Three things the M0 router could not express, and this one does:
 *
 * - **Parameters.** `/receipts/:receiptId`, with an optional trailing form (`/guide/faq/:entryId?`)
 *   so the FAQ index and a per-question deep link are one route.
 * - **Sheets in the URL.** `?sheet=<id>` on the current route, so browser back closes the
 *   sheet and leaves the screen mounted. An unknown or unpermitted sheet id is ignored
 *   rather than rendering a blank sheet.
 * - **Guards.** A screen with unsaved work asks before it is left, from the back button as
 *   well as from an in-app link.
 *
 * A hash that is not a route — `#main`, the skip link — is still left entirely alone, so
 * in-page anchors keep working.
 */

export interface AppLocation {
  /** The normalised path: no leading `#`, no query, no trailing slash. */
  readonly path: string;
  /** The raw `?sheet=` value, before the matched route gets to accept or reject it. */
  readonly sheet: string | null;
}

export interface MatchedRoute extends RouteMatch {
  readonly route: ScreenRoute;
}

const HOME: AppLocation = { path: '/', sheet: null };

/**
 * Parse a hash into a location, or `null` when it is an in-page anchor. Routes always start
 * with `/`; anything else belongs to the browser.
 */
export function parseHash(hash: string): AppLocation | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const queryAt = raw.indexOf('?');
  const rawPath = (queryAt === -1 ? raw : raw.slice(0, queryAt)).trim();
  if (rawPath === '') return HOME;
  if (!rawPath.startsWith('/')) return null;
  const path = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
  const sheet = queryAt === -1 ? null : new URLSearchParams(raw.slice(queryAt + 1)).get('sheet');
  return { path, sheet: sheet === null || sheet === '' ? null : sheet };
}

export function hrefFor(path: string): string {
  return `#${path}`;
}

// --- Pattern matching -------------------------------------------------------

interface PatternSegment {
  readonly name: string;
  readonly param: boolean;
  readonly optional: boolean;
}

interface CompiledRoute {
  readonly route: ScreenRoute;
  readonly segments: readonly PatternSegment[];
  /** How many leading segments must be present. */
  readonly required: number;
  /** Static segments outrank parameters, so `/receipts/new` beats `/receipts/:receiptId`. */
  readonly specificity: number;
}

function compileRoute(route: ScreenRoute): CompiledRoute {
  const segments: PatternSegment[] = [];
  let required = 0;
  let specificity = 0;
  for (const raw of route.pattern.split('/')) {
    if (raw === '') continue;
    const param = raw.startsWith(':');
    const optional = param && raw.endsWith('?');
    if (!optional) {
      if (segments.length !== required) {
        throw new Error(
          `Route "${route.pattern}" puts a required segment after an optional one; only the last segment may be optional.`,
        );
      }
      required += 1;
    }
    segments.push({ name: param ? raw.slice(1, optional ? -1 : undefined) : raw, param, optional });
    specificity += param ? 1 : 2;
  }
  return { route, segments, required, specificity };
}

function matchSegments(
  compiled: CompiledRoute,
  parts: readonly string[],
): Record<string, string> | null {
  if (parts.length > compiled.segments.length || parts.length < compiled.required) return null;
  const params: Record<string, string> = {};
  for (const [index, segment] of compiled.segments.entries()) {
    const part = parts[index];
    if (part === undefined) break;
    if (!segment.param) {
      if (segment.name !== part) return null;
      continue;
    }
    if (part === '') return null;
    params[segment.name] = decodeURIComponent(part);
  }
  return params;
}

/** Most specific first, so `/receipts/new` is tried before `/receipts/:receiptId`. */
function compileAll(entries: readonly ScreenRoute[]): readonly CompiledRoute[] {
  return entries
    .map(compileRoute)
    .sort((a, b) => b.specificity - a.specificity || b.segments.length - a.segments.length);
}

function matchCompiled(
  candidates: readonly CompiledRoute[],
  location: AppLocation,
): MatchedRoute | null {
  const parts = location.path.split('/').filter((part) => part !== '');
  for (const candidate of candidates) {
    const params = matchSegments(candidate, parts);
    if (!params) continue;
    // A `?sheet=` the route did not declare is dropped: a sheet nobody can render is a grey
    // overlay with no way out.
    const declared = candidate.route.sheets ?? [];
    const sheet =
      location.sheet !== null && declared.includes(location.sheet) ? location.sheet : null;
    return {
      pattern: candidate.route.pattern,
      path: location.path,
      params,
      sheet,
      route: candidate.route,
    };
  }
  return null;
}

/** The route a location resolves to, or null. Pure; the live version is `currentRoute`. */
export function matchRoute(
  entries: readonly ScreenRoute[],
  location: AppLocation,
): MatchedRoute | null {
  return matchCompiled(compileAll(entries), location);
}

// --- Live state -------------------------------------------------------------

export const currentLocation = signal<AppLocation>(HOME);

/** The path alone, for anything that does not care about sheets. */
export const currentPath: ReadonlySignal<string> = computed(() => currentLocation.value.path);

const routes = signal<readonly ScreenRoute[]>([]);

/**
 * Registered by the feature registry at startup; the router owns no route list of its own.
 *
 * Throws naming the route if any of `next` declares a `guard` and no `leaveConfirm` has
 * been registered yet: a guard that cannot ask is strictly worse than no guard at all,
 * because it looks protected and is not. Call `setLeaveConfirm` before registering any
 * guarded route.
 */
export function registerRoutes(next: readonly ScreenRoute[]): void {
  const unconfirmed = leaveConfirm === null && next.find((route) => route.guard);
  if (unconfirmed) {
    throw new Error(
      `Route "${unconfirmed.pattern}" declares a guard but no leaveConfirm is registered. ` +
        'Call setLeaveConfirm before registering it.',
    );
  }
  routes.value = next;
}

export const registeredRoutes: ReadonlySignal<readonly ScreenRoute[]> = routes;

// Compiled once per registration, not once per navigation.
const compiledRoutes = computed(() => compileAll(routes.value));

export const currentRoute: ReadonlySignal<MatchedRoute | null> = computed(() =>
  matchCompiled(compiledRoutes.value, currentLocation.value),
);

// --- Guards -----------------------------------------------------------------

/**
 * Asked before a screen with unsaved work is left. Receives the message key the screen's
 * guard returned; returning false keeps the user where they are.
 *
 * There is no default implementation backed by `window.confirm`: a native dialog renders
 * its buttons in the OS language, so a zh-TW user would see "Leave site? / OK / Cancel" in
 * English regardless of the app's locale — the one surface this app's i18n layer cannot
 * reach. `registerRoutes` enforces that every guarded route has a real confirmation wired
 * up before it can be navigated to, rather than silently falling back to that dialog or,
 * worse, silently allowing the navigation.
 */
export type LeaveConfirm = (messageKey: string) => boolean;

let leaveConfirm: LeaveConfirm | null = null;

/** Replace the confirmation, or pass null to clear it (what the shell is not using). */
export function setLeaveConfirm(confirm: LeaveConfirm | null): void {
  leaveConfirm = confirm;
}

/** True when the move is allowed: no guard, no unsaved work, or the user said leave. */
function mayLeave(target: AppLocation): boolean {
  if (target.path === currentLocation.value.path) return true;
  const guard = currentRoute.value?.route.guard;
  if (!guard) return true;
  const messageKey = guard();
  if (messageKey === null) return true;
  if (!leaveConfirm) {
    throw new Error(
      `Route "${currentRoute.value?.pattern}" declares a guard but no leaveConfirm is registered.`,
    );
  }
  return leaveConfirm(messageKey);
}

// --- Navigation -------------------------------------------------------------

/**
 * Set when `go` has already cleared the guard, so the `hashchange` it causes does not ask a
 * second time.
 */
let guardCleared = false;
/** Set when this session pushed the open sheet, so closing it can go back rather than push. */
let sheetPushed = false;

function withSheet(path: string, sheet: string | null): string {
  return sheet === null ? path : `${path}?sheet=${encodeURIComponent(sheet)}`;
}

function sync(): void {
  const next = parseHash(window.location.hash);
  // An in-page anchor is not a route: leave the current screen exactly where it is.
  if (next === null) return;
  if (next.path === currentLocation.value.path && next.sheet === currentLocation.value.sheet) {
    return;
  }
  if (!guardCleared && !mayLeave(next)) {
    // The address bar has already moved, so put it back without adding a history entry.
    const current = currentLocation.value;
    window.history.replaceState(null, '', hrefFor(withSheet(current.path, current.sheet)));
    return;
  }
  guardCleared = false;
  if (next.sheet === null) sheetPushed = false;
  currentLocation.value = next;
}

export const appNavigator: NavigatorContract = {
  go(path) {
    const target = parseHash(path.startsWith('#') ? path : `#${path}`);
    if (target === null || !mayLeave(target)) return;
    guardCleared = true;
    sheetPushed = false;
    const href = hrefFor(withSheet(target.path, target.sheet));
    if (window.location.hash === href) {
      guardCleared = false;
      return;
    }
    window.location.hash = href;
  },
  replace(path) {
    const target = parseHash(path.startsWith('#') ? path : `#${path}`);
    if (target === null || !mayLeave(target)) return;
    sheetPushed = false;
    // replaceState fires no hashchange, so the signal is updated here.
    window.history.replaceState(null, '', hrefFor(withSheet(target.path, target.sheet)));
    currentLocation.value = target;
  },
  back() {
    window.history.back();
  },
  openSheet(sheet) {
    const current = currentLocation.value;
    if (current.sheet === sheet) return;
    guardCleared = true;
    window.location.hash = hrefFor(withSheet(current.path, sheet));
    sheetPushed = true;
  },
  closeSheet() {
    if (currentLocation.value.sheet === null) return;
    if (sheetPushed) {
      // Back is what the user would have pressed, and it leaves no orphan entry behind.
      sheetPushed = false;
      window.history.back();
      return;
    }
    // Deep-linked straight into the sheet: there is nothing to go back to.
    appNavigator.replace(currentLocation.value.path);
  },
  hrefFor,
  /**
   * The same function, behind the contract's deliberately loose signature. `Navigator` is
   * consumed by code that cannot see the route table — the domain-free UI kit — so the
   * contract cannot express the per-screen narrowing. Anything that can import
   * `screens.ts` should call `pathTo` directly and get the parameters checked.
   */
  pathTo: pathTo as PathTo,
};

/** Starts syncing the signals with the address bar. Returns a stop function. */
export function startRouter(): () => void {
  guardCleared = false;
  sheetPushed = false;
  const parsed = parseHash(window.location.hash);
  currentLocation.value = parsed ?? HOME;
  window.addEventListener('hashchange', sync);
  return () => window.removeEventListener('hashchange', sync);
}
