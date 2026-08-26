import type {
  EmbellishmentOverviewState,
  TierOverviewState
} from "./overview.types.js";

/*
 * Tier/Set piece count and embellishment identity have no data source
 * anywhere in SynTrack yet - CharacterGearSlot never records "is this a
 * tier piece" or "which embellishment effect is on this item." Both
 * always resolve to NOT_TRACKED until a future Gear-capture phase adds a
 * real source; this function exists so that seam is explicit and
 * central rather than a silently-omitted column.
 */
export function resolveTierOverviewState(): TierOverviewState {
  return { state: "NOT_TRACKED" };
}

export function resolveEmbellishmentOverviewState(): EmbellishmentOverviewState {
  return { state: "NOT_TRACKED" };
}
