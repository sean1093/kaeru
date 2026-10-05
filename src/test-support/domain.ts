/**
 * Builders for the domain model.
 *
 * Nothing in the app imports this (`overview.md` section 2). Each builder returns a
 * complete, valid entity and takes a partial override, so a test states only the field it
 * is about — a receipt test that spells out `overdueThresholdDays` is a test whose point is
 * buried.
 */
import type {
  Operator,
  OperatorFee,
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
  return {
    id: 'traveler-1',
    tripId: 'trip-1',
    displayName: 'Yi-chun',
    ...overrides,
  };
}

export function aLine(overrides: Partial<ReceiptLine> = {}): ReceiptLine {
  return {
    taxRate: 0.1,
    taxExcludedAmount: null,
    taxIncludedAmount: null,
    maxUnitPriceTaxExcluded: null,
    amountsAreDerived: false,
    ...overrides,
  };
}

export function aReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: 'receipt-1',
    tripId: 'trip-1',
    travelerId: 'traveler-1',
    shopName: 'Bic Camera Shinjuku',
    shopKey: 'bic camera shinjuku',
    purchaseDate: '2026-11-10',
    lines: [aLine({ taxExcludedAmount: 6480 })],
    operatorId: null,
    status: 'logged',
    packingLocation: 'with_me',
    allItemsPresent: null,
    willUseInJapan: null,
    hasHighValueItem: null,
    amountReceived: null,
    notClaimingReason: null,
    statusChangedAt: '2026-11-10T10:00:00+09:00',
    ...overrides,
  };
}

export function aFee(overrides: Partial<OperatorFee> = {}): OperatorFee {
  return {
    method: null,
    rate: { basisPoints: 150, basis: 'refund' },
    fixedJpy: 0,
    minimumJpy: null,
    status: 'reported-media',
    ...overrides,
  };
}

/** By default an operator whose fee is unknown, which is eight of the ten shipped ones. */
export function anOperator(overrides: Partial<Operator> = {}): Operator {
  return {
    id: 'operator-1',
    name: { ja: '株式会社テスト', en: 'Test Operator', 'zh-TW': '測試業者' },
    url: 'https://example.invalid/',
    registrationMethod: ['receipt_qr'],
    refundMethods: ['bank_transfer'],
    fees: [],
    feeNote: null,
    feeSourceDate: null,
    status: 'reported-media',
    ...overrides,
  };
}

export function aRegistration(overrides: Partial<OperatorRegistration> = {}): OperatorRegistration {
  return {
    tripId: 'trip-1',
    operatorId: 'operator-1',
    registeredAt: '2026-11-11T09:00:00+09:00',
    refundMethod: 'bank_transfer',
    feeOverride: null,
    ...overrides,
  };
}
