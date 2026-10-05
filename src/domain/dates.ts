/**
 * Calendar-date arithmetic.
 *
 * Refund deadlines are calendar rules ("leave Japan within 90 days of purchase"), not
 * elapsed-milliseconds rules, and the calendar that matters is Japan's. Every function
 * here is therefore explicit about its time zone and works on `YYYY-MM-DD` strings so
 * stored values are unambiguous, sortable and JSON-safe.
 */
import type { Clock } from './clock.ts';

/** `YYYY-MM-DD` in some named time zone. */
export type CalendarDate = string;

export const JAPAN_TIME_ZONE = 'Asia/Tokyo';
export const TAIWAN_TIME_ZONE = 'Asia/Taipei';

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The calendar date an instant falls on in `timeZone`. */
export function calendarDateIn(instant: Date, timeZone: string): CalendarDate {
  const parts = formatterFor(timeZone).formatToParts(instant);
  let year = '';
  let month = '';
  let day = '';
  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'day') day = part.value;
  }
  return `${year}-${month}-${day}`;
}

/** Today's calendar date in `timeZone`, according to `clock`. */
export function today(clock: Clock, timeZone: string): CalendarDate {
  return calendarDateIn(clock.now(), timeZone);
}

export function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  const utc = Date.UTC(Number(year), Number(month) - 1, Number(day));
  // Rejects 2026-02-30 and friends: the round trip must be stable.
  return calendarDateIn(new Date(utc), 'UTC') === value;
}

function dayNumber(date: CalendarDate): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`Not a YYYY-MM-DD date: ${date}`);
  const [, year, month, day] = match as unknown as [string, string, string, string];
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / MS_PER_DAY;
}

/** Whole calendar days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return dayNumber(to) - dayNumber(from);
}

/** Calendar days from today (in `timeZone`) until `target`. Negative once past. */
export function daysUntil(target: CalendarDate, clock: Clock, timeZone: string): number {
  return daysBetween(today(clock, timeZone), target);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date((dayNumber(date) + days) * MS_PER_DAY);
  return calendarDateIn(shifted, 'UTC');
}

/** Midday UTC on `date` — a safe instant to hand to `Intl` date formatters. */
export function calendarDateToInstant(date: CalendarDate): Date {
  return new Date(dayNumber(date) * MS_PER_DAY + MS_PER_DAY / 2);
}
