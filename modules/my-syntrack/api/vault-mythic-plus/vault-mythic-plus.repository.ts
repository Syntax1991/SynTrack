import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";

export class VaultMythicPlusRepository {
  findCharactersWithTags() {
    return prisma.character.findMany({
      select: {
        id: true,
        name: true,
        realm: true,
        region: true,
        className: true,
        level: true,
        tagAssignments: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          level: "desc"
        },
        {
          name: "asc"
        }
      ]
    });
  }
}
