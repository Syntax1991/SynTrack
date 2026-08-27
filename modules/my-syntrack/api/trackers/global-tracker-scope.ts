/*
 * GLOBAL is a reserved tracker scope, not a TrackerScopeProfile row -
 * a tracker definition created under this exact scopeKey is meant to
 * survive every season switch (e.g. a permanent personal goal), so it
 * is combined into every read alongside whichever season is active
 * (see TrackerScopeProfileService.getActive() + OverviewService).
 */
export const GLOBAL_TRACKER_SCOPE_KEY =
  "GLOBAL";
