import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { ProfessionOverviewWorkAssignment } from "./profession-overview-work.types.js";

export class ProfessionOverviewWorkRepository {
  async findAssignments(): Promise<
    ProfessionOverviewWorkAssignment[]
  > {
    const rows =
      await prisma.characterProfession.findMany({
        select: {
          skill: true,
          knowledgePoints: true,
          character: {
            select: {
              id: true,
              name: true,
              realm: true,
              region: true,
              className: true,
              // Not exposed on the response row - only needed as the
              // fallback-candidate input to the effective-identity lookup
              // (see resolveEffectiveCharacterIdentities).
              level: true
            }
          },
          profession: {
            select: {
              id: true,
              key: true,
              name: true,
              category: true
            }
          }
        },
        orderBy: [
          {
            character: {
              level: "desc"
            }
          },
          {
            character: {
              name: "asc"
            }
          },
          {
            profession: {
              name: "asc"
            }
          }
        ]
      });

    return rows.map((row) => ({
      characterId: row.character.id,
      characterName: row.character.name,
      realm: row.character.realm,
      region: row.character.region,
      className: row.character.className,
      level: row.character.level,
      professionId: row.profession.id,
      professionKey: row.profession.key,
      professionName: row.profession.name,
      professionCategory: row.profession.category,
      skill: row.skill,
      knowledgePoints: row.knowledgePoints
    }));
  }
}
