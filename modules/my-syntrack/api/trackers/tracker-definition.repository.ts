import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  TrackerDefinitionRepositoryContract,
  TrackerDefinitionRow
} from "./tracker-repository.types.js";
import type {
  TrackerDefinitionCreateInput,
  TrackerDefinitionMetadataUpdate
} from "./tracker.types.js";

export class TrackerDefinitionRepository
  implements
    TrackerDefinitionRepositoryContract
{
  findByScope(
    scopeKey: string
  ): Promise<TrackerDefinitionRow[]> {
    return prisma.characterTrackerDefinition.findMany(
      {
        where: { scopeKey },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" }
        ]
      }
    );
  }

  findById(
    id: string
  ): Promise<TrackerDefinitionRow | null> {
    return prisma.characterTrackerDefinition.findUnique(
      { where: { id } }
    );
  }

  findByIdentity(
    scopeKey: string,
    key: string
  ): Promise<TrackerDefinitionRow | null> {
    return prisma.characterTrackerDefinition.findUnique(
      {
        where: {
          scopeKey_key: {
            scopeKey,
            key
          }
        }
      }
    );
  }

  create(
    input: TrackerDefinitionCreateInput
  ): Promise<TrackerDefinitionRow> {
    return prisma.characterTrackerDefinition.create(
      {
        data: {
          scopeKey: input.scopeKey,
          key: input.key,
          name: input.name,
          valueType: input.valueType,
          resetBehavior:
            input.resetBehavior,
          ...(input.category !==
          undefined
            ? {
                category:
                  input.category
              }
            : {}),
          ...(input.sortOrder !==
          undefined
            ? {
                sortOrder:
                  input.sortOrder
              }
            : {}),
          ...(input.isPinned !==
          undefined
            ? {
                isPinned:
                  input.isPinned
              }
            : {})
        }
      }
    );
  }

  updateMetadata(
    id: string,
    update: TrackerDefinitionMetadataUpdate
  ): Promise<TrackerDefinitionRow> {
    return prisma.characterTrackerDefinition.update(
      {
        where: { id },
        data: {
          ...(update.name !==
          undefined
            ? { name: update.name }
            : {}),
          ...(update.category !==
          undefined
            ? {
                category:
                  update.category
              }
            : {}),
          ...(update.sortOrder !==
          undefined
            ? {
                sortOrder:
                  update.sortOrder
              }
            : {}),
          ...(update.isPinned !==
          undefined
            ? {
                isPinned:
                  update.isPinned
              }
            : {}),
          ...(update.enabled !==
          undefined
            ? {
                enabled:
                  update.enabled
              }
            : {})
        }
      }
    );
  }
}
