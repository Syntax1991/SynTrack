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
    category?: string | undefined;
    sortOrder?: number | undefined;
    isPinned?: boolean | undefined;
  };

export type TrackerDefinitionMetadataUpdate =
  {
    name?: string | undefined;
    category?:
      | string
      | null
      | undefined;
    sortOrder?: number | undefined;
    isPinned?: boolean | undefined;
    enabled?: boolean | undefined;
  };

/*
 * Normalized, typed value - never four raw nullable DB columns handed to
 * a consumer. Exactly one shape, matching the owning definition's
 * valueType.
 */
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

/*
 * "RECORDED" vs "UNKNOWN" is the entire point of this contract - a
 * consumer never has to infer meaning from which of four columns is
 * non-null, and never mistakes "no row yet" for a false/zero/empty
 * default.
 */
export type CharacterTrackerState = {
  trackerDefinitionId: string;
  characterId: string;
  periodKey: string;
  state: "RECORDED" | "UNKNOWN";
  source: string | null;
  value: TrackerNormalizedValue | null;
};
