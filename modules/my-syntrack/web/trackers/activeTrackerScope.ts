/*
 * Mirrors the backend's ACTIVE_TRACKER_SCOPE_KEY
 * (modules/my-syntrack/api/trackers/active-tracker-scope.ts). SynTrack
 * has no formal Season/active-scope model yet - this is the one place
 * the frontend's currently-active tracker scope is configured, never
 * scattered across components.
 */
export const ACTIVE_TRACKER_SCOPE_KEY =
  "MIDNIGHT-S1";
