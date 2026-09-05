import { NONE_AUTHORITATIVE_MYTHIC_PLUS } from "../character-external-sync/character-mythic-plus-authority.service.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { AuthoritativeMythicPlusResult } from "../character-external-sync/character-external-sync.types.js";

type ResolvedTracker = {
  definition: TrackerDefinitionRow;
  state: CharacterTrackerState | null;
};

/*
 * Phase F1 read-path integration for the Season "Mythic+ rating"
 * checklist goal (the one real, rendered consumer of the season-to-date
 * M+ rating - see the Phase F1 report's read-path audit).
 *
 * CharacterMythicPlusAuthorityService.getAuthoritativeMythicPlus()
 * already implements the full PRIMARY=BLIZZARD/FALLBACK=ADDON contract
 * for this exact fact (its own addon-fallback repository reads the SAME
 * `mythic-plus-rating` CharacterTrackerValue this goal already displayed)
 * - so `authoritative.rating` is already "the best available number"
 * whenever it is non-null, and there is nothing left to merge here
 * beyond wrapping it back into the ResolvedTracker shape
 * deriveSeasonMythicPlusGoal expects, so that function stays completely
 * unaware Blizzard exists (same principle as the achievement merge).
 *
 * Vault/current-week M+ state is never read or referenced here - this
 * only ever touches the SEASONAL rating tracker, a model with zero
 * relationship to CharacterWeeklyVaultActivity/
 * CharacterWeeklyMythicPlusCapture.
 */
export function withAuthoritativeMythicPlusRating(
  resolved: ResolvedTracker | null,
  characterId: string,
  mythicPlusRatingByCharacterId: Map<string, AuthoritativeMythicPlusResult>
): ResolvedTracker | null {
  const authoritative =
    mythicPlusRatingByCharacterId.get(characterId) ??
    NONE_AUTHORITATIVE_MYTHIC_PLUS;

  if (authoritative.rating === null) {
    return resolved;
  }

  if (!resolved) {
    return null;
  }

  return {
    definition: resolved.definition,
    state: {
      trackerDefinitionId: resolved.definition.id,
      characterId: resolved.state?.characterId ?? "",
      periodKey: resolved.state?.periodKey ?? "ALWAYS",
      state: "RECORDED",
      source: authoritative.source,
      value: { valueType: "NUMBER", number: authoritative.rating }
    }
  };
}
