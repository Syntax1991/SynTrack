import type {
  AttentionDomain,
  AttentionSeverity
} from "./overview.types";

export type PriorityBucket =
  | "needs-attention"
  | "quick-wins"
  | "this-week";

export type PriorityEffort = "low" | "medium" | "high";

export type PriorityAction = {
  id: string;
  characterId: string;
  characterName: string;
  domain: AttentionDomain;
  domainLabel: string;
  severity: AttentionSeverity;
  label: string;
  detail: string | null;
  path: string;
  score: number;
  bucket: PriorityBucket;
  effort: PriorityEffort;
};

export type OverviewPriorities = {
  topActions: PriorityAction[];
  buckets: {
    needsAttention: PriorityAction[];
    quickWins: PriorityAction[];
    thisWeek: PriorityAction[];
  };
  readyCharacterCount: number;
};
