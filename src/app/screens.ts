/**
 * The screen inventory, in code.
 *
 * `information-architecture.md` section 3.1 classifies the 46 published screen ids as
 * **33 routes, 9 states and 4 sheets**. This file is that classification as data, and it is
 * the single place a route path is written down. Everything else — matching, link building,
 * registry validation — is derived from it, so a path exists exactly once and a link that
 * names a screen that moved is a compile error rather than a blank screen at an airport.
 *
 * Three rules this file encodes:
 *
 * 1. **A route may render several screen ids.** Home is one route with five faces; a receipt
 *    is one route whether or not it is old-system. The live component writes the id it is
 *    actually showing into `data-screen` (see `screenAttrs`), so QA asserts S13 or S29 and
 *    not merely the host route.
 * 2. **`pathTo` accepts the 42 route and state ids** and resolves a state-only id to its
 *    host route. A link to the fee warning is expressible as the fee warning; that it
 *    renders as a block on the receipt detail is a routing detail and not the caller's
 *    problem. The classification will move at least once, and when it does only this file
 *    changes. The 4 sheet ids are not `pathTo`-able on their own — see rule 3.
 * 3. **Sheets live on the screen that opened them.** A sheet is `?sheet=<id>` on the current
 *    route, never a route of its own, so browser back closes the sheet and leaves the screen
 *    mounted. The normal way to open one is `Navigator.openSheet`, which stays where the user
 *    is. `pathTo` can name a sheet too, but only together with an explicit host and its
 *    parameters, so a cross-screen link can say "that receipt's operator chooser" without
 *    ever navigating someone off the screen they were working on.
 */
import type { Chrome, RoutePattern, ScreenId } from './navigation.ts';

/** The four sheets in the inventory: S24, S25, S26 and S2A. */
export const SHEET_IDS = ['operator', 'traveler', 'packing', 'not-claiming'] as const;

export type SheetId = (typeof SHEET_IDS)[number];

export interface RouteDefinition {
  /** Every screen id this route can render: the host first, then its states. */
  readonly screenIds: readonly ScreenId[];
  readonly chrome: Chrome;
  /** Sheets this route may open. Anything else in `?sheet=` is ignored. */
  readonly sheets: readonly SheetId[];
}

/**
 * The 33 routes. Keys are patterns: `:name` is a required parameter, `:name?` an optional
 * trailing one.
 *
 * `chrome` lives here rather than only on the feature's `ScreenRoute` because it is an IA
 * decision (section 2: the bottom bar hides in Airport Mode and inside full-screen flows),
 * not a per-feature preference. The registry checks a feature's declaration against this
 * table, so an Airport screen that forgets `mode` fails at boot instead of shipping a
 * tab bar into a customs queue.
 */
export const ROUTES = {
  // --- Onboarding (IA 3, flow A) -------------------------------------------
  '/welcome': { screenIds: ['S01'], chrome: 'fullscreen', sheets: [] },
  // The explainer is five steps with an indicator; a backgrounded app resumes on the step
  // it was on, which it can only do if the step is in the URL.
  '/explainer/:step': { screenIds: ['S05'], chrome: 'fullscreen', sheets: [] },
  '/trip-setup': { screenIds: ['S02'], chrome: 'fullscreen', sheets: [] },
  '/travelers': { screenIds: ['S03'], chrome: 'fullscreen', sheets: [] },
  '/ready': { screenIds: ['S04'], chrome: 'fullscreen', sheets: [] },

  // --- Home (IA 3, flow D) --------------------------------------------------
  // One route, five faces: the app knows the departure date, so the user never picks a mode.
  '/': { screenIds: ['S10', 'S11', 'S12', 'S13', 'S14'], chrome: 'tabs', sheets: [] },
  // Not `/tonight`: this is the full action-item list behind the Home summary, and on
  // departure morning it is the blocker list. The title is phase-aware copy; the URL is not.
  '/actions': { screenIds: ['S15'], chrome: 'tabs', sheets: [] },
  // Addressable per trip, because archived trips stay readable and the summary is the screen
  // you most want to reopen from one (IA flow G).
  '/trips/:tripId/summary': { screenIds: ['S16'], chrome: 'tabs', sheets: [] },
  // The integrity check opens the not-claiming sheet here, over the packing list, so the
  // user keeps their place while working down twelve receipts (UJ-018).
  '/packing': { screenIds: ['S17'], chrome: 'tabs', sheets: ['not-claiming'] },

  // --- Receipts (IA 3, flows B and C) --------------------------------------
  '/receipts': { screenIds: ['S20', 'S28'], chrome: 'tabs', sheets: [] },
  '/receipts/new': {
    screenIds: ['S21'],
    chrome: 'fullscreen',
    sheets: ['operator', 'traveler', 'packing'],
  },
  '/receipts/:receiptId': {
    screenIds: ['S22', 'S29', 'S2B'],
    chrome: 'tabs',
    sheets: ['operator', 'traveler', 'packing', 'not-claiming'],
  },
  '/receipts/:receiptId/edit': {
    screenIds: ['S23'],
    chrome: 'fullscreen',
    sheets: ['operator', 'traveler', 'packing'],
  },
  '/receipts/:receiptId/photo': { screenIds: ['S27'], chrome: 'fullscreen', sheets: [] },

  // --- Airport Mode (IA 3, flow F) -----------------------------------------
  // Every one of these takes over the viewport: no bottom navigation, no FAB.
  '/airport': { screenIds: ['S30'], chrome: 'mode', sheets: [] },
  '/airport/goods': { screenIds: ['S31'], chrome: 'mode', sheets: [] },
  '/airport/landside': { screenIds: ['S32'], chrome: 'mode', sheets: [] },
  '/airport/terminal': { screenIds: ['S33', 'S34', 'S35'], chrome: 'mode', sheets: [] },
  '/airport/used-goods': { screenIds: ['S36'], chrome: 'mode', sheets: [] },
  '/airport/customs-confirmed': { screenIds: ['S37'], chrome: 'mode', sheets: [] },
  '/airport/complete': { screenIds: ['S38'], chrome: 'mode', sheets: [] },
  // Six branches. The branch is in the URL for the same reason the step is: the branch a
  // user backgrounds the app on is the one where time pressure is highest.
  '/airport/help/:branchId?': { screenIds: ['S39'], chrome: 'mode', sheets: [] },

  // --- Refunds (IA 3, flow G) ----------------------------------------------
  '/refunds': { screenIds: ['S40'], chrome: 'tabs', sheets: [] },
  '/refunds/:operatorId': { screenIds: ['S41'], chrome: 'tabs', sheets: [] },

  // --- Guide (IA 3, flow H) ------------------------------------------------
  '/guide': { screenIds: ['S50'], chrome: 'tabs', sheets: [] },
  '/guide/articles/:articleId': { screenIds: ['S51'], chrome: 'tabs', sheets: [] },
  '/guide/operators': { screenIds: ['S52'], chrome: 'tabs', sheets: [] },
  '/guide/operators/:operatorId': { screenIds: ['S53'], chrome: 'tabs', sheets: [] },
  // The per-question deep link the fee warning opens is a path segment, not a fragment: a
  // hash-routed app has already spent its one `#`.
  '/guide/faq/:entryId?': { screenIds: ['S54'], chrome: 'tabs', sheets: [] },

  // --- Settings (IA 3, flow I) ---------------------------------------------
  // Reached from the Home app bar, not from a fifth tab.
  '/settings': { screenIds: ['S60'], chrome: 'tabs', sheets: [] },
  '/settings/trip': { screenIds: ['S61'], chrome: 'tabs', sheets: [] },
  '/settings/data': { screenIds: ['S62'], chrome: 'tabs', sheets: [] },
  '/settings/privacy': { screenIds: ['S63'], chrome: 'tabs', sheets: [] },
} as const satisfies Readonly<Record<RoutePattern, RouteDefinition>>;

export type RoutePatternId = keyof typeof ROUTES;

/**
 * The four sheet ids, by the sheet value they correspond to. A sheet has no canonical
 * host — S24, S25 and S26 all open from S21, S22 **and** S23 (IA section 3.1), so picking
 * one of those as "the" host would navigate a user on the receipt detail to the add-receipt
 * screen the moment they tapped a chooser, losing whatever they were editing. A link to a
 * sheet is therefore never `pathTo('S24', params)`; it is the sheet option on an explicit
 * host — `pathTo('S22', { receiptId }, { sheet: 'operator' })` for a cross-screen link, or
 * `Navigator.openSheet('operator')` for the screen that is already showing the receipt.
 *
 * This map exists only so the inventory completeness check below can confirm all four ids
 * are reachable through some route's declared `sheets`, matching the other 42 ids.
 */
export const SHEET_SCREEN_IDS = {
  operator: 'S24',
  traveler: 'S25',
  packing: 'S26',
  'not-claiming': 'S2A',
} as const satisfies Readonly<Record<SheetId, ScreenId>>;

export type SheetScreenId = (typeof SHEET_SCREEN_IDS)[SheetId];

/** The 46 published ids, in inventory order. Completeness is checked in `screens.test.ts`. */
export const SCREEN_IDS = [
  'S01',
  'S05',
  'S02',
  'S03',
  'S04',
  'S10',
  'S11',
  'S12',
  'S13',
  'S14',
  'S15',
  'S16',
  'S17',
  'S20',
  'S21',
  'S22',
  'S23',
  'S24',
  'S25',
  'S26',
  'S27',
  'S28',
  'S29',
  'S2A',
  'S2B',
  'S30',
  'S31',
  'S32',
  'S33',
  'S34',
  'S35',
  'S36',
  'S37',
  'S38',
  'S39',
  'S40',
  'S41',
  'S50',
  'S51',
  'S52',
  'S53',
  'S54',
  'S60',
  'S61',
  'S62',
  'S63',
] as const satisfies readonly ScreenId[];

// --- Types that make a wrong link a compile error ---------------------------

type RouteHostOf<S extends ScreenId> = Extract<
  {
    [P in RoutePatternId]: S extends (typeof ROUTES)[P]['screenIds'][number] ? P : never;
  }[RoutePatternId],
  RoutePatternId
>;

/** The route pattern a screen id is rendered by. Not defined for the four sheet ids — see
 * the module comment on `SHEET_SCREEN_IDS` for why a sheet has no single host. */
export type HostPattern<S extends Exclude<ScreenId, SheetScreenId>> = RouteHostOf<S>;

/** `/receipts/:receiptId/edit` -> `'receiptId'`; `/guide/faq/:entryId?` -> `'entryId?'`. */
type ParamNames<P extends string> = P extends `${string}:${infer Rest}`
  ? Rest extends `${infer Name}/${infer Tail}`
    ? Name | ParamNames<`/${Tail}`>
    : Rest
  : never;

/**
 * A route with no parameters takes `Record<string, never>` rather than `{}`, so passing one
 * anyway — `pathTo('S50', { receiptId })`, the copy-paste that would otherwise go unnoticed
 * — is a type error rather than a silently ignored argument.
 */
type PatternParams<P extends string> = [ParamNames<P>] extends [never]
  ? Record<string, never>
  : { readonly [K in Exclude<ParamNames<P>, `${string}?`>]: string } & {
      readonly [K in Extract<ParamNames<P>, `${string}?`> as K extends `${infer Base}?`
        ? Base
        : never]?: string;
    };

export type ScreenParams<S extends Exclude<ScreenId, SheetScreenId>> = PatternParams<
  HostPattern<S>
>;

/** The sheets a screen's host route declares. */
export type AllowedSheet<S extends Exclude<ScreenId, SheetScreenId>> = (typeof ROUTES)[Extract<
  HostPattern<S>,
  RoutePatternId
>]['sheets'][number];

type HasRequiredParams<T> = Record<never, never> extends T ? false : true;

/** Parameters are required exactly when the pattern has them, which is the whole point. */
export type PathToArgs<S extends Exclude<ScreenId, SheetScreenId>> =
  HasRequiredParams<ScreenParams<S>> extends true
    ? [params: ScreenParams<S>, options?: { sheet?: AllowedSheet<S> }]
    : [params?: ScreenParams<S>, options?: { sheet?: AllowedSheet<S> }];

// --- The derived runtime map ------------------------------------------------

export interface ScreenLocation {
  readonly pattern: RoutePattern;
}

const SCREEN_ID_FOR_SHEET: Readonly<Record<ScreenId, SheetId | undefined>> = Object.fromEntries(
  Object.entries(SHEET_SCREEN_IDS).map(([sheet, screen]) => [screen, sheet]),
) as Record<ScreenId, SheetId | undefined>;

/**
 * Confirms every one of the 46 ids is reachable through the registered routes: the 42
 * route-and-state ids as a `screens` entry, the 4 sheet ids as some route's declared
 * `sheets`. This is the "resolve to a registered route at startup" acceptance criterion;
 * it does not imply a sheet has a single host, only that it has at least one.
 */
function buildScreenLocations(): Readonly<
  Record<Exclude<ScreenId, SheetScreenId>, ScreenLocation>
> {
  const locations = new Map<ScreenId, ScreenLocation>();
  const reachableSheets = new Set<SheetId>();
  for (const [pattern, definition] of Object.entries(ROUTES)) {
    for (const screen of definition.screenIds) {
      const clash = locations.get(screen);
      if (clash) {
        throw new Error(
          `Screen "${screen}" is claimed by both "${clash.pattern}" and "${pattern}".`,
        );
      }
      locations.set(screen, { pattern });
    }
    for (const sheet of definition.sheets) reachableSheets.add(sheet);
  }

  const missing = SCREEN_IDS.filter((screen) => {
    if (locations.has(screen)) return false;
    const sheet = SCREEN_ID_FOR_SHEET[screen];
    return sheet === undefined || !reachableSheets.has(sheet);
  });
  if (missing.length > 0) {
    throw new Error(`Screen ids with no route: ${missing.join(', ')}.`);
  }
  return Object.fromEntries(locations) as Record<Exclude<ScreenId, SheetScreenId>, ScreenLocation>;
}

export const SCREEN_LOCATIONS: Readonly<Record<Exclude<ScreenId, SheetScreenId>, ScreenLocation>> =
  buildScreenLocations();

/**
 * `ROUTES` with its literal keys widened, for the registry and the router, which look a
 * pattern up by a string they were handed rather than by a literal they wrote.
 */
export const ROUTE_DEFINITIONS: Readonly<Record<string, RouteDefinition>> = ROUTES;

export function isSheetId(value: string): value is SheetId {
  return (SHEET_IDS as readonly string[]).includes(value);
}

// --- Link building ----------------------------------------------------------

function fillPattern(pattern: RoutePattern, params: Readonly<Record<string, string>>): string {
  const filled: string[] = [];
  for (const segment of pattern.split('/')) {
    if (segment === '') continue;
    if (!segment.startsWith(':')) {
      filled.push(segment);
      continue;
    }
    const optional = segment.endsWith('?');
    const name = segment.slice(1, optional ? -1 : undefined);
    const value = params[name];
    if (value === undefined || value === '') {
      if (optional) continue;
      throw new Error(`Missing route parameter "${name}" for "${pattern}".`);
    }
    filled.push(encodeURIComponent(value));
  }
  return filled.length === 0 ? '/' : `/${filled.join('/')}`;
}

/**
 * Build an internal link. The only sanctioned way to do so — see the module comment.
 *
 * `pathTo('S22', { receiptId })` -> `/receipts/abc`
 * `pathTo('S2B', { receiptId })` -> `/receipts/abc` (the fee warning is a state of S22)
 * `pathTo('S22', { receiptId }, { sheet: 'operator' })` -> `/receipts/abc?sheet=operator`
 * `pathTo('S54')` -> `/guide/faq`; `pathTo('S54', { entryId: 'q11' })` -> `/guide/faq/q11`
 */
export function pathTo<S extends Exclude<ScreenId, SheetScreenId>>(
  screen: S,
  ...rest: PathToArgs<S>
): string {
  const [params, options] = rest as unknown as [
    Readonly<Record<string, string>> | undefined,
    { sheet?: SheetId } | undefined,
  ];
  const path = fillPattern(SCREEN_LOCATIONS[screen].pattern, params ?? {});
  return options?.sheet === undefined ? path : `${path}?sheet=${encodeURIComponent(options.sheet)}`;
}

/**
 * Spread onto a screen's root element. The id is the one the component is **showing**, which
 * is not always its route's first id: Home writes S13 on departure day, a receipt detail
 * writes S29 for an old-system receipt.
 */
export function screenAttrs(screen: ScreenId): { 'data-screen': ScreenId } {
  return { 'data-screen': screen };
}
