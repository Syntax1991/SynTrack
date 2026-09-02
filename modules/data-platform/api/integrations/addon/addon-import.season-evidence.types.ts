export type AddonSeasonAchievementEvidence = {
  trackerKey: string;
  achievementId: number | null;
  accountCompleted: boolean | null;
  earnedByCharacter: boolean | null;
};

export type AddonSeasonQuestEvidence = {
  trackerKey: string;
  questId: number | null;
  flaggedCompleted: boolean | null;
};

export type AddonSeasonEvidenceSnapshot = {
  schemaVersion: number;
  capturedAt: string | null;
  achievements: Record<string, AddonSeasonAchievementEvidence>;
  quests: Record<string, AddonSeasonQuestEvidence>;
};
