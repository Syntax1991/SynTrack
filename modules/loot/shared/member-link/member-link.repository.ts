import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";

/*
 * Phase G4B corrective: the underlying table is still Prisma's
 * `GuildMember` (renaming/neutralizing that model is a G4C schema
 * decision, not this pass) - this repository exists so no Loot code
 * needs to know that, or reach for guild-roster concepts (rank,
 * verification, teams, notes) it was never using in the first place.
 * Loot only ever needed one fact: which member row a raider account is
 * linked to.
 */
export class LootMemberLinkRepository {
  findMemberByLinkedAccount(
    raiderAccountId: string
  ) {
    return prisma.guildMember.findUnique({
      where: {
        linkedRaiderAccountId:
          raiderAccountId
      }
    });
  }
}
