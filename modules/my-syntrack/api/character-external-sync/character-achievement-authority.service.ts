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
