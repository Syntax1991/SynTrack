import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ProfessionKnowledgeTreasureDefinitionRepositoryContract,
  ProfessionKnowledgeTreasureDefinitionRow
} from "./profession-knowledge-treasure-definition-repository.types.js";
import type { ProfessionKnowledgeTreasureDefinitionSeedInput } from "./profession-knowledge-treasure-definition.types.js";

export class ProfessionKnowledgeTreasureDefinitionRepository
  implements ProfessionKnowledgeTreasureDefinitionRepositoryContract
{
  findByScopeKeys(
    scopeKeys: string[]
  ): Promise<ProfessionKnowledgeTreasureDefinitionRow[]> {
    return prisma.professionKnowledgeTreasureDefinition.findMany({
      where: { scopeKey: { in: scopeKeys } },
      orderBy: [
        { professionKey: "asc" },
        { sortOrder: "asc" },
        { name: "asc" }
      ]
    });
  }

  upsertByScopeProfessionSource(
    input: ProfessionKnowledgeTreasureDefinitionSeedInput
  ): Promise<ProfessionKnowledgeTreasureDefinitionRow> {
    const data = {
      name: input.name,
      externalQuestId: input.externalQuestId,
      knowledgePoints: input.knowledgePoints ?? null,
      enabled: input.enabled ?? false,
      sortOrder: input.sortOrder ?? 0
    };

    return prisma.professionKnowledgeTreasureDefinition.upsert({
      where: {
        scopeKey_professionKey_sourceKey: {
          scopeKey: input.scopeKey,
          professionKey: input.professionKey,
          sourceKey: input.sourceKey
        }
      },
      create: {
        scopeKey: input.scopeKey,
        professionKey: input.professionKey,
        sourceKey: input.sourceKey,
        ...data
      },
      update: data
    });
  }
}
