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
};

export type ProfessionOverviewWorkTreasures = {
  state: ProfessionWorkSourceState;
  label: string | null;
};

export type ProfessionOverviewWorkRow = {
  character: ProfessionOverviewWorkCharacter;
  profession: ProfessionOverviewWorkProfession;
  skill: {
    current: number | null;
    display: string;
  };
  investedKnowledge: {
    meaning: "INVESTED";
    invested: number;
    display: string;
  };
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

export type ProfessionWorkFilter = "all" | "attention";
