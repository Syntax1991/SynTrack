import type { OverviewDomainState } from "../overview/overview.types.js";

export type WeeklyGameplayDomainView = {
  state: OverviewDomainState;
  completeCount: number;
  applicableTotal: number;
  unknownCount: number;
  label: string;
};

export type WeeklyGameplayCharacterView = {
  characterId: string;
  vault: WeeklyGameplayDomainView;
  mythicPlus: WeeklyGameplayDomainView;
  raid: WeeklyGameplayDomainView;
  delves: WeeklyGameplayDomainView;
  mythicPlusAction: string | null;
  raidAction: string | null;
};

export type WeeklyGameplaySnapshotInput = {
  characterId: string;
  vaultCaptured: boolean;
  vaultCurrentPeriod: boolean | null;
  mythicPlusCaptured: boolean;
  raidCaptured: boolean;
  vaultActivities: Array<{
    typeName: string | null;
    threshold: number | null;
    progress: number | null;
  }>;
  mythicPlusRuns: Array<{
    keyLevel: number;
    completed: boolean | null;
    thisWeek: boolean | null;
  }>;
  raidLockouts: Array<{
    instanceName: string;
    encounterProgress: number | null;
    numEncounters: number | null;
    encountersJson: string;
  }>;
};
