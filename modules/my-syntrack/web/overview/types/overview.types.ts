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
  | "gear";

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
  source: "MANUAL_LOG";
};

export type ProfessionOverviewState = {
  state: OverviewDomainState;
  issueCount: number;
  issues: string[];
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

export type TierOverviewState = {
  state: "NOT_TRACKED";
};

export type EmbellishmentOverviewState = {
  state: "NOT_TRACKED";
};

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
  };
  weekly: WeeklyOverviewState;
  vault: VaultOverviewState;
  professions: ProfessionOverviewState;
  gear: GearOverviewState;
  tier: TierOverviewState;
  embellishments: EmbellishmentOverviewState;
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
};

export type OverviewResponse = {
  summary: OverviewSummary;
  attentionItems: AttentionItem[];
  characters: CharacterWeeklyState[];
  trackerColumns: TrackerDefinitionView[];
};
