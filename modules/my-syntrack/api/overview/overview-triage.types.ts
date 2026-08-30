import type {
  ProfessionKnowledgeTreasureAggregate,
  ProfessionKnowledgeTreasureProfessionSummary
} from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import type { DomainApplicability } from "../character-tracking/domain-applicability.js";
import type {
  CharacterProfessionSummary,
  OverviewDomainState
} from "./overview.types.js";

export type ProfessionSetupProfessionSummary = {
  professionId: string;
  key: string;
  name: string;
  dataStatus: CharacterProfessionSummary["dataStatus"];
  treasures: ProfessionKnowledgeTreasureAggregate;
};

export type ProfessionSetupOverviewState = {
  state: OverviewDomainState;
  professions: ProfessionSetupProfessionSummary[];
  dataIssues: string[];
};

export type WeeklySummaryDomainDetail = {
  key: string;
  label: string;
  state: OverviewDomainState;
  completeCount: number;
  applicableTotal: number;
  unknownCount: number;
  applicability?: DomainApplicability;
};

export type WeeklySummaryOverviewState = {
  state: OverviewDomainState;
  completedKnown: number;
  applicableKnown: number;
  unknownCount: number;
  domains: WeeklySummaryDomainDetail[];
};

export type {
  ProfessionKnowledgeTreasureAggregate,
  ProfessionKnowledgeTreasureProfessionSummary
};
