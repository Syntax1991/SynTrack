/*
 * SynTrack has no formal Season/active-scope Prisma model yet (out of
 * scope for this phase - see docs/architecture notes on the tracker
 * schema proposal). Until one exists, this is the ONE place the
 * currently-active tracker scope is configured - every consumer
 * (Overview, the tracker management UI, the matrix) imports this
 * constant rather than hardcoding a scope literal anywhere else.
 *
 * Changing seasons today means updating this one value; a real
 * season/profile model (letting multiple scopes be browsed, historical
 * scopes stay selectable, etc.) is real future work, not implemented
 * here.
 */
export const ACTIVE_TRACKER_SCOPE_KEY =
  "MIDNIGHT-S1";
