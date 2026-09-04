import type { BattleNetMythicKeystoneBestRun, BattleNetMythicKeystoneProfile, BattleNetMythicKeystoneSeasonProfile } from "../../../data-platform/api/integrations/battlenet/battlenet.types.js";
import type { NormalizedBlizzardMythicPlusBestRun, NormalizedBlizzardMythicPlusPayload } from "./character-external-sync.types.js";

const NO_PROFILE_PAYLOAD: NormalizedBlizzardMythicPlusPayload = {
  hasProfile: false,
  rating: null,
  rawRating: null,
  currentPeriod: { periodId: null, bestRuns: [] },
  season: { seasonId: null, bestRuns: [] }
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
 * Blizzard assigns season ids monotonically as seasons ship (live-
 * verified, Phase D.1: a real character's `seasons[]` returned
 * [18, 14, 15, 13] - not in order, highest id 18 was the season the
 * character was actively playing). Same heuristic philosophy as Phase
 * C's Midnight-tier resolution: never trust array order, never guess a
 * season number, always take the highest numeric id. Returns null when
 * the character has no `seasons[]` link at all (never done Mythic+ in
 * any season).
 */
export function resolveCurrentSeasonId(
  profile: BattleNetMythicKeystoneProfile
): number | null {
  const ids = (profile.seasons ?? [])
    .map((season) => season.id)
    .filter((id): id is number => typeof id === "number");

  return ids.length === 0 ? null : Math.max(...ids);
}

/*
 * `profile === null` means Blizzard cleanly confirmed no Mythic Keystone
 * profile exists for this character (a real 404, distinct from a thrown
 * network/5xx error) - normalized the same as a real profile with zero
 * best runs, `hasProfile: false` flags the difference for the authority
 * service (see CharacterMythicPlusAuthorityService).
 *
 * `seasonProfile` is fetched separately by the refresh service (using
 * resolveCurrentSeasonId above) and may be null even when `profile`
 * isn't - either because the character has no season link yet, or
 * because the season sub-resource fetch itself failed independently
 * (Phase D.1 observed this endpoint family can be intermittently
 * unavailable) - a missing season fetch must never fail the whole
 * refresh when current_period data was already obtained successfully.
 *
 * Rounding rule (Phase D): the addon already floors Blizzard's decimal
 * rating via math.floor() before it ever reaches SynTrack (see
 * WeekliesSignals.lua's captureMythicPlusRating) - Math.floor here
 * mirrors that exact rule. `rawRating` keeps the unrounded value as
 * evidence.
 *
 * currentPeriod.bestRuns and season.bestRuns are kept as two separate,
 * explicitly named objects rather than one array - see the type's doc
 * comment in character-external-sync.types.ts for why merging them would
 * be ambiguous (season.bestRuns can contain more than one entry per
 * dungeon; current_period is WEEKLY-scoped, season is season-wide).
 */
export function normalizeBlizzardMythicPlus(
  profile: BattleNetMythicKeystoneProfile | null,
  seasonProfile: BattleNetMythicKeystoneSeasonProfile | null = null
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
    currentPeriod: {
      periodId:
        typeof profile.current_period?.period?.id === "number"
          ? profile.current_period.period.id
          : null,
      bestRuns: (profile.current_period?.best_runs ?? []).map(normalizeBestRun)
    },
    season: {
      seasonId:
        typeof seasonProfile?.season?.id === "number"
          ? seasonProfile.season.id
          : null,
      bestRuns: (seasonProfile?.best_runs ?? []).map(normalizeBestRun)
    }
  };
}
