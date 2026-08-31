import type { CharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import type { OverviewDomainState } from "../overview/overview.types.js";
import type {
  MythicPlusRunDetailView,
  VaultSlotDetailView
} from "../weekly-gameplay/weekly-gameplay.detail.js";

export type VaultDomainProgress = {
  state: OverviewDomainState;
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
  trackingProfile: CharacterTrackingProfile;
  vault: VaultDomainProgress;
  mythicPlus: VaultDomainProgress;
  raid: VaultDomainProgress;
  delves: VaultDomainProgress;
  mythicPlusSlots: VaultSlotDetailView[];
  raidSlots: VaultSlotDetailView[];
  worldSlots: VaultSlotDetailView[];
  highestKeyLevel: number | null;
  mythicPlusRunCount: number | null;
  mythicPlusRuns: MythicPlusRunDetailView[];
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
