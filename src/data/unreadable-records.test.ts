import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { receiptRepository } from './receipt-repository.ts';
import { registrationRepository } from './registration-repository.ts';
import { aReceipt, aRegistration, aTraveler, aTrip } from './test-builders.ts';
import { travelerRepository } from './traveler-repository.ts';
import { tripRepository } from './trip-repository.ts';
import {
  recordUnreadable,
  resetUnreadableRecordCountsForTests,
  unreadableRecordCounts,
} from './unreadable-records.ts';

let db: KaeruDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-unreadable-${counter}`, fixedClock('2026-10-05T00:00:00Z'));
  resetUnreadableRecordCountsForTests();
});

describe('unreadableRecordCounts', () => {
  it('starts at zero for every store and counts independently', () => {
    expect(unreadableRecordCounts()).toEqual({
      trips: 0,
      travelers: 0,
      receipts: 0,
      registrations: 0,
    });

    recordUnreadable('trips');
    recordUnreadable('trips');
    recordUnreadable('travelers');

    expect(unreadableRecordCounts()).toEqual({
      trips: 2,
      travelers: 1,
      receipts: 0,
      registrations: 0,
    });
  });

  it('does not count a missing record as unreadable — only one that exists and fails', async () => {
    expect(await tripRepository.get(db, 'no-such-trip')).toBeUndefined();
    expect(await travelerRepository.listByTrip(db, 'no-such-trip')).toEqual([]);
    expect(unreadableRecordCounts()).toEqual({
      trips: 0,
      travelers: 0,
      receipts: 0,
      registrations: 0,
    });
  });

  it('counts a trip the repository could not address or date, read through the real path', async () => {
    await db.put('trips', { ...aTrip(), departureDate: 'not-a-date', seq: 1 });

    expect(await tripRepository.get(db, 'trip-1')).toBeUndefined();
    expect(unreadableRecordCounts().trips).toBe(1);

    // Listing the same unreadable trip again does not re-count it a second time per read —
    // each read of the stored record is one event, which is what happened on disk.
    await tripRepository.list(db, { includeArchived: true });
    expect(unreadableRecordCounts().trips).toBe(2);
  });

  it('counts a traveller the repository could not address, read through the real path', async () => {
    // Indexed correctly by `tripId` so the query finds it; `id` is what fails to normalise.
    await db.put('travelers', { ...aTraveler(), id: '   ', seq: 1 });

    expect(await travelerRepository.listByTrip(db, 'trip-1')).toEqual([]);
    expect(unreadableRecordCounts().travelers).toBe(1);
  });

  it('counts a receipt the repository could not address or date, read through the real path', async () => {
    // Indexed correctly by `tripId` so the query finds it; `purchaseDate` fails to normalise.
    await db.put('receipts', { ...aReceipt(), purchaseDate: 'whenever', seq: 1 });

    expect(await receiptRepository.get(db, 'receipt-1')).toBeUndefined();
    expect(await receiptRepository.list(db, { tripId: 'trip-1' })).toEqual([]);
    expect(unreadableRecordCounts().receipts).toBe(2);
  });

  it('counts a registration the repository could not address, read through the real path', async () => {
    // Indexed correctly by `tripId` so the query finds it; `operatorId` fails to normalise.
    await db.put('registrations', { ...aRegistration(), operatorId: '' });

    expect(await registrationRepository.listByTrip(db, 'trip-1')).toEqual([]);
    expect(unreadableRecordCounts().registrations).toBe(1);
  });
});
