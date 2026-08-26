import { getWeeklyPeriod } from "../shared/weekly-period.js";

/*
 * The one central sentinel for every non-weekly tracker value's periodKey.
 * Never inline the literal "ALWAYS" anywhere else - import this constant.
 *
 * periodKey has no database default (see the migration) precisely so a
 * caller that bypasses this resolver fails loudly (a required column with
 * no value) rather than silently writing the wrong reset semantics.
 */
export const NON_WEEKLY_TRACKER_PERIOD_KEY =
  "ALWAYS";

export function resolveTrackerPeriodKey(
  resetBehavior:
    | "WEEKLY"
    | "SEASONAL"
    | "PERMANENT",
  now = new Date()
): string {
  if (resetBehavior === "WEEKLY") {
    return getWeeklyPeriod(now).key;
  }

  /*
   * SEASONAL and PERMANENT share the same physical sentinel - the
   * distinction between them lives in the definition's own scopeKey/
   * meaning (a SEASONAL definition belongs to one season's scopeKey and
   * is expected to stop receiving new values once that season ends; a
   * PERMANENT definition is not tied to retiring at a season boundary),
   * never in different value storage.
   */
  return NON_WEEKLY_TRACKER_PERIOD_KEY;
}
