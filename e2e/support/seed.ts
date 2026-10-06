/**
 * Putting data on the device, through the product's own import.
 *
 * Every spec that needs a populated device uses this, and it drives S62 rather than
 * writing to IndexedDB directly. That is deliberate (the Architect's recommendation on
 * #99): the backup v2 document is the one serialisation the app already validates on the
 * way in, so a fixture that has drifted from the schema **fails at import** instead of
 * quietly producing a half-populated screen that a spec then asserts against. It also
 * means every E2E run exercises the import path, which is a product path.
 *
 * One function, not four. Two implementations of "put this trip on the device" diverge the
 * way two implementations of anything do, and the symptom is a spec passing against a
 * device state no product path can actually produce.
 */
import { expect, type Page } from '@playwright/test';

export interface SeedLine {
  taxRate: number;
  taxExcludedAmount: number | null;
  taxIncludedAmount?: number | null;
  maxUnitPriceTaxExcluded?: number | null;
}

export interface SeedReceipt {
  id: string;
  travelerId?: string;
  shopName?: string;
  /** Decides which refund system applies, and so whether the receipt is in Airport Mode. */
  purchaseDate?: string;
  lines?: readonly SeedLine[];
  operatorId?: string | null;
  status?: string;
  /** The four fields every Airport Mode blocker is computed from. */
  packingLocation?: 'with_me' | 'checked_bag' | 'unknown';
  allItemsPresent?: boolean | null;
  willUseInJapan?: boolean | null;
}

export interface SeedTraveler {
  id: string;
  displayName: string;
}

export interface SeedTrip {
  id?: string;
  departureDate?: string;
  /** One of the seven Visit Japan Web airports, or deliberately not one. */
  departureAirport?: string;
  flightTime?: string;
  checkInMinutes?: number;
  airportBufferMinutes?: number;
  receivingChargeJpy?: number | null;
}

export interface Fixture {
  trip?: SeedTrip;
  travelers?: readonly SeedTraveler[];
  receipts?: readonly SeedReceipt[];
  locale?: 'zh-TW' | 'en';
}

/** A backup v2 document, built to the shape `backupService.preview` validates. */
export function backupDocument(fixture: Fixture = {}): string {
  const trip = fixture.trip ?? {};
  const tripId = trip.id ?? 'trip-1';
  const travelers = fixture.travelers ?? [{ id: 'traveler-1', displayName: '宜君' }];

  return JSON.stringify({
    format: 'kaeru.backup',
    schemaVersion: 2,
    exportedAt: '2026-11-20T00:00:00.000Z',
    appVersion: '0.1.0',
    settings: { locale: fixture.locale ?? 'zh-TW', theme: 'system' },
    trips: [
      {
        id: tripId,
        departureDate: trip.departureDate ?? '2026-11-20',
        departureAirport: trip.departureAirport ?? 'NRT',
        ...(trip.flightTime === undefined ? {} : { flightTime: trip.flightTime }),
        checkInMinutes: trip.checkInMinutes ?? 60,
        airportBufferMinutes: trip.airportBufferMinutes ?? 60,
        overdueThresholdDays: 30,
        receivingChargeJpy: trip.receivingChargeJpy ?? null,
        archived: false,
      },
    ],
    travelers: travelers.map((traveler) => ({ ...traveler, tripId })),
    receipts: (fixture.receipts ?? []).map((receipt) => ({
      id: receipt.id,
      tripId,
      travelerId: receipt.travelerId ?? travelers[0]?.id ?? 'traveler-1',
      shopName: receipt.shopName ?? 'ビックカメラ',
      shopKey: receipt.shopName ?? 'ビックカメラ',
      purchaseDate: receipt.purchaseDate ?? '2026-11-10',
      lines: (receipt.lines ?? [{ taxRate: 0.1, taxExcludedAmount: 20000 }]).map((line) => ({
        taxRate: line.taxRate,
        taxExcludedAmount: line.taxExcludedAmount,
        taxIncludedAmount: line.taxIncludedAmount ?? null,
        maxUnitPriceTaxExcluded: line.maxUnitPriceTaxExcluded ?? null,
        amountsAreDerived: false,
      })),
      operatorId: receipt.operatorId ?? null,
      status: receipt.status ?? 'logged',
      packingLocation: receipt.packingLocation ?? 'with_me',
      allItemsPresent: receipt.allItemsPresent ?? null,
      willUseInJapan: receipt.willUseInJapan ?? null,
      hasHighValueItem: null,
      amountReceived: null,
      notClaimingReason: null,
      statusChangedAt: '2026-11-10T10:00:00.000Z',
    })),
    registrations: [],
  });
}

/**
 * Import a backup document through S62, replacing whatever is on the device.
 *
 * `replace` rather than `merge` so a spec's starting state is the fixture and nothing
 * else, however the test ran before it.
 */
export async function seedDevice(page: Page, fixture: Fixture = {}): Promise<void> {
  await page.goto('./#/settings/data');
  await expect(page.locator('[data-screen="S62"]')).toHaveCount(1);
  await page.getByTestId('import-backup').setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backupDocument(fixture)),
  });
  await page.getByTestId('import-mode-replace').click();
  await page.getByTestId('confirm-import').click();
  // The notice is the import's own confirmation that it wrote; without waiting for it a
  // spec can navigate away mid-transaction and assert against a half-written device.
  await expect(page.getByTestId('data-notice')).not.toBeEmpty();
}
