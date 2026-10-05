/**
 * Stored data is untrusted input.
 *
 * A record in IndexedDB may have been written by an older build, restored from a
 * hand-edited backup, or left behind by a migration that has since changed shape. Every
 * repository read therefore goes through this module, which repairs what it can and
 * returns `null` for a record it cannot address or date (ADR 0005). Nothing here deletes:
 * an unreadable record stays on disk, it just does not reach the UI.
 */

import type { CalendarDate } from '../domain/dates.ts';
import { isCalendarDate } from '../domain/dates.ts';
import type {
  FeeBasis,
  FeeRate,
  NotClaimingReason,
  OperatorFee,
  OperatorRegistration,
  PackingLocation,
  Receipt,
  ReceiptLine,
  ReceiptStatus,
  RefundMethod,
  SourceStatus,
  Traveler,
  Trip,
} from '../domain/model.ts';
import { recordDroppedLine, recordUnreadable } from './unreadable-records.ts';

/**
 * At most the last 4 characters of a passport number may exist anywhere, in storage or in
 * an import (DR-041). This is the only place that number appears.
 */
export const PASSPORT_REF_MAX_LENGTH = 4;

/**
 * Repair values for a stored trip whose numbers are missing or corrupt. The defaults a
 * *new* trip is created with come from the rules data (`src/domain`); these exist only so
 * a damaged record still renders instead of producing `NaN` minutes (DR-032).
 */
export const TRIP_REPAIR_DEFAULTS = {
  checkInMinutes: 60,
  airportBufferMinutes: 60,
  overdueThresholdDays: 30,
} as const;

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function readId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function readText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/** A finite integer, clamped at zero: no stored duration or count is ever negative. */
function readCount(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.trunc(value));
}

function readCalendarDate(value: unknown): CalendarDate | null {
  return typeof value === 'string' && isCalendarDate(value) ? value : null;
}

/** Integer yen or null; floats are money bugs waiting to happen (DR-071). */
export function readJpy(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.trunc(value);
}

export function readFlag(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/**
 * Keeps at most the last four characters, on the way in and on the way out (DR-041,
 * TC-DATA-019). A longer value is truncated rather than rejected, because the user who
 * typed their whole passport number into the disambiguation field still wants the trip.
 */
export function normalizePassportRef(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  return trimmed.length <= PASSPORT_REF_MAX_LENGTH
    ? trimmed
    : trimmed.slice(-PASSPORT_REF_MAX_LENGTH);
}

export function normalizeTrip(value: unknown): Trip | null {
  // `undefined` means there is no record at this key at all — not a corrupt one.
  if (value === undefined) return null;
  const record = readRecord(value);
  const id = record ? readId(record.id) : null;
  const departureDate = record ? readCalendarDate(record.departureDate) : null;
  // An untyped trip or one with no usable departure date cannot drive a single deadline,
  // and inventing a date here would quietly invent a refund window.
  if (!record || id === null || departureDate === null) {
    recordUnreadable('trips');
    return null;
  }

  const flightTime = typeof record.flightTime === 'string' ? record.flightTime : undefined;
  const trip: Trip = {
    id,
    departureDate,
    departureAirport: readText(record.departureAirport, ''),
    checkInMinutes: readCount(record.checkInMinutes, TRIP_REPAIR_DEFAULTS.checkInMinutes),
    airportBufferMinutes: readCount(
      record.airportBufferMinutes,
      TRIP_REPAIR_DEFAULTS.airportBufferMinutes,
    ),
    overdueThresholdDays: readCount(
      record.overdueThresholdDays,
      TRIP_REPAIR_DEFAULTS.overdueThresholdDays,
    ),
    receivingChargeJpy: readJpy(record.receivingChargeJpy),
    archived: record.archived === true,
  };
  return flightTime === undefined ? trip : { ...trip, flightTime };
}

export function normalizeTraveler(value: unknown): Traveler | null {
  if (value === undefined) return null;
  const record = readRecord(value);
  const id = record ? readId(record.id) : null;
  const tripId = record ? readId(record.tripId) : null;
  if (!record || id === null || tripId === null) {
    recordUnreadable('travelers');
    return null;
  }

  const passportRef = normalizePassportRef(record.passportRef);
  const traveler: Traveler = { id, tripId, displayName: readText(record.displayName, '') };
  return passportRef === undefined ? traveler : { ...traveler, passportRef };
}

/**
 * Closed sets as exhaustive lookup tables: adding a member to a union in `model.ts`
 * without listing it here is a type error, which is the point — a status we silently did
 * not recognise would be rewritten to `logged` and lose the user's assertion.
 */
const RECEIPT_STATUSES: Record<ReceiptStatus, true> = {
  logged: true,
  registered: true,
  customs_confirmed: true,
  refund_pending: true,
  refunded: true,
  rejected: true,
  refund_disputed: true,
  not_claiming: true,
};

const PACKING_LOCATIONS: Record<PackingLocation, true> = {
  with_me: true,
  checked_bag: true,
  unknown: true,
};

const NOT_CLAIMING_REASONS: Record<NotClaimingReason, true> = {
  consumed: true,
  missing: true,
  fee_not_worth_it: true,
  old_system: true,
  other: true,
};

const REFUND_METHODS: Record<RefundMethod, true> = {
  credit_card: true,
  bank_transfer: true,
  qr_payment: true,
  cash: true,
  paypal: true,
  points: true,
};

const SOURCE_STATUSES: Record<SourceStatus, true> = {
  'confirmed-official': true,
  'reported-media': true,
  unconfirmed: true,
};

const FEE_BASES: Record<FeeBasis, true> = {
  refund: true,
  purchase_tax_excluded: true,
};

function readMember<T extends string, F>(
  table: Record<T, true>,
  value: unknown,
  fallback: F,
): T | F {
  return typeof value === 'string' && Object.hasOwn(table, value) ? (value as T) : fallback;
}

/**
 * A line with no amount at all cannot be part of any total (DR-070), and a line with no
 * rate cannot be taxed, so neither reaches the domain. The record itself stays on disk.
 */
export function normalizeLine(value: unknown): ReceiptLine | null {
  const record = readRecord(value);
  if (!record) return null;
  const taxRate = record.taxRate;
  if (typeof taxRate !== 'number' || !Number.isFinite(taxRate) || taxRate < 0) return null;

  const taxExcludedAmount = readJpy(record.taxExcludedAmount);
  const taxIncludedAmount = readJpy(record.taxIncludedAmount);
  if (taxExcludedAmount === null && taxIncludedAmount === null) return null;

  return {
    taxRate,
    taxExcludedAmount,
    taxIncludedAmount,
    maxUnitPriceTaxExcluded: readJpy(record.maxUnitPriceTaxExcluded),
    amountsAreDerived: record.amountsAreDerived === true,
  };
}

export function normalizeReceipt(value: unknown): Receipt | null {
  if (value === undefined) return null;
  const record = readRecord(value);
  const id = record ? readId(record.id) : null;
  const tripId = record ? readId(record.tripId) : null;
  const travelerId = record ? readId(record.travelerId) : null;
  const purchaseDate = record ? readCalendarDate(record.purchaseDate) : null;
  // `shopKey` is a normalised grouping identity (DR-012a: trimmed, NFKC, case-folded) —
  // deriving it is the domain's job, so a record missing it is not addressable for
  // grouping and is withheld rather than keyed on the raw, un-normalised `shopName`,
  // which would silently split "BIC CAMERA" and "bic camera" into different groups
  // (Architect review, #69).
  const shopKey = record ? readId(record.shopKey) : null;
  // The purchase date decides which tax-free system applies (DR-002); a receipt without a
  // usable one cannot be shown as either, and guessing would guess at someone's refund.
  if (
    !record ||
    id === null ||
    tripId === null ||
    travelerId === null ||
    purchaseDate === null ||
    shopKey === null
  ) {
    recordUnreadable('receipts');
    return null;
  }

  const shopName = readText(record.shopName, '');
  const lines: ReceiptLine[] = [];
  if (Array.isArray(record.lines)) {
    for (const entry of record.lines) {
      const line = normalizeLine(entry);
      if (line) {
        lines.push(line);
      } else {
        recordDroppedLine();
      }
    }
  }
  const photoRef = readId(record.photoRef);

  const receipt: Receipt = {
    id,
    tripId,
    travelerId,
    shopName,
    shopKey,
    purchaseDate,
    lines,
    operatorId: readId(record.operatorId),
    status: readMember(RECEIPT_STATUSES, record.status, 'logged'),
    packingLocation: readMember(PACKING_LOCATIONS, record.packingLocation, 'with_me'),
    allItemsPresent: readFlag(record.allItemsPresent),
    willUseInJapan: readFlag(record.willUseInJapan),
    hasHighValueItem: readFlag(record.hasHighValueItem),
    amountReceived: readJpy(record.amountReceived),
    notClaimingReason: readMember(NOT_CLAIMING_REASONS, record.notClaimingReason, null),
    statusChangedAt: readText(record.statusChangedAt, ''),
  };
  return photoRef === null ? receipt : { ...receipt, photoRef };
}

/** A rate can never exist without its basis (the model says so); either both or neither. */
function normalizeFeeRate(value: unknown): FeeRate | null {
  const record = readRecord(value);
  if (!record) return null;
  const basisPoints = record.basisPoints;
  const basis = readMember(FEE_BASES, record.basis, null);
  if (typeof basisPoints !== 'number' || !Number.isFinite(basisPoints) || basis === null)
    return null;
  return { basisPoints: Math.trunc(basisPoints), basis };
}

/**
 * A traveller's correction to the shipped fee (DR-051). An override with no stated
 * confidence is not a smaller fact than the catalogue figure — it is unreadable, and an
 * unreadable override must mean "use the shipped figure", never a free or a zero fee.
 */
function normalizeOperatorFee(value: unknown): OperatorFee | null {
  const record = readRecord(value);
  if (!record) return null;
  const status = readMember(SOURCE_STATUSES, record.status, null);
  if (status === null) return null;
  return {
    method: readMember(REFUND_METHODS, record.method, null),
    rate: normalizeFeeRate(record.rate),
    fixedJpy: readJpy(record.fixedJpy) ?? 0,
    minimumJpy: readJpy(record.minimumJpy),
    status,
  };
}

export function normalizeRegistration(value: unknown): OperatorRegistration | null {
  if (value === undefined) return null;
  const record = readRecord(value);
  const tripId = record ? readId(record.tripId) : null;
  const operatorId = record ? readId(record.operatorId) : null;
  if (!record || tripId === null || operatorId === null) {
    recordUnreadable('registrations');
    return null;
  }

  return {
    tripId,
    operatorId,
    registeredAt: typeof record.registeredAt === 'string' ? record.registeredAt : null,
    refundMethod: readMember(REFUND_METHODS, record.refundMethod, null),
    feeOverride: normalizeOperatorFee(record.feeOverride),
  };
}
