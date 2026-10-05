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
import type { DeadlineStatus, DeadlineStatusOf, ExportDeadlineOf } from './api.ts';
import { addDays, daysBetween, JAPAN_TIME_ZONE, today } from './dates.ts';

export const exportDeadlineOf: ExportDeadlineOf = (receipt, rules) =>
  addDays(receipt.purchaseDate, rules.deadline.exportWindowDays);

export const deadlineStatusOf: DeadlineStatusOf = (receipt, trip, rules, clock): DeadlineStatus => {
  const deadline = exportDeadlineOf(receipt, rules);
  const daysRemaining = daysBetween(today(clock, JAPAN_TIME_ZONE), deadline);
  return {
    deadline,
    daysRemaining,
    // DR-076, strictly before: a deadline that falls *on* the departure date is met by
    // leaving that day, because the deadline day is inclusive. Warning there would fire on
    // a receipt that is fine, and a warning that fires when nothing is wrong is noise.
    atRisk: deadline < trip.departureDate,
    expired: daysRemaining < 0,
  };
};
