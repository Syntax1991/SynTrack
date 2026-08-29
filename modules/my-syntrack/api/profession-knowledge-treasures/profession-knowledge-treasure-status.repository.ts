import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  ProfessionKnowledgeTreasureCharacterRow,
  ProfessionKnowledgeTreasureSnapshotRow,
  ProfessionKnowledgeTreasureStatusRepositoryContract
} from "./profession-knowledge-treasure-status-repository.types.js";

export class ProfessionKnowledgeTreasureStatusRepository
  implements ProfessionKnowledgeTreasureStatusRepositoryContract
{
  async findCharacters(): Promise<
    ProfessionKnowledgeTreasureCharacterRow[]
  > {
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

  findSnapshots(
    definitionIds: string[]
  ): Promise<ProfessionKnowledgeTreasureSnapshotRow[]> {
    if (definitionIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.characterProfessionKnowledgeTreasureSnapshot.findMany(
      {
        where: {
          definitionId: { in: definitionIds }
        },
        select: {
          characterId: true,
          definitionId: true,
          state: true,
          capturedAt: true
        }
      }
    );
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
