import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ProfessionWeeklyCharacterRow,
  ProfessionWeeklySnapshotRow,
  ProfessionWeeklyStatusRepositoryContract
} from "./profession-weekly-status-repository.types.js";

export class ProfessionWeeklyStatusRepository
  implements ProfessionWeeklyStatusRepositoryContract
{
  findCharacters(): Promise<ProfessionWeeklyCharacterRow[]> {
    return prisma.character.findMany({
      select: { id: true, name: true },
      orderBy: [{ level: "desc" }, { name: "asc" }]
    });
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
