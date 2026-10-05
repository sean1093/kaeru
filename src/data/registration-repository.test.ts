import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import { registrationRepository } from './registration-repository.ts';
import { aRegistration } from './test-builders.ts';

let db: KaeruDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-registrations-${counter}`, fixedClock('2026-10-05T00:00:00Z'));
});

describe('registrationRepository', () => {
  it('UJ-013: one registration per operator per trip, updated rather than duplicated', async () => {
    await registrationRepository.put(db, aRegistration({ operatorId: 'global-tax-free' }));
    await registrationRepository.put(
      db,
      aRegistration({
        operatorId: 'global-tax-free',
        registeredAt: '2026-11-15T09:30:00.000Z',
        refundMethod: 'bank_transfer',
      }),
    );
    await registrationRepository.put(db, aRegistration({ operatorId: 'tourist-pay' }));

    expect(await registrationRepository.listByTrip(db, 'trip-1')).toEqual([
      {
        tripId: 'trip-1',
        operatorId: 'global-tax-free',
        registeredAt: '2026-11-15T09:30:00.000Z',
        refundMethod: 'bank_transfer',
      },
      { tripId: 'trip-1', operatorId: 'tourist-pay', registeredAt: null, refundMethod: null },
    ]);
  });

  it('keeps one trip out of another trip s list', async () => {
    await registrationRepository.put(db, aRegistration({ tripId: 'trip-1' }));
    await registrationRepository.put(db, aRegistration({ tripId: 'trip-2' }));

    expect(await registrationRepository.listByTrip(db, 'trip-2')).toEqual([
      { tripId: 'trip-2', operatorId: 'global-tax-free', registeredAt: null, refundMethod: null },
    ]);
  });

  it('reads a refund method it does not recognise as unknown, not as cash', async () => {
    await db.put('registrations', {
      ...aRegistration(),
      refundMethod: 'carrier pigeon',
    } as never);

    expect((await registrationRepository.listByTrip(db, 'trip-1'))[0]?.refundMethod).toBeNull();
  });

  it('refuses a registration with no operator and writes nothing', async () => {
    await expect(
      registrationRepository.put(db, aRegistration({ operatorId: '' })),
    ).rejects.toMatchObject({ code: 'invalid-record' });
    expect(await db.count('registrations')).toBe(0);
  });
});
