import { describe, expect, it } from 'vitest';
import type { ScreenId } from './navigation.ts';
import {
  pathTo,
  ROUTE_DEFINITIONS,
  ROUTES,
  SCREEN_IDS,
  SCREEN_LOCATIONS,
  SHEET_IDS,
  SHEET_SCREEN_IDS,
  screenAttrs,
} from './screens.ts';

/**
 * The inventory is the code form of `information-architecture.md` section 3.1. These tests
 * are the thing that notices when the two drift.
 */
describe('screen inventory (IA section 3.1)', () => {
  it('declares every published screen id exactly once', () => {
    // Fails to compile if a new id joins the union without joining SCREEN_IDS.
    type Undeclared = Exclude<ScreenId, (typeof SCREEN_IDS)[number]>;
    const complete: Undeclared extends never ? true : false = true;
    expect(complete).toBe(true);

    expect(new Set(SCREEN_IDS).size).toBe(46);
    // SCREEN_LOCATIONS covers the 42 route-and-state ids; the 4 sheet ids have no single
    // host and are checked separately through SHEET_SCREEN_IDS.
    const sheetIds = Object.values(SHEET_SCREEN_IDS) as readonly string[];
    expect(Object.keys(SCREEN_LOCATIONS).sort()).toEqual(
      SCREEN_IDS.filter((id) => !sheetIds.includes(id)).sort(),
    );
    expect([...sheetIds].sort()).toEqual(['S24', 'S25', 'S26', 'S2A'].sort());
  });

  it('splits the 46 ids into 33 routes, 9 states and 4 sheets', () => {
    const patterns = Object.keys(ROUTES);
    const stateIds = Object.values(ROUTES).flatMap((route) => route.screenIds.slice(1));

    expect(patterns).toHaveLength(33);
    expect(stateIds).toHaveLength(9);
    expect(Object.values(SHEET_SCREEN_IDS)).toHaveLength(4);
    expect(patterns.length + stateIds.length + Object.values(SHEET_SCREEN_IDS).length).toBe(46);
  });

  it('keeps the states the IA names on the host route they belong to', () => {
    expect(ROUTE_DEFINITIONS['/']?.screenIds).toEqual(['S10', 'S11', 'S12', 'S13', 'S14']);
    expect(ROUTE_DEFINITIONS['/receipts/:receiptId']?.screenIds).toEqual(['S22', 'S29', 'S2B']);
    expect(ROUTE_DEFINITIONS['/receipts']?.screenIds).toEqual(['S20', 'S28']);
    expect(ROUTE_DEFINITIONS['/airport/terminal']?.screenIds).toEqual(['S33', 'S34', 'S35']);
  });

  it('gives Airport Mode the takeover chrome on every one of its routes', () => {
    const airport = Object.entries(ROUTES).filter(([pattern]) => pattern.startsWith('/airport'));
    expect(airport).toHaveLength(8);
    expect(airport.every(([, route]) => route.chrome === 'mode')).toBe(true);
  });

  it('declares a sheet only on routes that can open it', () => {
    for (const [pattern, route] of Object.entries(ROUTES)) {
      for (const sheet of route.sheets) {
        expect(SHEET_IDS, `${pattern} declares an unknown sheet "${sheet}"`).toContain(sheet);
      }
    }
    // UJ-018: the integrity check opens not-claiming over the packing plan, not on a detour.
    expect(ROUTE_DEFINITIONS['/packing']?.sheets).toContain('not-claiming');
  });
});

describe('pathTo', () => {
  it('builds a plain route', () => {
    expect(pathTo('S10')).toBe('/');
    expect(pathTo('S20')).toBe('/receipts');
    expect(pathTo('S60')).toBe('/settings');
  });

  it('substitutes parameters and escapes them', () => {
    expect(pathTo('S22', { receiptId: 'abc123' })).toBe('/receipts/abc123');
    expect(pathTo('S23', { receiptId: 'a/b' })).toBe('/receipts/a%2Fb/edit');
    expect(pathTo('S16', { tripId: 'trip-1' })).toBe('/trips/trip-1/summary');
  });

  it('omits an optional trailing parameter', () => {
    expect(pathTo('S54')).toBe('/guide/faq');
    expect(pathTo('S54', { entryId: 'q11' })).toBe('/guide/faq/q11');
    expect(pathTo('S39')).toBe('/airport/help');
    expect(pathTo('S39', { branchId: 'out-of-time' })).toBe('/airport/help/out-of-time');
  });

  it('resolves a state-only id to its host, so a caller links to the thing it means', () => {
    // The fee warning is a block on the receipt detail; the caller should not have to know.
    expect(pathTo('S2B', { receiptId: 'r1' })).toBe('/receipts/r1');
    expect(pathTo('S29', { receiptId: 'r1' })).toBe('/receipts/r1');
    expect(pathTo('S13')).toBe('/');
    expect(pathTo('S28')).toBe('/receipts');
    expect(pathTo('S35')).toBe('/airport/terminal');
  });

  it('gives a sheet id no canonical host: reaching one needs an explicit host screen', () => {
    // UXDesigner/Architect: S24-S26 open from S21, S22 *and* S23, so a single "host" for
    // pathTo would navigate someone away from whichever of those they are actually on.
    // The cross-screen case — Tonight's list linking to one receipt's operator chooser —
    // is expressed on the host it actually means, with the sheet as an option.
    expect(pathTo('S22', { receiptId: 'r1' }, { sheet: 'operator' })).toBe(
      '/receipts/r1?sheet=operator',
    );
    expect(SHEET_SCREEN_IDS.operator).toBe('S24');
    expect(SHEET_SCREEN_IDS['not-claiming']).toBe('S2A');
  });

  it('opens a declared sheet on an explicit host', () => {
    expect(pathTo('S22', { receiptId: 'r1' }, { sheet: 'not-claiming' })).toBe(
      '/receipts/r1?sheet=not-claiming',
    );
    expect(pathTo('S17', undefined, { sheet: 'not-claiming' })).toBe('/packing?sheet=not-claiming');
  });

  it('rejects a bad link at compile time rather than with a blank screen', () => {
    // @ts-expect-error — S99 is not a published screen id.
    expect(() => pathTo('S99')).toThrow();
    // @ts-expect-error — the receipt detail cannot be addressed without its receipt.
    expect(() => pathTo('S22')).toThrow(/Missing route parameter "receiptId"/);
    // @ts-expect-error — Home declares no sheets.
    expect(pathTo('S10', undefined, { sheet: 'operator' })).toBe('/?sheet=operator');
    // @ts-expect-error — the guide index has no `receiptId`.
    expect(pathTo('S50', { receiptId: 'r1' })).toBe('/guide');
  });
});

describe('screenAttrs', () => {
  it('writes the live screen id, which is not always the route it is on', () => {
    expect(screenAttrs('S13')).toEqual({ 'data-screen': 'S13' });
    expect(screenAttrs('S29')).toEqual({ 'data-screen': 'S29' });
  });
});
