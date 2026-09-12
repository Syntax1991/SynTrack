/*
 * ACHIEVEMENTS domain types, split into their own file rather than
 * character-external-sync.types.ts (already at the 350-line cap).
 *
 * Only the catalog's watched achievement ids are ever normalized/stored
 * here (see blizzard-achievements.normalizer.ts) - Blizzard's full
 * achievements response has 3000+ entries per character and SynTrack
 * only needs membership + per-character completion for a small,
 * catalog-defined set (Phase E9).
 *
 * `earnedByCharacter` is Blizzard's `criteria.is_completed` - Phase E's
 * live audit PROVED this is character-specific for the dungeon-portal
 * achievement family (exact match against the addon's own
 * wasEarnedByMe across 7 ids x 3 characters) but also caught it NOT
 * being reliably character-specific for at least one other achievement
 * id (62872) - this field's meaning is per-achievement, not universal,
 * so it is never treated as ground truth alone; see
 * CharacterAchievementAuthorityService for the monotonic OR-merge this
 * uncertainty requires.
 */
export type NormalizedBlizzardAchievementEntry = {
  achievementId: number;
  earnedByCharacter: boolean;
  /** Last progress update time, NOT necessarily the earn date - raw evidence only. */
  completedTimestamp: number | null;
};

export type NormalizedBlizzardAchievementsPayload = {
  achievements: NormalizedBlizzardAchievementEntry[];
};

export type AchievementsRefreshOutcome =
  | {
      status: "SUCCESS";
      characterId: string;
      watchedAchievementCount: number;
    }
  | {
      status: "FAILED";
      characterId: string;
      reason: string;
    }
  | {
      status: "NOT_FOUND";
      characterId: string;
    };

export type AchievementsRefreshSummary = {
  totalCharacters: number;
  succeeded: number;
  failed: number;
  results: AchievementsRefreshOutcome[];
};
