import type { ProfessionKnowledgeTreasureAggregate } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import type {
  ProfessionWeeklyProfessionSummary,
  ProfessionWeeklySourceStatus
} from "../profession-weekly/profession-weekly-status.types.js";
import type { ProfessionInvestedKnowledge } from "./profession-overview-work.knowledge.js";

export type ProfessionWorkSourceState =
  | "COMPLETE"
  | "INCOMPLETE"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export type ProfessionWorkWeeklyState =
  | "COMPLETE"
  | "ATTENTION"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export type ProfessionOverviewWorkCharacter = {
  id: string;
  name: string;
  realm: string;
  region: string;
  className: string;
};

export type ProfessionOverviewWorkProfession = {
  id: string;
  key: string;
  name: string;
  category: string;
};

export type ProfessionOverviewWorkSource = {
  state: ProfessionWorkSourceState;
  label: string | null;
  source: ProfessionWeeklySourceStatus | null;
};

export type ProfessionOverviewWorkTreasures = {
  state: ProfessionWorkSourceState;
  label: string | null;
  aggregate: ProfessionKnowledgeTreasureAggregate | null;
};

export type ProfessionOverviewWorkRow = {
  character: ProfessionOverviewWorkCharacter;
  profession: ProfessionOverviewWorkProfession;
  skill: {
    current: number | null;
    display: string;
  };
  investedKnowledge: ProfessionInvestedKnowledge;
  weekly: {
    state: ProfessionWorkWeeklyState;
    summary: string;
  };
  quest: ProfessionOverviewWorkSource;
  treatise: ProfessionOverviewWorkSource;
  drops: ProfessionOverviewWorkSource;
  treasures: ProfessionOverviewWorkTreasures;
  attention: {
    weekly: boolean;
    permanent: boolean;
  };
  nextAction: string | null;
  sortRank: number;
};

export type ProfessionOverviewWorkSummary = {
  professionCharacterCount: number;
  weeklyAttentionCount: number;
  permanentAttentionCount: number;
  craftingCoverage: {
    covered: number;
    total: number;
  };
};

export type ProfessionOverviewWorkResponse = {
  summary: ProfessionOverviewWorkSummary;
  rows: ProfessionOverviewWorkRow[];
};

export type ProfessionOverviewWorkAssignment = {
  characterId: string;
  characterName: string;
  realm: string;
  region: string;
  className: string;
  // Not exposed on ProfessionOverviewWorkCharacter - only used as the
  // fallback-candidate input to the effective-identity lookup.
  level: number;
  professionId: string;
  professionKey: string;
  professionName: string;
  professionCategory: string;
  skill: number;
  knowledgePoints: number;
};

export type ProfessionOverviewWorkWeeklyProfession =
  ProfessionWeeklyProfessionSummary;
