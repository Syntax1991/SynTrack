export type VaultSlotState = "UNLOCKED" | "LOCKED" | "UNKNOWN";

export type VaultSlotDetail = {
  slot: 1 | 2 | 3;
  state: VaultSlotState;
  threshold: number | null;
  progress: number | null;
  level: number | null;
  rewardLabel: string | null;
};

export type MythicPlusRunDetail = {
  mapChallengeModeId: number | null;
  keyLevel: number;
  completed: boolean | null;
  thisWeek: boolean | null;
  durationSec: number | null;
};

export type VaultDomainProgress = {
  state: string;
  completeCount: number;
  applicableTotal: number;
  knownUnlockedSlots: number;
  maxSlots: number;
  hasUnknownCategories: boolean;
  unresolvedCategoryLabels: string[];
};

export type VaultGameplayCharacter = {
  id: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
  trackingProfile: string;
  vault: VaultDomainProgress;
  mythicPlus: VaultDomainProgress;
  raid: VaultDomainProgress;
  delves: VaultDomainProgress;
  mythicPlusSlots: VaultSlotDetail[];
  raidSlots: VaultSlotDetail[];
  worldSlots: VaultSlotDetail[];
  highestKeyLevel: number | null;
  mythicPlusRunCount: number | null;
  mythicPlusRuns: MythicPlusRunDetail[];
  action: string;
  vaultCaptured: boolean;
  vaultCurrent: boolean;
};

export type VaultMythicPlusResponse = {
  period: {
    key: string;
    startsAt: string;
    endsAt: string;
  };
  characters: VaultGameplayCharacter[];
  summary: {
    characterCount: number;
    attentionCount: number;
    readyCount: number;
  };
};
