import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ProfessionWeeklyCharacterRow,
  ProfessionWeeklySnapshotRow,
  ProfessionWeeklyStatusRepositoryContract
} from "./profession-weekly-status-repository.types.js";

export class ProfessionWeeklyStatusRepository
  implements ProfessionWeeklyStatusRepositoryContract
{
  async findCharacters(): Promise<ProfessionWeeklyCharacterRow[]> {
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        professions: {
          select: { profession: { select: { key: true } } }
        }
      },
      orderBy: [{ level: "desc" }, { name: "asc" }]
    });

    return characters.map((character) => ({
      id: character.id,
      name: character.name,
      professionKeys: character.professions.map(
        (entry) => entry.profession.key
      )
    }));
  }

  findSnapshotsForPeriod(
    sourceDefinitionIds: string[],
    periodKey: string
  ): Promise<ProfessionWeeklySnapshotRow[]> {
    if (sourceDefinitionIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.characterProfessionWeeklySnapshot.findMany({
      where: {
        sourceDefinitionId: { in: sourceDefinitionIds },
        periodKey
      },
      select: {
        characterId: true,
        sourceDefinitionId: true,
        state: true,
        currentValue: true,
        maxValue: true,
        capturedAt: true
      }
    });
  }

  async findProfessionNamesByKeys(
    professionKeys: string[]
  ): Promise<Map<string, string>> {
    if (professionKeys.length === 0) {
      return new Map();
    }

    const rows = await prisma.profession.findMany({
      where: { key: { in: professionKeys } },
      select: { key: true, name: true }
    });

    return new Map(rows.map((row) => [row.key, row.name]));
  }
}
