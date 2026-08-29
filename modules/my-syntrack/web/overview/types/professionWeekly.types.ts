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

/*
 * Weekly Quest and Treatise are shown as two separate user-facing
 * values, never merged into one combined "Prof KP" number - a 3/4
 * doesn't tell you whether it's the Quest or the Treatise still
 * missing. See the profession weekly correctness follow-up.
 */
export type ProfessionWeeklyProfessionSummary = {
  professionKey: string;
  name: string;
  quest: ProfessionWeeklySourceStatus | null;
  treatise: ProfessionWeeklySourceStatus | null;
  drops: ProfessionWeeklySourceStatus | null;
};

/*
 * Weekly Quest, Treatise, and Knowledge Drops are three fully separate
 * aggregates - Drops never affects `state` here. See the Automatic
 * Profession Weekly audit's hard product rule.
 */
export type ProfessionWeeklyOverviewState = {
  state: OverviewDomainState;
  quest: ProfessionWeeklyAggregate;
  treatise: ProfessionWeeklyAggregate;
  drops: ProfessionWeeklyAggregate;
  professions: ProfessionWeeklyProfessionSummary[];
};
