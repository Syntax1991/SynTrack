export type OverviewDecisionHorizon =
  | "WEEKLY"
  | "SEASONAL"
  | "PERMANENT";

export type OverviewDecisionSource =
  | "WEEKLIES"
  | "SEASON"
  | "PROFESSIONS";

export type OverviewActionCandidate = {
  characterId: string;
  characterName: string;
  className: string;
  source: OverviewDecisionSource;
  horizon: OverviewDecisionHorizon;
  action: string;
  path: string;
  localOrder: number;
};

export type OverviewDecisionSummaries = {
  weekly: {
    charactersWithWork: number;
  };
  season: {
    open: number;
    unknown: number;
  };
  professions: {
    weeklyActions: number;
    permanentAttention: number;
  };
  unresolved: number;
};

export type OverviewDecisionResponse = {
  summaries: OverviewDecisionSummaries;
  actions: OverviewActionCandidate[];
  emptyState: "NO_OPEN_ACTIONS" | "NO_KNOWN_ACTIONS_UNRESOLVED";
};
