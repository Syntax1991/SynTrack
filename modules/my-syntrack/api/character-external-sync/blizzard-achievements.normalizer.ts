import type { BattleNetCharacterAchievements } from "../../../data-platform/api/integrations/battlenet/battlenet.types.js";
import type { NormalizedBlizzardAchievementsPayload } from "./character-achievements-sync.types.js";

/*
 * Only the catalog's watched achievement ids are normalized/persisted -
 * Blizzard's full response has 3000+ entries per character; SynTrack
 * only needs the small, catalog-defined set (Phase E9). `response ===
 * null` (a clean 404 / no achievements profile) normalizes to an empty
 * list, not an error - see CharacterAchievementsRefreshService.
 */
export function normalizeBlizzardAchievements(
  response: BattleNetCharacterAchievements | null,
  watchedAchievementIds: ReadonlySet<number>
): NormalizedBlizzardAchievementsPayload {
  if (!response) {
    return { achievements: [] };
  }

  const achievements = (response.achievements ?? [])
    .filter(
      (entry): entry is typeof entry & { id: number } =>
        typeof entry.id === "number" && watchedAchievementIds.has(entry.id)
    )
    .map((entry) => ({
      achievementId: entry.id,
      earnedByCharacter: entry.criteria?.is_completed === true,
      completedTimestamp:
        typeof entry.completed_timestamp === "number"
          ? entry.completed_timestamp
          : null
    }));

  return { achievements };
}
