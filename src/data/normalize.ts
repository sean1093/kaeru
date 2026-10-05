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
import type { Traveler, Trip } from '../domain/model.ts';
import { recordUnreadable } from './unreadable-records.ts';

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
