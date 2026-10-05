/**
 * The one piece of tax-system knowledge the M0 shell needs: when the revised
 * refund-at-departure system starts. Actual refund rules (eligibility, thresholds,
 * operator behaviour, the 90-day export window) are M1 work and will live here as
 * data with effective dates — see docs/architecture/overview.md.
 *
 * Source: National Tax Agency, "Revision of the consumption tax exemption system for
 * foreign visitors" — effective 2026-11-01. Cited and dated in docs/research/.
 */
import type { Clock } from './clock.ts';
import { type CalendarDate, daysUntil, JAPAN_TIME_ZONE } from './dates.ts';

export const TAX_FREE_SYSTEM_START: CalendarDate = '2026-11-01';

export type SystemPhase = 'before' | 'active';

export interface SystemStatus {
  phase: SystemPhase;
  /** Calendar days until the new system starts; 0 or negative once it is live. */
  daysUntilStart: number;
}

export function systemStatus(clock: Clock, timeZone: string = JAPAN_TIME_ZONE): SystemStatus {
  const daysUntilStart = daysUntil(TAX_FREE_SYSTEM_START, clock, timeZone);
  return { phase: daysUntilStart > 0 ? 'before' : 'active', daysUntilStart };
}
