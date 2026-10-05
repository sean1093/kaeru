/**
 * When to leave for the airport.
 *
 * `flightTime − checkInMinutes − airportBufferMinutes` (`DR-032`, `UJ-022`). Customs
 * confirmation, including any inspection, has to happen **before** baggage check-in, and a
 * checked bag cannot be retrieved for a tax-free procedure — so the time this returns is
 * the time the whole refund depends on.
 *
 * Both terms default to 60 minutes and both are per-trip and user-correctable, because
 * airlines and airports differ and no official figure exists. Whatever renders this must
 * show the arithmetic rather than just its result: a recommendation the user cannot audit
 * is one they will ignore, and it must be labelled as Kaeru's recommendation.
 *
 * Travel time to the airport is deliberately **not** part of this. Kaeru does not know
 * where the traveller is sleeping, and a number that silently folded in a guess at a train
 * journey would be unauditable in exactly the way `DR-032` warns against.
 */
import type { LeaveForAirportBy } from './api.ts';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const CLOCK_TIME = /^(\d{2}):(\d{2})$/;

export const leaveForAirportBy: LeaveForAirportBy = (trip) => {
  const flightTime = trip.flightTime;
  if (flightTime === undefined) return null;
  const match = CLOCK_TIME.exec(flightTime);
  if (!match) return null;
  const [, hours, minutes] = match as unknown as [string, string, string];

  const departure = Number(hours) * MINUTES_PER_HOUR + Number(minutes);
  if (departure >= MINUTES_PER_DAY) return null;

  // An early flight puts the leave-by time on the previous evening. Wrapping keeps the
  // clock reading honest; the screen says which day it means, because this type carries a
  // time and nothing else.
  const leaveBy =
    (((departure - trip.checkInMinutes - trip.airportBufferMinutes) % MINUTES_PER_DAY) +
      MINUTES_PER_DAY) %
    MINUTES_PER_DAY;

  const hh = String(Math.floor(leaveBy / MINUTES_PER_HOUR)).padStart(2, '0');
  const mm = String(leaveBy % MINUTES_PER_HOUR).padStart(2, '0');
  return { time: `${hh}:${mm}`, explained: true };
};
