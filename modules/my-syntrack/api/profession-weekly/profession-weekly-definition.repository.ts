import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ProfessionWeeklySourceDefinitionRepositoryContract,
  ProfessionWeeklySourceDefinitionRow
} from "./profession-weekly-definition-repository.types.js";
import type { ProfessionWeeklySourceDefinitionSeedInput } from "./profession-weekly-definition.types.js";

export class ProfessionWeeklyDefinitionRepository
  implements ProfessionWeeklySourceDefinitionRepositoryContract
{
  findByScopeKeys(
    scopeKeys: string[]
  ): Promise<ProfessionWeeklySourceDefinitionRow[]> {
    return prisma.professionWeeklySourceDefinition.findMany({
      where: { scopeKey: { in: scopeKeys } },
      orderBy: [
        { professionKey: "asc" },
        { sortOrder: "asc" },
        { name: "asc" }
      ]
    });
  }

  upsertByScopeProfessionSource(
    input: ProfessionWeeklySourceDefinitionSeedInput
  ): Promise<ProfessionWeeklySourceDefinitionRow> {
    const data = {
      name: input.name,
      sourceType: input.sourceType,
      externalQuestId: input.externalQuestId ?? null,
      externalCurrencyId: input.externalCurrencyId ?? null,
      enabled: input.enabled ?? false,
      sortOrder: input.sortOrder ?? 0
    };

    return prisma.professionWeeklySourceDefinition.upsert({
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
