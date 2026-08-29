export type ProfessionKnowledgeTreasureSourceStatus = {
  sourceKey: string;
  name: string;
  state: "COMPLETE" | "INCOMPLETE" | "UNKNOWN";
  capturedAt: string | null;
};

/*
 * completeCount/incompleteCount/unknownCount always sum to
 * applicableTotal - same UNKNOWN > WRONG convention as
 * ProfessionWeeklyAggregate. applicableTotal excludes any source whose
 * definition is disabled/unverified.
 */
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

export type CharacterProfessionKnowledgeTreasureStatus = {
  id: string;
  name: string;
  treasures: ProfessionKnowledgeTreasureAggregate;
  professions: ProfessionKnowledgeTreasureProfessionSummary[];
};
