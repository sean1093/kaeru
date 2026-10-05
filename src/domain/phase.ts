/**
 * Which home screen the traveller gets.
 *
 * The app knows the departure date, so it never asks which stage of the trip this is
 * (IA flow D). The phases map one to one onto the home states: no trip (S11), before the
 * last stretch (S12), the day before departure when the packing plan becomes the hero
 * (S17), departure day (S13), and after (S14). S10 "Home — during trip" is not a phase: it
 * is the body every one of those states renders into, which is why the union has five
 * members and not six.
 *
 * Every comparison is on Japan calendar dates. "Departure is today" has to mean today in
 * Japan: a traveller whose phone is still on Taipei time at 23:30 is already on their
 * departure day in Tokyo, and showing them the before-trip home would hide Airport Mode on
 * the one morning it exists for.
 */
import type { TripPhase, TripPhaseOf } from './api.ts';
import { daysBetween, JAPAN_TIME_ZONE, today } from './dates.ts';

export const tripPhaseOf: TripPhaseOf = (trip, clock): TripPhase => {
  if (trip === null) return 'no_trip';
  const daysToDeparture = daysBetween(today(clock, JAPAN_TIME_ZONE), trip.departureDate);
  if (daysToDeparture < 0) return 'after';
  if (daysToDeparture === 0) return 'departure_day';
  if (daysToDeparture === 1) return 'last_day';
  return 'before';
};
