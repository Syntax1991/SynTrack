export const emptyWeeklyAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

export const emptyWeeklySummary = {
  state: "NOT_TRACKED" as const,
  completedKnown: 0,
  applicableKnown: 0,
  unknownCount: 0,
  domains: []
};

export const emptyProfessionSetup = {
  state: "NOT_TRACKED" as const,
  professions: [],
  dataIssues: []
};

export const emptyProfessionWeekly = {
  state: "NOT_TRACKED" as const,
  quest: emptyWeeklyAggregate,
  treatise: emptyWeeklyAggregate,
  drops: emptyWeeklyAggregate,
  professions: []
};

export const emptyProfessionKnowledgeTreasures = {
  state: "NOT_TRACKED" as const,
  treasures: emptyWeeklyAggregate,
  professions: []
};
