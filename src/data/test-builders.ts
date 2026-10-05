/**
 * Builders for storage tests. Nothing in the app imports this file.
 *
 * Every builder returns a complete, valid entity so a test can say what it is actually
 * about ("a receipt from another trip") instead of restating the whole model.
 */
import type {
  OperatorRegistration,
  Receipt,
  ReceiptLine,
  Traveler,
  Trip,
} from '../domain/model.ts';

export function aTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    departureDate: '2026-11-20',
    departureAirport: 'NRT',
    checkInMinutes: 60,
    airportBufferMinutes: 60,
    overdueThresholdDays: 30,
    receivingChargeJpy: null,
    archived: false,
    ...overrides,
  };
}

export function aTraveler(overrides: Partial<Traveler> = {}): Traveler {
  return { id: 'traveler-1', tripId: 'trip-1', displayName: '小雨', ...overrides };
}

export function aLine(overrides: Partial<ReceiptLine> = {}): ReceiptLine {
  return {
    taxRate: 0.1,
    taxExcludedAmount: 10_000,
    taxIncludedAmount: 11_000,
    maxUnitPriceTaxExcluded: 10_000,
    amountsAreDerived: false,
    ...overrides,
  };
}

export function aReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: 'receipt-1',
    tripId: 'trip-1',
    travelerId: 'traveler-1',
    shopName: 'ビックカメラ',
    shopKey: 'ビックカメラ',
    purchaseDate: '2026-11-15',
    lines: [aLine()],
    operatorId: null,
    status: 'logged',
    packingLocation: 'with_me',
    allItemsPresent: null,
    willUseInJapan: null,
    hasHighValueItem: null,
    amountReceived: null,
    notClaimingReason: null,
    statusChangedAt: '2026-11-15T10:00:00.000Z',
    ...overrides,
  };
}

export function aRegistration(overrides: Partial<OperatorRegistration> = {}): OperatorRegistration {
  return {
    tripId: 'trip-1',
    operatorId: 'global-tax-free',
    registeredAt: null,
    refundMethod: null,
    feeOverride: null,
    ...overrides,
  };
}
