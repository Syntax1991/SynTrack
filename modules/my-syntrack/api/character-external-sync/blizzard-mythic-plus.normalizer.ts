import type { BattleNetMythicKeystoneBestRun, BattleNetMythicKeystoneProfile } from "../../../data-platform/api/integrations/battlenet/battlenet.types.js";
import type { NormalizedBlizzardMythicPlusBestRun, NormalizedBlizzardMythicPlusPayload } from "./character-external-sync.types.js";

const NO_PROFILE_PAYLOAD: NormalizedBlizzardMythicPlusPayload = {
  hasProfile: false,
  rating: null,
  rawRating: null,
  periodId: null,
  seasonIds: [],
  bestRuns: []
};

function normalizeBestRun(
  run: BattleNetMythicKeystoneBestRun
): NormalizedBlizzardMythicPlusBestRun {
  return {
    dungeonId: typeof run.dungeon?.id === "number" ? run.dungeon.id : null,
    dungeonName: run.dungeon?.name ?? null,
    keystoneLevel:
      typeof run.keystone_level === "number" ? run.keystone_level : null,
    durationMs: typeof run.duration === "number" ? run.duration : null,
    completedTimestamp:
      typeof run.completed_timestamp === "number"
        ? run.completed_timestamp
        : null,
    completedInTime:
      typeof run.is_completed_within_time === "boolean"
        ? run.is_completed_within_time
        : null,
    affixIds: (run.keystone_affixes ?? [])
      .map((affix) => affix.id)
      .filter((id): id is number => typeof id === "number"),
    runRating:
      typeof run.mythic_rating?.rating === "number"
        ? run.mythic_rating.rating
        : null,
    mapRating:
      typeof run.map_rating?.rating === "number"
        ? run.map_rating.rating
        : null
  };
}

/*
 * `profile === null` means Blizzard cleanly confirmed no Mythic Keystone
 * profile exists for this character (a real 404, distinct from a thrown
 * network/5xx error) - normalized the same as a real profile with zero
 * best runs, `hasProfile: false` flags the difference for the authority
 * service (see CharacterMythicPlusAuthorityService).
 *
 * Rounding rule (Phase D4): the addon already floors Blizzard's decimal
 * rating via math.floor() before it ever reaches SynTrack (see
 * WeekliesSignals.lua's captureMythicPlusRating) - Math.floor here
 * mirrors that exact rule so a Blizzard-sourced rating and an
 * addon-sourced rating are never displayed with two different rounding
 * conventions for what is conceptually the same number. `rawRating` keeps
 * the unrounded value as evidence for future use.
 */
export function normalizeBlizzardMythicPlus(
  profile: BattleNetMythicKeystoneProfile | null
): NormalizedBlizzardMythicPlusPayload {
  if (!profile) {
    return NO_PROFILE_PAYLOAD;
  }

  const rawRating =
    typeof profile.current_mythic_rating?.rating === "number"
      ? profile.current_mythic_rating.rating
      : null;

  return {
    hasProfile: true,
    rating: rawRating === null ? null : Math.floor(rawRating),
    rawRating,
    periodId:
      typeof profile.current_period?.period?.id === "number"
        ? profile.current_period.period.id
        : null,
    seasonIds: (profile.seasons ?? [])
      .map((season) => season.id)
      .filter((id): id is number => typeof id === "number"),
    bestRuns: (profile.current_period?.best_runs ?? []).map(normalizeBestRun)
  };
}
