import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { Prisma } from "../../../../apps/api/src/generated/prisma/client.js";
import {
  buildNameRealmCharacterKey,
  buildSuppressionLookupKeys,
  type CharacterIdentityInput
} from "./character-identity.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

export class RemovedCharacterRepository {
  async upsertSuppression(
    raiderAccountId: string,
    identity: CharacterIdentityInput,
    client: DbClient = prisma
  ) {
    const stableCharacterKey = buildNameRealmCharacterKey(identity);
    const battleNetId = identity.battleNetId?.trim() || null;

    return client.removedCharacter.upsert({
      where: {
        raiderAccountId_stableCharacterKey: {
          raiderAccountId,
          stableCharacterKey
        }
      },
      create: {
        raiderAccountId,
        stableCharacterKey,
        characterName: identity.name.trim(),
        realmName: identity.realm.trim(),
        region: identity.region.trim().toLowerCase(),
        battleNetId
      },
      update: {
        characterName: identity.name.trim(),
        realmName: identity.realm.trim(),
        region: identity.region.trim().toLowerCase(),
        battleNetId,
        removedAt: new Date()
      }
    });
  }

  async isSuppressed(
    raiderAccountId: string,
    identity: CharacterIdentityInput,
    client: DbClient = prisma
  ): Promise<boolean> {
    const keys = buildSuppressionLookupKeys(identity);
    const battleNetId = identity.battleNetId?.trim();

    const match = await client.removedCharacter.findFirst({
      where: {
        raiderAccountId,
        OR: [
          { stableCharacterKey: { in: keys } },
          ...(battleNetId ? [{ battleNetId }] : [])
        ]
      },
      select: { id: true }
    });

    return match !== null;
  }

  listForAccount(raiderAccountId: string) {
    return prisma.removedCharacter.findMany({
      where: { raiderAccountId },
      orderBy: { removedAt: "desc" }
    });
  }

  async deleteByIdForAccount(
    removedId: string,
    raiderAccountId: string
  ): Promise<number> {
    const result = await prisma.removedCharacter.deleteMany({
      where: {
        id: removedId,
        raiderAccountId
      }
    });

    return result.count;
  }

  async clearIdentityForAccount(
    raiderAccountId: string,
    identity: CharacterIdentityInput,
    client: DbClient = prisma
  ): Promise<void> {
    const keys = buildSuppressionLookupKeys(identity);
    const battleNetId = identity.battleNetId?.trim();

    await client.removedCharacter.deleteMany({
      where: {
        raiderAccountId,
        OR: [
          { stableCharacterKey: { in: keys } },
          ...(battleNetId ? [{ battleNetId }] : [])
        ]
      }
    });
  }
}
