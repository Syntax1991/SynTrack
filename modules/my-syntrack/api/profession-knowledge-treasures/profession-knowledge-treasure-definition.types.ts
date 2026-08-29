export type ProfessionKnowledgeTreasureDefinitionView = {
  id: string;
  scopeKey: string;
  professionKey: string;
  sourceKey: string;
  name: string;
  externalQuestId: number;
  knowledgePoints: number | null;
  enabled: boolean;
  sortOrder: number;
};

/*
 * The one seed/config shape a content profile's treasures are declared
 * through (see profession-knowledge-treasure-definition.service.ts's
 * ensureDefinition). `enabled` defaults to false at the repository
 * level, matching ProfessionWeeklySourceDefinition's own "leave
 * disabled rather than inventing an id" default.
 */
export type ProfessionKnowledgeTreasureDefinitionSeedInput = {
  scopeKey: string;
  professionKey: string;
  sourceKey: string;
  name: string;
  externalQuestId: number;
  knowledgePoints?: number | null;
  enabled?: boolean;
  sortOrder?: number;
};
