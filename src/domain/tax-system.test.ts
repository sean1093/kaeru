import { describe, expect, it } from 'vitest';
import { fixedClock } from './clock.ts';
import { TAIWAN_TIME_ZONE } from './dates.ts';
import { systemStatus } from './tax-system.ts';

describe('systemStatus', () => {
  it('counts down in Japan time before the system starts', () => {
    expect(systemStatus(fixedClock('2026-10-05T00:00:00+09:00'))).toEqual({
      phase: 'before',
      daysUntilStart: 27,
    });
  });

  it('flips to active on the start date itself', () => {
    expect(systemStatus(fixedClock('2026-11-01T00:00:00+09:00'))).toEqual({
      phase: 'active',
      daysUntilStart: 0,
    });
    expect(systemStatus(fixedClock('2026-10-31T23:59:00+09:00')).phase).toBe('before');
  });

  it('stays active afterwards with a negative count', () => {
    expect(systemStatus(fixedClock('2026-11-11T09:00:00+09:00'))).toEqual({
      phase: 'active',
      daysUntilStart: -10,
    });
  });

  it('honours an explicit time zone', () => {
    const lateInTaipei = fixedClock('2026-10-31T23:30:00+08:00');
    expect(systemStatus(lateInTaipei, TAIWAN_TIME_ZONE).phase).toBe('before');
    expect(systemStatus(lateInTaipei).phase).toBe('active');
  });
});

describe('fixedClock', () => {
  it('refuses an unparseable instant instead of yielding Invalid Date', () => {
    expect(() => fixedClock('not a date')).toThrow(RangeError);
  });
});
