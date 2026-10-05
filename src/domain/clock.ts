/**
 * Time source.
 *
 * Domain code never calls `new Date()` or `Date.now()` directly: every function that
 * needs "now" takes a `Clock`. That keeps rules pure and makes deadline tests
 * (90-day export window, departure countdowns) deterministic without fake timers.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** A clock frozen at `instant`. Accepts a Date or an ISO 8601 string. */
export function fixedClock(instant: Date | string): Clock {
  const frozen = typeof instant === 'string' ? new Date(instant) : new Date(instant.getTime());
  if (Number.isNaN(frozen.getTime())) {
    throw new RangeError(`fixedClock: invalid instant ${String(instant)}`);
  }
  return { now: () => new Date(frozen.getTime()) };
}
