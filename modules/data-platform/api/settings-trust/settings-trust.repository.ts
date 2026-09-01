import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  SettingsTrustAccountRow,
  SettingsTrustSyncRow
} from "./settings-trust.types.js";

export class SettingsTrustRepository {
  findAccount(
    raiderAccountId: string
  ): Promise<SettingsTrustAccountRow | null> {
    return prisma.raiderAccount.findUnique({
      where: {
        id: raiderAccountId
      },
      select: {
        battleTag: true,
        battleNetAccountId: true,
        accessToken: true,
        tokenExpiresAt: true
      }
    });
  }

  countSynTrackRoster(
    raiderAccountId: string
  ): Promise<number> {
    return prisma.character.count({
      where: {
        raiderAccountId
      }
    });
  }

  async findDesktopSyncEvidence(
    raiderAccountId: string
  ): Promise<SettingsTrustSyncRow> {
    const aggregate =
      await prisma.deviceCredential.aggregate({
        where: {
          raiderAccountId,
          revokedAt: null
        },
        _max: {
          lastSeenAt: true
        },
        _count: true
      });

    return {
      lastSeenAt:
        aggregate._max.lastSeenAt,
      deviceCount: aggregate._count
    };
  }

  hasCoreAddonData(
    raiderAccountId: string
  ): Promise<boolean> {
    return prisma.character
      .findFirst({
        where: {
          raiderAccountId,
          source: "ADDON",
          lastSyncedAt: {
            not: null
          }
        },
        select: {
          id: true
        }
      })
      .then((row) => row !== null);
  }

  hasProfessionAddonData(
    raiderAccountId: string
  ): Promise<boolean> {
    return prisma.characterProfessionNodeProgress
      .findFirst({
        where: {
          source: "ADDON",
          characterProfession: {
            character: {
              raiderAccountId
            }
          }
        },
        select: {
          id: true
        }
      })
      .then((row) => row !== null);
  }
}
