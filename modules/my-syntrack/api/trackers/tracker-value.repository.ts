import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { TrackerValueColumns } from "./tracker-value-invariants.js";
import type {
  TrackerValueRepositoryContract,
  TrackerValueRow
} from "./tracker-repository.types.js";

export class TrackerValueRepository
  implements
    TrackerValueRepositoryContract
{
  findOne(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string
  ): Promise<TrackerValueRow | null> {
    return prisma.characterTrackerValue.findUnique(
      {
        where: {
          trackerDefinitionId_characterId_periodKey:
            {
              trackerDefinitionId,
              characterId,
              periodKey
            }
        }
      }
    );
  }

  upsert(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string,
    columns: TrackerValueColumns,
    source: string
  ): Promise<TrackerValueRow> {
    return prisma.characterTrackerValue.upsert(
      {
        where: {
          trackerDefinitionId_characterId_periodKey:
            {
              trackerDefinitionId,
              characterId,
              periodKey
            }
        },
        create: {
          trackerDefinitionId,
          characterId,
          periodKey,
          ...columns,
          source
        },
        update: {
          ...columns,
          source
        }
      }
    );
  }

  delete(
    trackerDefinitionId: string,
    characterId: string,
    periodKey: string
  ): Promise<unknown> {
    return prisma.characterTrackerValue.deleteMany(
      {
        where: {
          trackerDefinitionId,
          characterId,
          periodKey
        }
      }
    );
  }

  /*
   * Batched for matrix/Overview use: definitions are grouped by their
   * already-resolved periodKey (in practice at most two groups - the
   * current week's key for WEEKLY definitions, and the shared
   * non-weekly sentinel for everything else), so this is O(groups)
   * queries, never O(characters) or O(definitions).
   */
  async findByDefinitionGroups(
    definitionIdsByPeriodKey: Map<
      string,
      string[]
    >,
    characterIds: string[]
  ): Promise<TrackerValueRow[]> {
    const groups = [
      ...definitionIdsByPeriodKey.entries()
    ];

    const results = await Promise.all(
      groups.map(
        ([
          periodKey,
          trackerDefinitionIds
        ]) =>
          prisma.characterTrackerValue.findMany(
            {
              where: {
                periodKey,
                trackerDefinitionId: {
                  in: trackerDefinitionIds
                },
                characterId: {
                  in: characterIds
                }
              }
            }
          )
      )
    );

    return results.flat();
  }
}
