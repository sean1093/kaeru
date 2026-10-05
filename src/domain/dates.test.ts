import { describe, expect, it } from 'vitest';
import { fixedClock } from './clock.ts';
import {
  addDays,
  calendarDateIn,
  calendarDateToInstant,
  daysBetween,
  daysUntil,
  isCalendarDate,
  JAPAN_TIME_ZONE,
  TAIWAN_TIME_ZONE,
  today,
} from './dates.ts';

describe('calendarDateIn', () => {
  it('resolves an instant to the calendar date of the requested zone', () => {
    // 2026-11-01 23:30 in Taipei is already 2026-11-02 in Tokyo.
    const instant = new Date('2026-11-01T15:30:00Z');
    expect(calendarDateIn(instant, TAIWAN_TIME_ZONE)).toBe('2026-11-01');
    expect(calendarDateIn(instant, JAPAN_TIME_ZONE)).toBe('2026-11-02');
    expect(calendarDateIn(instant, 'UTC')).toBe('2026-11-01');
  });

  it('does not drift at the far side of the date line', () => {
    const instant = new Date('2026-11-01T11:00:00Z');
    expect(calendarDateIn(instant, 'Pacific/Kiritimati')).toBe('2026-11-02');
    expect(calendarDateIn(instant, 'Pacific/Midway')).toBe('2026-11-01');
  });
});

describe('today', () => {
  it('reads the injected clock, never the machine clock', () => {
    const clock = fixedClock('2026-12-31T16:00:00Z');
    expect(today(clock, JAPAN_TIME_ZONE)).toBe('2027-01-01');
    expect(today(clock, TAIWAN_TIME_ZONE)).toBe('2027-01-01');
    expect(today(clock, 'UTC')).toBe('2026-12-31');
  });
});

describe('daysBetween', () => {
  it('counts whole calendar days across months and years', () => {
    expect(daysBetween('2026-11-01', '2026-11-02')).toBe(1);
    expect(daysBetween('2026-11-01', '2027-01-30')).toBe(90);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('counts leap days', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2027-02-28', '2027-03-01')).toBe(1);
  });

  it('is negative when the target is in the past and zero on the same day', () => {
    expect(daysBetween('2026-11-02', '2026-11-01')).toBe(-1);
    expect(daysBetween('2026-11-01', '2026-11-01')).toBe(0);
  });

  it('rejects anything that is not a calendar date', () => {
    expect(() => daysBetween('2026-11-1', '2026-11-02')).toThrow(RangeError);
  });
});

describe('daysUntil', () => {
  it('changes by exactly one across the local midnight boundary', () => {
    const beforeMidnight = daysUntil(
      '2026-11-10',
      fixedClock('2026-11-01T14:59:00Z'),
      JAPAN_TIME_ZONE,
    );
    const afterMidnight = daysUntil(
      '2026-11-10',
      fixedClock('2026-11-01T15:01:00Z'),
      JAPAN_TIME_ZONE,
    );
    expect(beforeMidnight).toBe(9);
    expect(afterMidnight).toBe(8);
  });

  it('gives a different answer for Tokyo and Taipei at the same instant', () => {
    const clock = fixedClock('2026-11-01T15:30:00Z');
    expect(daysUntil('2026-11-10', clock, JAPAN_TIME_ZONE)).toBe(8);
    expect(daysUntil('2026-11-10', clock, TAIWAN_TIME_ZONE)).toBe(9);
  });
});

describe('addDays', () => {
  it('walks the calendar forwards and backwards', () => {
    expect(addDays('2026-11-01', 90)).toBe('2027-01-30');
    expect(addDays('2027-01-30', -90)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 0)).toBe('2026-11-01');
  });
});

describe('isCalendarDate', () => {
  it('accepts well-formed dates and rejects impossible ones', () => {
    expect(isCalendarDate('2026-11-01')).toBe(true);
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2027-02-29')).toBe(false);
    expect(isCalendarDate('2026-13-01')).toBe(false);
    expect(isCalendarDate('2026-11-1')).toBe(false);
    expect(isCalendarDate('')).toBe(false);
  });
});

describe('calendarDateToInstant', () => {
  it('lands mid-day UTC so formatters cannot shift the date', () => {
    expect(calendarDateToInstant('2026-11-01').toISOString()).toBe('2026-11-01T12:00:00.000Z');
  });
});
