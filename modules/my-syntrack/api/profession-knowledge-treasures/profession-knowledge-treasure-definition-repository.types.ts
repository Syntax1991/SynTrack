import type { ProfessionKnowledgeTreasureDefinitionSeedInput } from "./profession-knowledge-treasure-definition.types.js";

/*
 * Plain-data contract the service depends on, rather than the concrete
 * Prisma-backed repository class - mirrors
 * ProfessionWeeklySourceDefinitionRow so tests can inject a
 * lightweight in-memory fake.
 */
export type ProfessionKnowledgeTreasureDefinitionRow = {
  id: string;
  scopeKey: string;
  professionKey: string;
  sourceKey: string;
  name: string;
  externalQuestId: number;
  knowledgePoints: number | null;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface ProfessionKnowledgeTreasureDefinitionRepositoryContract {
  findByScopeKeys(
    scopeKeys: string[]
  ): Promise<ProfessionKnowledgeTreasureDefinitionRow[]>;
  upsertByScopeProfessionSource(
    input: ProfessionKnowledgeTreasureDefinitionSeedInput
  ): Promise<ProfessionKnowledgeTreasureDefinitionRow>;
}
