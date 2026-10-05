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
  /** The design's screen id, e.g. `S20`. Carried into `data-screen` so QA can assert it. */
  screenId: string;
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
 * The design's screen id, e.g. `S20`. Narrowed to the published inventory by M1-5a so a
 * typo is a type error.
 */
export type ScreenId = string;

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
