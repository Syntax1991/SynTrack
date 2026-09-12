import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_ACHIEVEMENTS,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type { NormalizedBlizzardAchievementsPayload } from "./character-achievements-sync.types.js";

/*
 * Achievement completion is monotonic - Blizzard cannot "un-earn" an
 * achievement, so a successful Blizzard snapshot's TRUE values never go
 * stale; there is no staleness threshold here at all (unlike Equipment/
 * Profile/Professions/Mythic+, whose facts genuinely change over time).
 *
 * mergeAchievementCompletion() is the actual authority rule, deliberately
 * NOT a naive "Blizzard is PRIMARY, overwrite addon" - Phase E's live
 * audit caught a real character where the addon's wasEarnedByMe capture
 * (AOTC: Ula'tek) was TRUE while Blizzard's criteria.is_completed was
 * FALSE for the exact same achievement at the exact same moment
 * (Blizzard's Character Achievements API can lag real, live client
 * state by an unknown amount). A naive Blizzard-overrides-addon design
 * would have regressed a real, already-earned achievement back to
 * "incomplete" - exactly the kind of monotonic-truth violation this
 * codebase treats as a correctness bug elsewhere (see
 * CharacterProfessionKnowledgeTreasureSnapshot's "never regress
 * COMPLETE" rule). Instead: TRUE from EITHER source wins outright; a
 * FALSE from one source is only used when the other source has no
 * opinion (null); only null+null is genuinely UNKNOWN.
 */
export function mergeAchievementCompletion(
  addonValue: boolean | null,
  blizzardValue: boolean | null
): boolean | null {
  if (addonValue === true || blizzardValue === true) {
    return true;
  }

  if (addonValue === false || blizzardValue === false) {
    return false;
  }

  return null;
}

/*
 * Corrective safety review (post-Phase E): response shape/structure does
 * NOT prove `criteria.is_completed` means "this specific character
 * earned it" - Phase E's own live audit proved this field's
 * character-specificity is per-achievement, not universal. Live evidence:
 *   - Dungeon Portals (62437-62444): PROVEN character-specific - exact
 *     match against the addon's wasEarnedByMe across 7 ids x 3 real
 *     characters, 21/21 data points, zero discrepancies.
 *   - 62872 (Serpent Scion, a structurally identical single-criteria
 *     achievement, NOT in this allowlist): Blizzard reported true for
 *     two characters whose addon-captured wasEarnedByMe was false -
 *     proof that "looks like the proven family" is not sufficient.
 *   - AOTC (63650): only live data point is Blizzard reporting false
 *     while the addon's live client read true for the same character -
 *     this proves lag/staleness, NOT what Blizzard reports on a
 *     non-earning character once it eventually flips to true. UNVERIFIED
 *     until a real cross-character (earner vs non-earner) comparison
 *     exists for a true value.
 *   - CE (63651): nobody has earned it yet on any tracked character -
 *     completely unverified in either direction.
 *
 * Only ids in this set may have Blizzard evidence applied to a
 * CHARACTER-scoped goal (see withAchievementBlizzardMerge in
 * season-achievement-blizzard-merge.ts). This is a strict allowlist,
 * never inferred from achievement-family similarity, response shape, or
 * "it's the same kind of achievement as a proven one" - each id is added
 * here only after its own live cross-character proof exists. WARBAND
 * aggregation (blizzardWarbandAchievementSignal) is NOT gated by this
 * list - Warband's cross-character OR is safe regardless of any single
 * achievement's character-specificity, since it only ever asks "does
 * this exist anywhere on the account," which is exactly what Blizzard's
 * account-wide propagation already answers correctly by design.
 */
export const CHARACTER_SCOPE_PROVEN_BLIZZARD_ACHIEVEMENT_IDS = new Set<number>([
  62437, 62438, 62439, 62440, 62441, 62442, 62443, 62444 // Dungeon Portals
]);

export class CharacterAchievementAuthorityService {
  constructor(
    private readonly snapshotRepository: CharacterExternalSnapshotRepository
  ) {}

  /**
   * Blizzard's per-achievement `earnedByCharacter` fact for one
   * character, keyed by achievement id - empty map when no successful
   * Blizzard snapshot exists yet (never thrown, never fabricated).
   */
  async getBlizzardEarnedByCharacterMap(
    characterId: string
  ): Promise<Map<number, boolean>> {
    const snapshot =
      await this.snapshotRepository.findOne<NormalizedBlizzardAchievementsPayload>(
        characterId,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_ACHIEVEMENTS
      );

    if (!snapshot || !snapshot.payload) {
      return new Map();
    }

    return new Map(
      snapshot.payload.achievements.map((entry) => [
        entry.achievementId,
        entry.earnedByCharacter
      ])
    );
  }

  async getBlizzardEarnedByCharacterMaps(
    characterIds: string[]
  ): Promise<Map<string, Map<number, boolean>>> {
    const entries = await Promise.all(
      characterIds.map(
        async (characterId) =>
          [characterId, await this.getBlizzardEarnedByCharacterMap(characterId)] as const
      )
    );

    return new Map(entries);
  }
}
