import type { OverviewDomainState } from "./overview.types";
import type { CharacterProfessionSummary } from "./overview.types";
import type { AttentionDomain, AttentionSeverity } from "./overview.types";

export type ProfessionSetupProfessionSummary = {
  professionId: string;
  key: string;
  name: string;
  dataStatus: CharacterProfessionSummary["dataStatus"];
  treasures: {
    completeCount: number;
    incompleteCount: number;
    unknownCount: number;
    applicableTotal: number;
  };
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
};

export type WeeklySummaryOverviewState = {
  state: OverviewDomainState;
  completedKnown: number;
  applicableKnown: number;
  unknownCount: number;
  domains: WeeklySummaryDomainDetail[];
};

export type WeeklyActionView = {
  domain: AttentionDomain;
  label: string;
  detail: string | null;
  path: string;
  severity: AttentionSeverity;
};
