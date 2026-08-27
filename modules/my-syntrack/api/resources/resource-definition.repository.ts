import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ResourceDefinitionRepositoryContract,
  ResourceDefinitionRow
} from "./resource-definition-repository.types.js";
import type { ResourceDefinitionSeedInput } from "./resource-definition.types.js";

export class ResourceDefinitionRepository
  implements ResourceDefinitionRepositoryContract
{
  findByScopeKeys(
    scopeKeys: string[]
  ): Promise<ResourceDefinitionRow[]> {
    return prisma.resourceDefinition.findMany({
      where: { scopeKey: { in: scopeKeys } },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" }
      ]
    });
  }

  findByKey(
    key: string
  ): Promise<ResourceDefinitionRow | null> {
    return prisma.resourceDefinition.findUnique({
      where: { key }
    });
  }

  upsertByKey(
    input: ResourceDefinitionSeedInput
  ): Promise<ResourceDefinitionRow> {
    const data = {
      scopeKey: input.scopeKey,
      externalCurrencyId: input.externalCurrencyId ?? null,
      externalItemId: input.externalItemId ?? null,
      name: input.name,
      category: input.category,
      resetBehavior: input.resetBehavior,
      ownershipScope: input.ownershipScope,
      enabled: input.enabled ?? true,
      sortOrder: input.sortOrder ?? 0
    };

    return prisma.resourceDefinition.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        ...data
      },
      update: data
    });
  }
}
