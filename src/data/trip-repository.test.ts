import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { StorageError } from './errors.ts';
import { aReceipt, aRegistration, aTraveler, aTrip } from './test-builders.ts';
import { tripRepository } from './trip-repository.ts';

let db: KaeruDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-trips-${counter}`, fixedClock('2026-10-05T00:00:00Z'));
});

describe('tripRepository', () => {
  it('TC-DATA-001: a stored trip comes back field for field', async () => {
    const trip = aTrip({ flightTime: '18:45', receivingChargeJpy: 1500 });
    expect(await tripRepository.put(db, trip)).toEqual(trip);
    expect(await tripRepository.get(db, trip.id)).toEqual(trip);
  });

  it('reports a trip that is not there as undefined rather than throwing', async () => {
    expect(await tripRepository.get(db, 'no-such-trip')).toBeUndefined();
  });

  it('repairs a record whose numbers were lost, instead of handing the UI a NaN', async () => {
    await db.put('trips', {
      ...aTrip(),
      checkInMinutes: Number.NaN,
      airportBufferMinutes: -30,
      receivingChargeJpy: 1500.7,
      seq: 1,
    });
    expect(await tripRepository.get(db, 'trip-1')).toMatchObject({
      checkInMinutes: 60,
      airportBufferMinutes: 0,
      receivingChargeJpy: 1500,
    });
  });

  it('drops a record it cannot address or date, and never deletes it', async () => {
    await db.put('trips', { ...aTrip(), departureDate: 'someday', seq: 1 });
    expect(await tripRepository.get(db, 'trip-1')).toBeUndefined();
    expect(await tripRepository.list(db)).toEqual([]);
    expect(await db.count('trips')).toBe(1);
  });

  it('refuses to store a trip with no id and writes nothing', async () => {
    await expect(tripRepository.put(db, aTrip({ id: '  ' }))).rejects.toBeInstanceOf(StorageError);
    expect(await db.count('trips')).toBe(0);
  });

  it('lists the most recent departure first and leaves archived trips out by default', async () => {
    await tripRepository.put(db, aTrip({ id: 'old', departureDate: '2026-03-01' }));
    await tripRepository.put(db, aTrip({ id: 'next', departureDate: '2026-12-24' }));
    await tripRepository.put(
      db,
      aTrip({ id: 'gone', departureDate: '2026-06-01', archived: true }),
    );

    expect((await tripRepository.list(db)).map((trip) => trip.id)).toEqual(['next', 'old']);
    expect(
      (await tripRepository.list(db, { includeArchived: true })).map((trip) => trip.id),
    ).toEqual(['next', 'gone', 'old']);
  });

  it('keeps a trip in place when it is edited', async () => {
    await tripRepository.put(db, aTrip({ id: 'a', departureDate: '2026-05-01' }));
    await tripRepository.put(db, aTrip({ id: 'b', departureDate: '2026-05-01' }));
    await tripRepository.put(
      db,
      aTrip({ id: 'a', departureDate: '2026-05-01', flightTime: '09:00' }),
    );

    expect((await tripRepository.list(db)).map((trip) => trip.id)).toEqual(['b', 'a']);
  });

  it('has no current trip before onboarding and the live one afterwards', async () => {
    expect(await tripRepository.current(db)).toBeNull();

    await tripRepository.put(db, aTrip({ id: 'last-year', departureDate: '2025-11-01' }));
    await tripRepository.put(db, aTrip({ id: 'this-trip', departureDate: '2026-11-20' }));
    expect((await tripRepository.current(db))?.id).toBe('this-trip');

    await tripRepository.archive(db, 'this-trip', true);
    expect((await tripRepository.current(db))?.id).toBe('last-year');
  });

  it('breaks a same-departure-date tie by the most recently added trip (Architect review, #67)', async () => {
    await tripRepository.put(db, aTrip({ id: 'draft-a', departureDate: '2026-12-24' }));
    await tripRepository.put(db, aTrip({ id: 'draft-b', departureDate: '2026-12-24' }));
    expect((await tripRepository.current(db))?.id).toBe('draft-b');

    await tripRepository.put(db, aTrip({ id: 'draft-c', departureDate: '2026-12-24' }));
    expect((await tripRepository.current(db))?.id).toBe('draft-c');
  });

  it('archiving keeps the trip readable and exportable, and is idempotent', async () => {
    await tripRepository.put(db, aTrip());
    await tripRepository.archive(db, 'trip-1', true);
    await tripRepository.archive(db, 'trip-1', true);
    await tripRepository.archive(db, 'no-such-trip', true);

    expect(await tripRepository.get(db, 'trip-1')).toMatchObject({ archived: true });
    expect(await tripRepository.list(db, { includeArchived: true })).toHaveLength(1);

    await tripRepository.archive(db, 'trip-1', false);
    expect(await tripRepository.get(db, 'trip-1')).toMatchObject({ archived: false });
  });

  it('deletes a trip with everything under it, and nothing from any other trip', async () => {
    await tripRepository.put(db, aTrip({ id: 'trip-1' }));
    await tripRepository.put(db, aTrip({ id: 'trip-2', departureDate: '2027-01-10' }));
    await db.put('travelers', { ...aTraveler({ id: 't1', tripId: 'trip-1' }), seq: 1 });
    await db.put('travelers', { ...aTraveler({ id: 't2', tripId: 'trip-2' }), seq: 2 });
    await db.put('receipts', { ...aReceipt({ id: 'r1', tripId: 'trip-1' }), seq: 1 });
    await db.put('receipts', { ...aReceipt({ id: 'r2', tripId: 'trip-2' }), seq: 2 });
    await db.put('registrations', aRegistration({ tripId: 'trip-1' }));
    await db.put('registrations', aRegistration({ tripId: 'trip-2' }));
    await db.put('photos', {
      id: 'p1',
      receiptId: 'r1',
      blob: new Blob(['photo']),
      mimeType: 'image/jpeg',
      byteSize: 5,
      createdAt: '2026-11-15T10:00:00.000Z',
    });

    await tripRepository.remove(db, 'trip-1');

    expect(await db.getAllKeys('trips')).toEqual(['trip-2']);
    expect(await db.getAllKeys('travelers')).toEqual(['t2']);
    expect(await db.getAllKeys('receipts')).toEqual(['r2']);
    expect(await db.count('registrations')).toBe(1);
    expect(await db.count('photos')).toBe(0);
  });
});
