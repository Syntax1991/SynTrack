import type { OverviewDomainState } from "./overview.types";

export type ProfessionKnowledgeTreasureSourceStatus = {
  sourceKey: string;
  name: string;
  state: "COMPLETE" | "INCOMPLETE" | "UNKNOWN";
  capturedAt: string | null;
};

export type ProfessionKnowledgeTreasureAggregate = {
  completeCount: number;
  incompleteCount: number;
  unknownCount: number;
  applicableTotal: number;
};

export type ProfessionKnowledgeTreasureProfessionSummary = {
  professionKey: string;
  name: string;
  treasures: ProfessionKnowledgeTreasureAggregate;
  sources: ProfessionKnowledgeTreasureSourceStatus[];
};

/*
 * Permanent Knowledge Treasures - never a mandatory Overview column;
 * Character Detail shows per-profession N/8. Fully separate from
 * ProfessionWeeklyOverviewState (weekly reset).
 */
export type ProfessionKnowledgeTreasureOverviewState = {
  state: OverviewDomainState;
  treasures: ProfessionKnowledgeTreasureAggregate;
  professions: ProfessionKnowledgeTreasureProfessionSummary[];
};
