import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { AdminUserAccountRecord } from "./admin-users.types.js";

export class AdminUsersRepository {
  async listAccounts(): Promise<AdminUserAccountRecord[]> {
    const rows = await prisma.raiderAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        battleNetAccountId: true,
        battleTag: true,
        status: true,
        createdAt: true,
        crafterShare: {
          select: { enabled: true }
        },
        _count: {
          select: { characters: true }
        },
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true }
        }
      }
    });

    return rows.map((row) => ({
      id: row.id,
      battleNetAccountId: row.battleNetAccountId,
      battleTag: row.battleTag,
      status: row.status,
      createdAt: row.createdAt,
      characterCount: row._count.characters,
      shareEnabled: row.crafterShare?.enabled === true,
      lastSessionAt: row.sessions[0]?.createdAt ?? null
    }));
  }

  findAccountById(id: string) {
    return prisma.raiderAccount.findUnique({
      where: { id },
      select: {
        id: true,
        battleNetAccountId: true,
        battleTag: true,
        status: true
      }
    });
  }

  setStatus(id: string, status: string) {
    return prisma.raiderAccount.update({
      where: { id },
      data: { status }
    });
  }

  deleteSessions(raiderAccountId: string) {
    return prisma.raiderSession.deleteMany({
      where: { raiderAccountId }
    });
  }

  revokeDevices(raiderAccountId: string) {
    return prisma.deviceCredential.updateMany({
      where: { raiderAccountId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  disableShare(raiderAccountId: string) {
    return prisma.crafterShare.updateMany({
      where: { raiderAccountId },
      data: { enabled: false }
    });
  }

  async deleteAccount(raiderAccountId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.character.deleteMany({
        where: { raiderAccountId }
      });
      await tx.deviceCredential.deleteMany({
        where: { raiderAccountId }
      });
      await tx.raiderAccount.delete({
        where: { id: raiderAccountId }
      });
    });
  }
}
