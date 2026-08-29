import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  CharacterSyncRow,
  DataHealthRepositoryContract,
  GearSlotSummaryRow,
  ProfessionAssignmentRow,
  ProfessionWeeklySnapshotHealthRow,
  ResourceSnapshotSummaryRow
} from "./data-health-repository.types.js";

/*
 * Every query here is batched across all requested characters - no
 * per-character loop, matching the N+1 avoidance already used by
 * Overview's own domain reads.
 */
export class DataHealthRepository
  implements DataHealthRepositoryContract
{
  async findCharacterSync(
    characterIds: string[]
  ): Promise<CharacterSyncRow[]> {
    const characters =
      await prisma.character.findMany({
        where: {
          id: { in: characterIds }
        },
        select: {
          id: true,
          source: true,
          lastSyncedAt: true
        }
      });

    return characters.map(
      (character) => ({
        characterId: character.id,
        source: character.source,
        lastSyncedAt:
          character.lastSyncedAt
      })
    );
  }

  async findProfessionAssignments(
    characterIds: string[]
  ): Promise<
    ProfessionAssignmentRow[]
  > {
    const assignments =
      await prisma.characterProfession.findMany(
        {
          where: {
            characterId: {
              in: characterIds
            }
          },
          select: {
            id: true,
            characterId: true,
            professionId: true,
            profession: {
              select: {
                name: true
              }
            }
          }
        }
      );

    return assignments.map(
      (assignment) => ({
        characterProfessionId:
          assignment.id,
        characterId:
          assignment.characterId,
        professionId:
          assignment.professionId,
        professionName:
          assignment.profession.name
      })
    );
  }

  async findProfessionMaxSync(
    characterProfessionIds: string[]
  ): Promise<
    Map<string, Date | null>
  > {
    if (
      characterProfessionIds.length ===
      0
    ) {
      return new Map();
    }

    const groups =
      await prisma.characterProfessionNodeProgress.groupBy(
        {
          by: [
            "characterProfessionId"
          ],
          where: {
            characterProfessionId: {
              in: characterProfessionIds
            }
          },
          _max: {
            lastSyncedAt: true
          }
        }
      );

    return new Map(
      groups.map((group) => [
        group.characterProfessionId,
        group._max.lastSyncedAt
      ])
    );
  }

  async findGearSlotSummary(
    characterIds: string[]
  ): Promise<GearSlotSummaryRow[]> {
    if (characterIds.length === 0) {
      return [];
    }

    const groups =
      await prisma.characterGearSlot.groupBy(
        {
          by: ["characterId"],
          where: {
            characterId: {
              in: characterIds
            }
          },
          _count: {
            _all: true
          },
          _max: {
            lastSyncedAt: true
          }
        }
      );

    return groups.map((group) => ({
      characterId: group.characterId,
      trackedSlotCount:
        group._count._all,
      maxLastSyncedAt:
        group._max.lastSyncedAt
    }));
  }

  async findResourceSnapshotSummary(
    characterIds: string[]
  ): Promise<ResourceSnapshotSummaryRow[]> {
    if (characterIds.length === 0) {
      return [];
    }

    const groups =
      await prisma.characterResourceSnapshot.groupBy(
        {
          by: ["characterId"],
          where: {
            characterId: {
              in: characterIds
            }
          },
          _count: {
            _all: true
          },
          _max: {
            capturedAt: true
          }
        }
      );

    return groups.map((group) => ({
      characterId: group.characterId,
      trackedResourceCount:
        group._count._all,
      maxCapturedAt:
        group._max.capturedAt
    }));
  }

  async findProfessionWeeklySnapshots(
    characterIds: string[],
    periodKey: string
  ): Promise<ProfessionWeeklySnapshotHealthRow[]> {
    if (characterIds.length === 0) {
      return [];
    }

    const rows =
      await prisma.characterProfessionWeeklySnapshot.findMany({
        where: {
          characterId: { in: characterIds },
          periodKey
        },
        select: {
          characterId: true,
          capturedAt: true,
          sourceDefinition: {
            select: { professionKey: true }
          }
        }
      });

    return rows.map((row) => ({
      characterId: row.characterId,
      professionKey: row.sourceDefinition.professionKey,
      capturedAt: row.capturedAt
    }));
  }
}
