export type AddonWeeklyVaultActivity = {
  type: number;
  typeName: string | null;
  index: number | null;
  threshold: number | null;
  progress: number | null;
  activityId: number | null;
  level: number | null;
  activityTierId: number | null;
  claimId: number | null;
};

export type AddonWeeklyMythicPlusRun = {
  mapChallengeModeId: number | null;
  keyLevel: number;
  completed: boolean | null;
  thisWeek: boolean | null;
  durationSec: number | null;
  dungeonScore: number | null;
};

export type AddonWeeklyRaidEncounter = {
  index: number | null;
  name: string | null;
  isKilled: boolean | null;
};

export type AddonWeeklyRaidLockout = {
  name: string;
  difficulty: number | null;
  difficultyName: string | null;
  encounterProgress: number | null;
  numEncounters: number | null;
  encounters: AddonWeeklyRaidEncounter[];
};

export type AddonWeeklyActivitySnapshot = {
  schemaVersion: number;
  vaultCaptured: boolean;
  vaultGenerated: boolean | null;
  vaultCurrentPeriod: boolean | null;
  vaultCanClaim: boolean | null;
  vaultHasAvailable: boolean | null;
  vaultActivities: AddonWeeklyVaultActivity[];
  mythicPlusCaptured: boolean;
  mythicPlusRuns: AddonWeeklyMythicPlusRun[];
  raidCaptured: boolean;
  raids: AddonWeeklyRaidLockout[];
};
