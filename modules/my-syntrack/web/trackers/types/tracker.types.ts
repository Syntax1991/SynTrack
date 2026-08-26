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

export type TrackerDefinitionCreateInput =
  {
    scopeKey: string;
    key: string;
    name: string;
    valueType: TrackerValueType;
    resetBehavior: TrackerResetBehavior;
    category?: string;
    sortOrder?: number;
    isPinned?: boolean;
  };

export type TrackerDefinitionMetadataUpdate =
  {
    name?: string;
    category?: string | null;
    sortOrder?: number;
    isPinned?: boolean;
    enabled?: boolean;
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

export type TrackerValueInput =
  TrackerNormalizedValue;

export type CharacterTrackerState = {
  trackerDefinitionId: string;
  characterId: string;
  periodKey: string;
  state: "RECORDED" | "UNKNOWN";
  source: string | null;
  value: TrackerNormalizedValue | null;
};
