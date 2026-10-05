import { describe, expect, it } from 'vitest';
import { aReceipt, aTrip } from '../test-support/domain.ts';
import { fixedClock } from './clock.ts';
import { deadlineStatusOf, exportDeadlineOf } from './deadlines.ts';
import { leaveForAirportBy } from './departure.ts';
import { tripPhaseOf } from './phase.ts';
import { resolveRules } from './resolve-rules.ts';
import { kaeruRules } from './rules-data.ts';

const rulesOn = (purchaseDate: string) => resolveRules(kaeruRules, purchaseDate);

const deadlineFor = (purchaseDate: string): string =>
  exportDeadlineOf(aReceipt({ purchaseDate }), rulesOn(purchaseDate));

describe('exportDeadlineOf (DR-031)', () => {
  it('TC-DOM-055 gives 2027-01-30 for a purchase on 2026-11-01, the official worked example', () => {
    expect(deadlineFor('2026-11-01')).toBe('2027-01-30');
  });

  it('TC-DOM-059 counts calendar days across month lengths, a year boundary and a leap day', () => {
    expect(deadlineFor('2026-12-31')).toBe('2027-03-31');
    expect(deadlineFor('2027-02-27')).toBe('2027-05-28');
    // 2028 is a leap year: 29 February exists and must be counted.
    expect(deadlineFor('2028-02-28')).toBe('2028-05-28');
    expect(deadlineFor('2028-12-02')).toBe('2029-03-02');
  });

  it('TC-DOM-060 property: always exactly the window later, and never before the purchase', () => {
    const start = Date.UTC(2026, 10, 1);
    for (let offset = 0; offset < 500; offset += 1) {
      const purchaseDate = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
      const deadline = deadlineFor(purchaseDate);
      const elapsed =
        (Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${purchaseDate}T00:00:00Z`)) /
        86_400_000;
      expect(elapsed).toBe(rulesOn(purchaseDate).deadline.exportWindowDays);
      expect(deadline > purchaseDate).toBe(true);
    }
  });

  it('TC-DOM-061 gives every receipt its own deadline, with no trip-level substitute', () => {
    const rules = rulesOn('2026-11-01');
    const receipts = [
      aReceipt({ id: 'a', purchaseDate: '2026-11-01' }),
      aReceipt({ id: 'b', purchaseDate: '2026-11-08' }),
      aReceipt({ id: 'c', purchaseDate: '2026-11-15' }),
    ];
    const deadlines = receipts.map((receipt) => exportDeadlineOf(receipt, rules));
    expect(deadlines).toEqual(['2027-01-30', '2027-02-06', '2027-02-13']);
    // A screen that wants one number surfaces the earliest; it never substitutes it.
    expect([...deadlines].sort()[0]).toBe('2027-01-30');
  });

  it('reads the window from the rules document rather than knowing 90', () => {
    const shortened = resolveRules(
      {
        ...kaeruRules,
        deadline: [
          {
            effectiveFrom: '2019-10-01',
            effectiveTo: null,
            status: 'confirmed-official',
            source: 'fixture',
            value: { exportWindowDays: 30, slackWarnDays: 3 },
          },
        ],
      },
      '2026-11-01',
    );
    expect(exportDeadlineOf(aReceipt({ purchaseDate: '2026-11-01' }), shortened)).toBe(
      '2026-12-01',
    );
  });
});

describe('deadlineStatusOf (DR-031, DR-076)', () => {
  const rules = rulesOn('2026-11-01');
  const receipt = aReceipt({ purchaseDate: '2026-11-01' });

  it('TC-DOM-056 counts the deadline day itself as within the window', () => {
    const status = deadlineStatusOf(
      receipt,
      aTrip(),
      rules,
      fixedClock('2027-01-30T09:00:00+09:00'),
    );
    expect(status.deadline).toBe('2027-01-30');
    expect(status.daysRemaining).toBe(0);
    expect(status.expired).toBe(false);
  });

  it('TC-DOM-057 expires one day later', () => {
    const status = deadlineStatusOf(
      receipt,
      aTrip(),
      rules,
      fixedClock('2027-01-31T09:00:00+09:00'),
    );
    expect(status.daysRemaining).toBe(-1);
    expect(status.expired).toBe(true);
  });

  it('TC-DOM-058 is well within the window the day after the purchase', () => {
    const status = deadlineStatusOf(
      receipt,
      aTrip(),
      rules,
      fixedClock('2026-11-02T09:00:00+09:00'),
    );
    expect(status.daysRemaining).toBe(89);
    expect(status.expired).toBe(false);
  });

  it('TC-DOM-062 reports a missed deadline when it falls before departure', () => {
    const longStay = aTrip({ departureDate: '2027-03-01' });
    const status = deadlineStatusOf(
      receipt,
      longStay,
      rules,
      fixedClock('2026-11-02T09:00:00+09:00'),
    );
    expect(status.deadline).toBe('2027-01-30');
    expect(status.slackDays).toBe(-30);
    expect(status.risk).toBe('missed');
  });

  it('TC-DOM-063 stays silent on a five-day trip, where nothing is close', () => {
    const shortTrip = aTrip({ departureDate: '2026-11-06' });
    const status = deadlineStatusOf(
      receipt,
      shortTrip,
      rules,
      fixedClock('2026-11-02T09:00:00+09:00'),
    );
    expect(status.risk).toBe('none');
    expect(status.slackDays).toBe(85);
    expect(status.expired).toBe(false);
  });

  it('TC-DOM-062 separates "no margin" from "already lost" at the departure date', () => {
    // DR-076a. A 90-day visa-free stay and a 90-day export window land on exactly zero
    // slack, and the traveller who gets there cannot extend. Nothing is lost — the window
    // is inclusive — but a flight moved one day later loses it, so the two states must
    // never render as one.
    const clock = fixedClock('2026-11-02T09:00:00+09:00');
    const riskOn = (departureDate: string) =>
      deadlineStatusOf(receipt, aTrip({ departureDate }), rules, clock).risk;

    // Deadline is 2027-01-30. Slack is deadline minus departure.
    expect(riskOn('2027-01-31')).toBe('missed'); // they leave the day after it expires
    expect(riskOn('2027-03-01')).toBe('missed');
    expect(riskOn('2027-01-30')).toBe('no_margin'); // the deadline is their departure day
    expect(riskOn('2027-01-27')).toBe('no_margin'); // three days of slack, the limit
    expect(riskOn('2027-01-26')).toBe('none'); // four days, comfortable
  });

  it('reads the slack window from the rules document rather than knowing 3', () => {
    const generous = resolveRules(
      {
        ...kaeruRules,
        deadline: [
          {
            effectiveFrom: '2019-10-01',
            effectiveTo: null,
            status: 'confirmed-official',
            source: 'fixture',
            value: { exportWindowDays: 90, slackWarnDays: 10 },
          },
        ],
      },
      '2026-11-01',
    );
    const clock = fixedClock('2026-11-02T09:00:00+09:00');
    const trip = aTrip({ departureDate: '2027-01-25' }); // five days of slack
    expect(deadlineStatusOf(receipt, trip, rules, clock).risk).toBe('none');
    expect(deadlineStatusOf(receipt, trip, generous, clock).risk).toBe('no_margin');
  });

  it('never says a deadline is fine for an old-system receipt, because it has none', () => {
    // "We checked and there is room" and "there is nothing to check" look identical on a
    // screen and license opposite conclusions (DR-003, DR-064).
    const oldSystem = aReceipt({ purchaseDate: '2026-10-31' });
    const status = deadlineStatusOf(
      oldSystem,
      aTrip({ departureDate: '2026-11-06' }),
      resolveRules(kaeruRules, '2026-10-31'),
      fixedClock('2026-11-02T09:00:00+09:00'),
    );
    expect(status.risk).toBe('not_applicable');
    for (const departureDate of ['2026-11-06', '2027-01-29', '2027-01-30', '2027-03-01']) {
      const anyTrip = aTrip({ departureDate });
      expect(
        deadlineStatusOf(
          oldSystem,
          anyTrip,
          resolveRules(kaeruRules, '2026-10-31'),
          fixedClock('2026-11-02T09:00:00+09:00'),
        ).risk,
      ).toBe('not_applicable');
    }
  });

  it('TC-DOM-064 changes the countdown by exactly one across a Japanese midnight', () => {
    const before = deadlineStatusOf(
      receipt,
      aTrip(),
      rules,
      fixedClock('2026-11-10T23:59:00+09:00'),
    );
    const after = deadlineStatusOf(
      receipt,
      aTrip(),
      rules,
      fixedClock('2026-11-11T00:01:00+09:00'),
    );
    expect(before.daysRemaining - after.daysRemaining).toBe(1);
  });

  it('TC-DOM-064 counts in Japan time even when the device is a day behind', () => {
    // 2026-11-11 00:30 in Japan is still 2026-11-10 in Taipei and 2026-11-10 in Los Angeles.
    const instant = fixedClock('2026-11-11T00:30:00+09:00');
    const inJapan = deadlineStatusOf(receipt, aTrip(), rules, instant);
    const lateOn10th = deadlineStatusOf(
      receipt,
      aTrip(),
      rules,
      fixedClock('2026-11-10T23:30:00+09:00'),
    );
    expect(inJapan.daysRemaining).toBe(lateOn10th.daysRemaining - 1);
  });
});

describe('tripPhaseOf (IA flow D)', () => {
  const trip = aTrip({ departureDate: '2026-11-20' });
  const phaseOn = (instant: string) => tripPhaseOf(trip, fixedClock(instant));

  it('has no trip to phase before one exists', () => {
    expect(tripPhaseOf(null, fixedClock('2026-11-01T09:00:00+09:00'))).toBe('no_trip');
  });

  it('is before the trip while departure is more than a day away', () => {
    expect(phaseOn('2026-11-01T09:00:00+09:00')).toBe('before');
    expect(phaseOn('2026-11-18T23:59:00+09:00')).toBe('before');
  });

  it('becomes the last day exactly one day before departure', () => {
    expect(phaseOn('2026-11-19T00:01:00+09:00')).toBe('last_day');
    expect(phaseOn('2026-11-19T23:59:00+09:00')).toBe('last_day');
  });

  it('becomes departure day on the date itself, in Japan time', () => {
    expect(phaseOn('2026-11-20T00:01:00+09:00')).toBe('departure_day');
    expect(phaseOn('2026-11-20T23:59:00+09:00')).toBe('departure_day');
    // 2026-11-20 00:30 in Japan is still the 19th in Taipei. Reading the device calendar
    // would show the packing plan on the morning Airport Mode exists for.
    expect(tripPhaseOf(trip, fixedClock('2026-11-19T23:30:00+08:00'))).toBe('departure_day');
  });

  it('is after the trip from the following day', () => {
    expect(phaseOn('2026-11-21T00:01:00+09:00')).toBe('after');
    expect(phaseOn('2027-01-01T09:00:00+09:00')).toBe('after');
  });
});

describe('leaveForAirportBy (DR-032, UJ-022)', () => {
  it('TC-DOM-075 tells Alex to leave by 05:45 for a 07:45 flight with 60 and 60', () => {
    // UJ-022's narrative says 04:50, which adds his hotel-to-airport journey. Kaeru does
    // not know where he is sleeping and does not invent it: this is the auditable part of
    // the arithmetic, flightTime − checkInMinutes − airportBufferMinutes.
    const trip = aTrip({ flightTime: '07:45', checkInMinutes: 60, airportBufferMinutes: 60 });
    expect(leaveForAirportBy(trip)).toEqual({ time: '05:45', dayOffset: 0, explained: true });
  });

  it('TC-DOM-074 @unconfirmed moves with the buffer, which is a per-trip setting', () => {
    const base = { flightTime: '18:40', checkInMinutes: 60 };
    expect(leaveForAirportBy(aTrip({ ...base, airportBufferMinutes: 30 }))?.time).toBe('17:10');
    expect(leaveForAirportBy(aTrip({ ...base, airportBufferMinutes: 60 }))?.time).toBe('16:40');
    expect(leaveForAirportBy(aTrip({ ...base, airportBufferMinutes: 90 }))?.time).toBe('16:10');
  });

  it('TC-DOM-074 @unconfirmed moves with the airline check-in requirement too', () => {
    const base = { flightTime: '18:40', airportBufferMinutes: 60 };
    expect(leaveForAirportBy(aTrip({ ...base, checkInMinutes: 60 }))?.time).toBe('16:40');
    expect(leaveForAirportBy(aTrip({ ...base, checkInMinutes: 120 }))?.time).toBe('15:40');
  });

  it('returns nothing when there is no flight time, rather than a placeholder', () => {
    expect(leaveForAirportBy(aTrip())).toBeNull();
    expect(leaveForAirportBy(aTrip({ flightTime: 'tomorrow morning' }))).toBeNull();
    expect(leaveForAirportBy(aTrip({ flightTime: '25:00' }))).toBeNull();
  });

  it('wraps to the previous evening for an early-morning flight', () => {
    const redEye = aTrip({ flightTime: '01:00', checkInMinutes: 60, airportBufferMinutes: 60 });
    expect(leaveForAirportBy(redEye)).toEqual({ time: '23:00', dayOffset: -1, explained: true });
    // dayOffset is the whole point: "23:00" alone on a departure-day screen is 22 hours late.
  });

  it('pads the clock reading so it is never 9:5', () => {
    expect(
      leaveForAirportBy(
        aTrip({ flightTime: '11:05', checkInMinutes: 60, airportBufferMinutes: 60 }),
      )?.time,
    ).toBe('09:05');
  });
});
