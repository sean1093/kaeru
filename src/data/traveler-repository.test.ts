import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { StorageError } from './errors.ts';
import { aReceipt, aTraveler } from './test-builders.ts';
import { travelerRepository } from './traveler-repository.ts';

let db: KaeruDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-travelers-${counter}`, fixedClock('2026-10-05T00:00:00Z'));
});

async function seedReceipt(id: string, travelerId: string, tripId = 'trip-1'): Promise<void> {
  const stored = await db.getAll('receipts');
  await db.put('receipts', { ...aReceipt({ id, travelerId, tripId }), seq: stored.length + 1 });
}

describe('travelerRepository', () => {
  it('lists the travellers of one trip in the order they were added', async () => {
    await travelerRepository.put(db, aTraveler({ id: 'b', displayName: '阿明' }));
    await travelerRepository.put(db, aTraveler({ id: 'a', displayName: '小雨' }));
    await travelerRepository.put(db, aTraveler({ id: 'other', tripId: 'trip-2' }));

    expect((await travelerRepository.listByTrip(db, 'trip-1')).map((t) => t.id)).toEqual([
      'b',
      'a',
    ]);
    expect((await travelerRepository.listByTrip(db, 'trip-2')).map((t) => t.id)).toEqual(['other']);
  });

  it('TC-DATA-019: stores at most the last four characters of a passport number', async () => {
    const saved = await travelerRepository.put(db, aTraveler({ passportRef: '312345678' }));

    expect(saved.passportRef).toBe('5678');
    expect(await db.get('travelers', 'traveler-1')).toMatchObject({ passportRef: '5678' });
  });

  it('TC-DATA-019: truncates a long passport reference that is already on disk', async () => {
    await db.put('travelers', { ...aTraveler(), passportRef: '312345678', seq: 1 });

    const [traveler] = await travelerRepository.listByTrip(db, 'trip-1');
    expect(traveler?.passportRef).toBe('5678');
  });

  it('leaves out an empty passport reference rather than storing a blank', async () => {
    const saved = await travelerRepository.put(db, aTraveler({ passportRef: '   ' }));
    expect(saved).not.toHaveProperty('passportRef');
  });

  it('refuses a traveller with no trip and writes nothing', async () => {
    await expect(travelerRepository.put(db, aTraveler({ tripId: '' }))).rejects.toBeInstanceOf(
      StorageError,
    );
    expect(await db.count('travelers')).toBe(0);
  });

  it('deletes a traveller who owns no receipts', async () => {
    await travelerRepository.put(db, aTraveler());
    await travelerRepository.remove(db, 'traveler-1', null);

    expect(await travelerRepository.listByTrip(db, 'trip-1')).toEqual([]);
  });

  it('TC-DATA-006: refuses to orphan receipts, and the refusal writes nothing', async () => {
    await travelerRepository.put(db, aTraveler());
    await seedReceipt('r1', 'traveler-1');

    const failure = await travelerRepository
      .remove(db, 'traveler-1', null)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(StorageError);
    expect(failure).toMatchObject({ code: 'reassignment-required' });

    expect(await travelerRepository.listByTrip(db, 'trip-1')).toHaveLength(1);
    expect((await db.get('receipts', 'r1'))?.travelerId).toBe('traveler-1');
  });

  it('moves every receipt to the named traveller before deleting', async () => {
    await travelerRepository.put(db, aTraveler({ id: 'parent' }));
    await travelerRepository.put(db, aTraveler({ id: 'child' }));
    await seedReceipt('r1', 'child');
    await seedReceipt('r2', 'child');
    await seedReceipt('r3', 'parent');

    await travelerRepository.remove(db, 'child', 'parent');

    expect((await travelerRepository.listByTrip(db, 'trip-1')).map((t) => t.id)).toEqual([
      'parent',
    ]);
    const owners = (await db.getAll('receipts')).map((receipt) => receipt.travelerId);
    expect(owners).toEqual(['parent', 'parent', 'parent']);
  });

  it('refuses a reassignment target from another trip and changes nothing', async () => {
    await travelerRepository.put(db, aTraveler({ id: 'here' }));
    await travelerRepository.put(db, aTraveler({ id: 'elsewhere', tripId: 'trip-2' }));
    await seedReceipt('r1', 'here');

    await expect(travelerRepository.remove(db, 'here', 'elsewhere')).rejects.toMatchObject({
      code: 'not-found',
    });
    expect((await db.get('receipts', 'r1'))?.travelerId).toBe('here');
    expect(await db.count('travelers')).toBe(2);
  });

  it('refuses to hand a traveller their own receipts', async () => {
    await travelerRepository.put(db, aTraveler());
    await seedReceipt('r1', 'traveler-1');

    await expect(travelerRepository.remove(db, 'traveler-1', 'traveler-1')).rejects.toMatchObject({
      code: 'invalid-record',
    });
    expect(await db.count('travelers')).toBe(1);
  });

  it('is a no-op for a traveller who is already gone', async () => {
    await expect(travelerRepository.remove(db, 'ghost', null)).resolves.toBeUndefined();
  });
});
