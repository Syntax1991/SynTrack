import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";

export class ClientProfileRepository {
  async findBattleTagByAccountId(
    raiderAccountId: string
  ): Promise<string | null> {
    const account =
      await prisma.raiderAccount.findUnique(
        {
          where: {
            id: raiderAccountId
          },
          select: {
            battleTag: true
          }
        }
      );

    return account?.battleTag ?? null;
  }
}
