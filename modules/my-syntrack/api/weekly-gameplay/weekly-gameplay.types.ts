import type { OverviewDomainState } from "../overview/overview.types.js";

export type WeeklyGameplayDomainView = {
  state: OverviewDomainState;
  completeCount: number;
  applicableTotal: number;
  unknownCount: number;
  label: string;
  rawCompleteCount: number;
  knownUnlockedSlots: number;
  maxSlots: number;
  hasUnknownCategories: boolean;
  unknownCategoryCount: number;
  unresolvedCategoryLabels?: string[];
};

export type WeeklyGameplayCharacterView = {
  characterId: string;
  vault: WeeklyGameplayDomainView;
  mythicPlus: WeeklyGameplayDomainView;
  raid: WeeklyGameplayDomainView;
  delves: WeeklyGameplayDomainView;
  mythicPlusAction: string | null;
  raidAction: string | null;
  delvesAction: string | null;
  highestKeyLevel: number | null;
};

export type WeeklyGameplaySnapshotInput = {
  characterId: string;
  vaultCaptured: boolean;
  vaultCurrentPeriod: boolean | null;
  vaultGenerated: boolean | null;
  vaultCanClaim: boolean | null;
  vaultHasAvailable: boolean | null;
  mythicPlusCaptured: boolean;
  raidCaptured: boolean;
  vaultActivities: Array<{
    type: number | null;
    typeName: string | null;
    index: number | null;
    threshold: number | null;
    progress: number | null;
    level: number | null;
  }>;
  mythicPlusRuns: Array<{
    keyLevel: number;
    completed: boolean | null;
    thisWeek: boolean | null;
    mapChallengeModeId?: number | null;
    durationSec?: number | null;
  }>;
  raidLockouts: Array<{
    instanceName: string;
    encounterProgress: number | null;
    numEncounters: number | null;
    encountersJson: string;
  }>;
};
