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
        feeOverride: null,
      },
      {
        tripId: 'trip-1',
        operatorId: 'tourist-pay',
        registeredAt: null,
        refundMethod: null,
        feeOverride: null,
      },
    ]);
  });

  it('keeps one trip out of another trip s list', async () => {
    await registrationRepository.put(db, aRegistration({ tripId: 'trip-1' }));
    await registrationRepository.put(db, aRegistration({ tripId: 'trip-2' }));

    expect(await registrationRepository.listByTrip(db, 'trip-2')).toEqual([
      {
        tripId: 'trip-2',
        operatorId: 'global-tax-free',
        registeredAt: null,
        refundMethod: null,
        feeOverride: null,
      },
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

  it("DR-051: reads a traveler's fee override, a real correction to the catalogue figure", async () => {
    const override = {
      method: 'bank_transfer' as const,
      rate: { basisPoints: 150, basis: 'refund' as const },
      fixedJpy: 200,
      minimumJpy: 500,
      status: 'unconfirmed' as const,
    };
    await registrationRepository.put(db, aRegistration({ feeOverride: override }));

    expect((await registrationRepository.listByTrip(db, 'trip-1'))[0]?.feeOverride).toEqual(
      override,
    );
  });

  it('DR-051: an override with no stated confidence is unreadable, not a free fee', async () => {
    await db.put('registrations', {
      ...aRegistration(),
      feeOverride: { method: null, rate: null, fixedJpy: 0, minimumJpy: null, status: 'a guess' },
    } as never);

    expect((await registrationRepository.listByTrip(db, 'trip-1'))[0]?.feeOverride).toBeNull();
  });

  it('a rate with no recognised basis is not a smaller fact — the whole rate reads as absent', async () => {
    await db.put('registrations', {
      ...aRegistration(),
      feeOverride: {
        method: null,
        rate: { basisPoints: 150, basis: 'a percentage of something' },
        fixedJpy: 0,
        minimumJpy: null,
        status: 'unconfirmed',
      },
    } as never);

    expect((await registrationRepository.listByTrip(db, 'trip-1'))[0]?.feeOverride).toMatchObject({
      rate: null,
    });
  });
});
