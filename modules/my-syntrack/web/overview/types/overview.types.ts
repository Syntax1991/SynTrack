import type { ProfessionKnowledgeTreasureOverviewState } from "./professionKnowledgeTreasure.types";
import type { ProfessionWeeklyOverviewState } from "./professionWeekly.types";
import type {
  ProfessionSetupOverviewState,
  WeeklyActionView,
  WeeklySummaryOverviewState
} from "./overviewTriage.types";

export type OverviewDomainState =
  | "READY"
  | "IN_PROGRESS"
  | "ATTENTION"
  | "UNKNOWN"
  | "NOT_TRACKED";

export type OverviewReadinessState =
  | "ready"
  | "attention"
  | "blocking"
  | "unknown";

export type AttentionDomain =
  | "weekly"
  | "vault"
  | "profession"
  | "profession-weekly"
  | "profession-knowledge-treasure"
  | "gear"
  | "resources";

export type AttentionSeverity =
  | "blocking"
  | "urgent"
  | "this-week"
  | "optional";

export type AttentionItem = {
  id: string;
  characterId: string;
  characterName: string;
  domain: AttentionDomain;
  severity: AttentionSeverity;
  label: string;
  detail: string | null;
  path: string;
};

export type WeeklyOverviewState = {
  state: OverviewDomainState;
  completed: number;
  total: number;
  source: "MANUAL_CHECKLIST";
};

export type VaultOverviewState = {
  state: OverviewDomainState;
  unlockedSlots: number;
  slotsTotal: number;
  highestKeyLevel: number | null;
  source: "MANUAL_LOG" | "ADDON";
};

export type ProfessionOverviewState = {
  state: OverviewDomainState;
  issueCount: number;
  issues: string[];
  items: CharacterProfessionSummary[];
};

export type CharacterProfessionSummary = {
  professionId: string;
  key: string;
  name: string;
  category: string;
  skill: number;
  knowledgePoints: number;
  dataStatus:
    | "TRACKED"
    | "PARTIAL"
    | "UNTRACKED"
    | "NO_CATALOG";
};

export type GearOverviewState = {
  state: OverviewDomainState;
  readinessPercent: number | null;
  trackedSlots: number;
  totalRelevantSlots: number;
  missingEnchantCount: number;
  emptySocketCount: number;
  itemLevel: number | null;
};

export type ResourceSnapshotView = {
  quantity: number | null;
  maxQuantity: number | null;
  weeklyQuantity: number | null;
  maxWeeklyQuantity: number | null;
  isCapped: boolean | null;
  weeklyRemaining: number | null;
  weeklyComplete: boolean | null;
  capturedAt: string;
};

export type ResourceItemView = {
  resourceDefinitionId: string;
  key: string;
  name: string;
  category: string;
  snapshot: ResourceSnapshotView | null;
  attentionNeeded: boolean;
};

export type ResourceOverviewState = {
  state: OverviewDomainState;
  trackedResourceCount: number;
  totalRelevantResourceCount: number;
  attentionCount: number;
  items: ResourceItemView[];
};

export type AccountResourceView = {
  resourceDefinitionId: string;
  key: string;
  name: string;
  category: string;
  capturedByCharacterId: string | null;
  ownershipMismatch: boolean;
  snapshot: {
    quantity: number | null;
    maxQuantity: number | null;
    weeklyQuantity: number | null;
    maxWeeklyQuantity: number | null;
    isCapped: boolean | null;
    weeklyRemaining: number | null;
    weeklyComplete: boolean | null;
    capturedAt: string;
  } | null;
  attentionNeeded: boolean;
};

export type TierOverviewState = {
  state: OverviewDomainState;
  equippedPieces: number;
  targetPieces: number;
  twoPiece: boolean;
  fourPiece: boolean;
  rawEquippedPieces: number;
  slots?: string[];
};
export type EmbellishmentOverviewState = {
  state: OverviewDomainState;
  equippedPieces: number;
  targetPieces: number;
};
export type {
  ProfessionWeeklyAggregate,
  ProfessionWeeklyOverviewState,
  ProfessionWeeklyProfessionSummary,
  ProfessionWeeklySourceStatus
} from "./professionWeekly.types";
export type {
  ProfessionKnowledgeTreasureAggregate,
  ProfessionKnowledgeTreasureOverviewState,
  ProfessionKnowledgeTreasureProfessionSummary,
  ProfessionKnowledgeTreasureSourceStatus
} from "./professionKnowledgeTreasure.types";

export type TrackerValueType =
  | "BOOLEAN"
  | "PROGRESS"
  | "NUMBER"
  | "TEXT";

export type TrackerResetBehavior =
  | "WEEKLY"
  | "SEASONAL"
  | "PERMANENT";

export type TrackerDefinitionView = {
  id: string;
  scopeKey: string;
  key: string;
  name: string;
  valueType: TrackerValueType;
  resetBehavior: TrackerResetBehavior;
  category: string | null;
  sortOrder: number;
  isPinned: boolean;
  enabled: boolean;
};

export type TrackerNormalizedValue =
  | {
      valueType: "BOOLEAN";
      boolean: boolean;
    }
  | {
      valueType: "PROGRESS";
      current: number;
      total: number;
    }
  | {
      valueType: "NUMBER";
      number: number;
    }
  | {
      valueType: "TEXT";
      text: string;
    };

export type CharacterTrackerState = {
  trackerDefinitionId: string;
  characterId: string;
  periodKey: string;
  state: "RECORDED" | "UNKNOWN";
  source: string | null;
  value: TrackerNormalizedValue | null;
};

export type CharacterWeeklyState = {
  character: {
    id: string;
    name: string;
    realm: string;
    region: string;
    className: string;
    level: number;
    // Phase F2, optional so pre-existing fixtures don't need touching:
    race?: string | null; faction?: string | null; activeSpec?: string | null; guild?: { name: string; realmSlug: string | null } | null; averageItemLevel?: number | null; equippedItemLevel?: number | null;
  };
  weekly: WeeklyOverviewState;
  weeklySummary: WeeklySummaryOverviewState;
  weeklyAction: WeeklyActionView | null;
  vault: VaultOverviewState;
  professions: ProfessionOverviewState;
  professionSetup: ProfessionSetupOverviewState;
  gear: GearOverviewState;
  resources: ResourceOverviewState;
  tier: TierOverviewState;
  embellishments: EmbellishmentOverviewState;
  professionWeekly: ProfessionWeeklyOverviewState;
  professionKnowledgeTreasures: ProfessionKnowledgeTreasureOverviewState;
  trackers: CharacterTrackerState[];
  attentionItems: AttentionItem[];
  readinessState: OverviewReadinessState;
  nextAction: {
    domain: AttentionDomain;
    label: string;
    detail: string | null;
    path: string;
    severity: AttentionSeverity;
  } | null;
};

export type OverviewSummary = {
  period: {
    key: string;
    startsAt: string;
    endsAt: string;
  };
  characterCount: number;
  readyCount: number;
  attentionCount: number;
  weeklyProgress: {
    completed: number;
    total: number;
  };
  vault: {
    trackedCount: number;
    fullyUnlockedCount: number;
  };
  refreshNeededCount: number;
};

export type TagView = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TrackerScopeProfileView = {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DomainHealthState =
  | "FRESH"
  | "STALE"
  | "PARTIAL"
  | "NEVER_CAPTURED"
  | "NOT_TRACKED"
  | "MANUAL";

export type ProfessionHealthEntry = {
  professionId: string;
  name: string;
  state:
    | "FRESH"
    | "STALE"
    | "NEVER_CAPTURED";
  lastSyncedAt: string | null;
};

export type CharacterDataHealth = {
  characterId: string;
  character: {
    state: DomainHealthState;
    lastSyncedAt: string | null;
  };
  professions: {
    state: DomainHealthState;
    items: ProfessionHealthEntry[];
  };
  gear: {
    state: DomainHealthState;
    lastSyncedAt: string | null;
  };
  resources: {
    state: DomainHealthState;
    lastSyncedAt: string | null;
  };
  professionWeekly: {
    state: DomainHealthState;
    items: ProfessionHealthEntry[];
  };
};

export type CharacterOverviewRow = CharacterWeeklyState & {
  tags: TagView[];
  trackingProfile: "FULL" | "WEEKLY" | "PROFESSION" | "MINIMAL";
  health: CharacterDataHealth;
};
export type OverviewResponse = {
  summary: OverviewSummary;
  attentionItems: AttentionItem[];
  characters: CharacterOverviewRow[];
  trackerColumns: TrackerDefinitionView[];
  activeScope: TrackerScopeProfileView | null;
  accountResources: AccountResourceView[];
};
