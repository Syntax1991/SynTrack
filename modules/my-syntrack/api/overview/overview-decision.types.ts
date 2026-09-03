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
    charactersWithWork: number;
    weeklyActions: number;
    permanentAttention: number;
  };
  unresolved: number;
};

export type OverviewGameplayNextRef = {
  action: string;
  path: string;
  source: "WEEKLIES" | "SEASON";
};

export type OverviewGameplayPriorityRow = {
  characterId: string;
  characterName: string;
  className: string;
  next: OverviewGameplayNextRef | null;
  after: OverviewGameplayNextRef | null;
  knownOpen: number;
  unknown: number;
  status: string;
};

export type OverviewProfessionWorkRow = {
  characterId: string;
  characterName: string;
  className: string;
  next: {
    action: string;
    path: string;
  };
  additionalActionCount: number;
};

export type OverviewSetupAttentionRow = {
  characterId: string;
  characterName: string;
  className: string;
  next: {
    action: string;
    path: string;
  };
  additionalActionCount: number;
};

export type OverviewDecisionProjection = {
  gameplayPriorities: OverviewGameplayPriorityRow[];
  professionWork: OverviewProfessionWorkRow[];
  setupAttention: OverviewSetupAttentionRow[];
};

export type OverviewDecisionResponse = {
  summaries: OverviewDecisionSummaries;
  /** Raw canonical candidates — retained for composition/tests/diagnostics. */
  actions: OverviewActionCandidate[];
  /** Character-level UI projection — primary product surface. */
  projection: OverviewDecisionProjection;
  emptyState: "NO_OPEN_ACTIONS" | "NO_KNOWN_ACTIONS_UNRESOLVED";
};
