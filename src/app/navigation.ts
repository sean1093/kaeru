/**
 * Navigation contract v2.
 *
 * Contract module: types only. Implemented by M1-5.
 *
 * M0 shipped a flat router: one path per feature, one tab per feature. M2 needs three
 * things it cannot express — nested routes with parameters (`/receipts/:id`), sheets that
 * are part of the URL so browser back closes them, and chrome that differs per screen
 * (tabs, full-screen flow, Airport Mode takeover). This is that contract, and it is the
 * one every M2 track consumes, so it lands in M1 before feature work starts.
 *
 * Routing stays hash-based (ADR 0004).
 */
import type { ComponentType } from 'preact';
import type { MessageBundle } from '../i18n/index.ts';
import type { BannerProps, BottomNavItem, Icon } from '../ui/contracts.ts';

/** A pattern with `:name` segments, e.g. `/receipts/:receiptId`. */
export type RoutePattern = string;

export interface RouteMatch {
  pattern: RoutePattern;
  /** The normalised path, without the leading `#` and without the query. */
  path: string;
  params: Readonly<Record<string, string>>;
  /**
   * The open sheet, taken from `?sheet=<id>` on the current route.
   *
   * The IA sketches this as `/receipts/new#operator`; a second `#` cannot survive hash
   * routing, so the sheet is a query parameter instead. The property the IA actually asks
   * for is preserved: the sheet is part of the URL, so browser back closes the sheet
   * rather than leaving the screen.
   *
   * A consequence worth stating: deep links **into** a screen cannot use a fragment
   * either. The FAQ's per-question link, which the fee warning on S2B opens, is a path
   * segment (`/guide/faq/:entryId`), not `#q11`.
   */
  sheet: string | null;
}

/**
 * How much of the shell a screen keeps.
 * - `tabs`: app bar and bottom navigation (the default).
 * - `fullscreen`: no bottom navigation, close affordance instead of back — onboarding, add receipt.
 * - `mode`: Airport Mode. No navigation, no FAB, the Stepper owns the viewport.
 */
export type Chrome = 'tabs' | 'fullscreen' | 'mode';

export interface ScreenRoute {
  pattern: RoutePattern;
  /**
   * The screen ids this route can render. The inventory is **not** 1:1 with routes: 46 ids
   * resolve to 33 routes, nine states and four sheets — several ids are states of another screen at the
   * same URL — S29 and S2B are states of S22, S28 is the empty state of S20, S11 to S14
   * are the phases of Home, and S34 and S35 are outcome states of S33. The live component
   * writes the id it is actually showing into `data-screen`, so QA can assert S13 or S29
   * rather than only the host route.
   */
  screenIds: readonly ScreenId[];
  chrome: Chrome;
  screen: ComponentType<{ params: Readonly<Record<string, string>> }>;
  /** Sheet ids this screen is allowed to open, so an unknown `?sheet=` is ignored. */
  sheets?: readonly string[];
  /**
   * Asked before leaving a screen with unsaved work. Returning a message key shows the
   * guard; returning null navigates (add receipt, trip setup).
   */
  guard?: () => string | null;
}

export interface TabRegistration {
  /** Lower sorts first. Sparse numbering leaves room to insert without renumbering. */
  order: number;
  /** Key in the feature's own message bundle. */
  labelKey: string;
  icon: Icon;
  /**
   * Recomputed on every render from app state; returning undefined shows no badge.
   * The accessible name must fold the count in, never announce a bare number.
   */
  badge?: () => BottomNavItem['badge'] | undefined;
}

/**
 * A feature registers itself by existing: `src/features/<id>/index.ts` exports `feature`
 * and `app/registry.ts` picks it up through `import.meta.glob`. No shared file changes,
 * so parallel feature branches cannot conflict over registration.
 */
export interface FeatureV2 {
  id: string;
  messages: MessageBundle;
  routes: readonly ScreenRoute[];
  tab?: TabRegistration;
}

/**
 * The published screen inventory — `information-architecture.md` section 3, 46 ids, fixed
 * since M0. Declared as a union here rather than left as `string`, so `pathTo('S99')` is a
 * compile error today instead of an acceptance criterion M1-5a has to remember.
 *
 * M1-5a narrows the second argument per screen from its route map, so a missing
 * `receiptId` also becomes a compile error.
 */
export type ScreenId =
  | 'S01'
  | 'S02'
  | 'S03'
  | 'S04'
  | 'S05'
  | 'S10'
  | 'S11'
  | 'S12'
  | 'S13'
  | 'S14'
  | 'S15'
  | 'S16'
  | 'S17'
  | 'S20'
  | 'S21'
  | 'S22'
  | 'S23'
  | 'S24'
  | 'S25'
  | 'S26'
  | 'S27'
  | 'S28'
  | 'S29'
  | 'S2A'
  | 'S2B'
  | 'S30'
  | 'S31'
  | 'S32'
  | 'S33'
  | 'S34'
  | 'S35'
  | 'S36'
  | 'S37'
  | 'S38'
  | 'S39'
  | 'S40'
  | 'S41'
  | 'S50'
  | 'S51'
  | 'S52'
  | 'S53'
  | 'S54'
  | 'S60'
  | 'S61'
  | 'S62'
  | 'S63';

/**
 * The one place a route path is written down.
 *
 * Features link to each other constantly — the fee warning opens the FAQ, a red kiosk
 * result opens the guide, the packing plan opens the not-claiming sheet, departure day
 * opens Airport Mode — and those links cross track boundaries. A raw string agreed by
 * nobody is a blank screen discovered at an airport, because a hash route that matches
 * nothing renders nothing rather than failing the build.
 *
 * `pathTo` is therefore the only sanctioned way to build an internal link. Parameters are
 * required by the type when the route has them.
 *
 * It accepts all 46 ids, including the state-only ones, and resolves them to their host
 * route: `pathTo('S2B', { receiptId })` lands on S22. That keeps call sites honest — the
 * fee warning links to the fee warning, and the fact that it is a block on the detail
 * screen is a routing detail rather than the linker's problem.
 */
export type PathTo = (
  screen: ScreenId,
  params?: Readonly<Record<string, string>>,
  options?: { sheet?: string },
) => string;

/** Navigation that works from anywhere, including inside the domain-free UI kit. */
export interface Navigator {
  go(path: string): void;
  replace(path: string): void;
  back(): void;
  openSheet(sheet: string): void;
  closeSheet(): void;
  hrefFor(path: string): string;
  /** Build a link to another screen by id; see `PathTo`. */
  pathTo: PathTo;
}

/**
 * The one shell state that outlives every screen: the non-dismissible "do not check your
 * bags yet" warning. It is owned by the shell, persists across Airport Mode steps, and is
 * cleared only by an explicit confirmation at step 4 (UJ-026, UJ-031, IA flow F).
 */
export interface ShellBanner {
  set(banner: BannerProps & { dismissible: false }): void;
  clear(): void;
}

/** Transient confirmations. One at a time; a new toast replaces the current one. */
export interface ToastHost {
  show(message: string, action?: { label: string; onActivate: () => void }): void;
}
