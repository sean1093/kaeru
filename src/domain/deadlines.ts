/**
 * The export deadline, per receipt.
 *
 * `DR-031`: the goods must leave Japan within 90 days, counted as "the day following the
 * date of purchase to the 90th day", with the deadline day itself valid. The National Tax
 * Agency's own worked example is a purchase on 2026-11-01 with a deadline of 2027-01-30,
 * which is `purchaseDate + 90` with both the arithmetic and the inclusivity pinned by it.
 *
 * **There is no trip-level deadline.** Each receipt carries its own, and a screen that
 * wants one number surfaces the earliest rather than substituting a trip figure — a
 * deadline inherited from a different receipt is wrong for every receipt but one.
 *
 * Everything here is calendar arithmetic in Japan time (`UR-07`). A 90-day window is not
 * 90 × 86,400 seconds: it crosses daylight-saving boundaries in the traveller's own zone,
 * month lengths and leap days, none of which may move the answer.
 */
import type { DeadlineRisk, DeadlineStatus, DeadlineStatusOf, ExportDeadlineOf } from './api.ts';
import { addDays, daysBetween, JAPAN_TIME_ZONE, today } from './dates.ts';

export const exportDeadlineOf: ExportDeadlineOf = (receipt, rules) =>
  addDays(receipt.purchaseDate, rules.deadline.exportWindowDays);

export const deadlineStatusOf: DeadlineStatusOf = (receipt, trip, rules, clock): DeadlineStatus => {
  const deadline = exportDeadlineOf(receipt, rules);
  const slackDays = daysBetween(trip.departureDate, deadline);
  const daysRemaining = daysBetween(today(clock, JAPAN_TIME_ZONE), deadline);

  // An old-system receipt has no customs step, so it has no deadline to be fine about
  // (DR-003, DR-064). Reporting `none` would be a claim that we checked and it is in good
  // shape, which is the one thing S29 exists to deny.
  let risk: DeadlineRisk = 'not_applicable';
  if (receipt.purchaseDate >= rules.system.refundSystemStart) {
    // DR-076, strictly before: a deadline falling *on* the departure date is met by
    // leaving that day, because the window is inclusive.
    // DR-076a: but zero slack is not an edge case for our users. A 90-day visa-free stay
    // and a 90-day export window land on exactly zero, and whoever gets there cannot
    // extend. The hazard is a flight moving later, and that does not care whether the
    // margin was zero days or three.
    risk =
      slackDays < 0 ? 'missed' : slackDays <= rules.deadline.slackWarnDays ? 'no_margin' : 'none';
  }

  return { deadline, daysRemaining, slackDays, risk, expired: daysRemaining < 0 };
};
