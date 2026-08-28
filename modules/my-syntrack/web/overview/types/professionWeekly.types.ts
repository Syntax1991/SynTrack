import type { OverviewDomainState } from "./overview.types";

export type ProfessionWeeklySourceStatus = {
  sourceKey: string;
  name: string;
  sourceType:
    | "WEEKLY_QUEST"
    | "TREATISE"
    | "KNOWLEDGE_DROPS";
  state: "COMPLETE" | "INCOMPLETE" | "UNKNOWN";
  currentValue: number | null;
  maxValue: number | null;
  capturedAt: string | null;
};

export type ProfessionWeeklyAggregate = {
  completeCount: number;
  incompleteCount: number;
  unknownCount: number;
  applicableTotal: number;
};

export type ProfessionWeeklyProfessionSummary = {
  professionKey: string;
  name: string;
  profKp: ProfessionWeeklyAggregate;
  sources: ProfessionWeeklySourceStatus[];
  drops: ProfessionWeeklySourceStatus | null;
};

/*
 * Prof KP (Weekly Quest + Treatise only) and Knowledge Drops are two
 * fully separate aggregates - Drops never affects `state` here. See
 * the Automatic Profession Weekly audit's hard product rule.
 */
export type ProfessionWeeklyOverviewState = {
  state: OverviewDomainState;
  profKp: ProfessionWeeklyAggregate;
  drops: ProfessionWeeklyAggregate;
  professions: ProfessionWeeklyProfessionSummary[];
};
