import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ResourceCharacterRow,
  ResourceReadinessRepositoryContract,
  ResourceSnapshotRow
} from "./resource-readiness-repository.types.js";

export class ResourceReadinessRepository
  implements ResourceReadinessRepositoryContract
{
  findCharacters(): Promise<ResourceCharacterRow[]> {
    return prisma.character.findMany({
      select: { id: true, name: true },
      orderBy: [
        { level: "desc" },
        { name: "asc" }
      ]
    });
  }

  findSnapshotsByDefinitionIds(
    resourceDefinitionIds: string[]
  ): Promise<ResourceSnapshotRow[]> {
    if (resourceDefinitionIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.characterResourceSnapshot.findMany({
      where: {
        resourceDefinitionId: { in: resourceDefinitionIds }
      },
      select: {
        characterId: true,
        resourceDefinitionId: true,
        quantity: true,
        maxQuantity: true,
        weeklyQuantity: true,
        maxWeeklyQuantity: true,
        isCapped: true,
        isWeeklyCapped: true,
        discovered: true,
        accountWide: true,
        capturedAt: true
      }
    });
  }
}
