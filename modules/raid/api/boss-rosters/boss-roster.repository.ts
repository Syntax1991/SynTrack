import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { RaidBossInput } from "./boss-roster.types.js";

export class RaidBossRosterRepository {
  findEventById(eventId: string) {
    return prisma.raidEvent.findUnique({
      where: {
        id: eventId
      }
    });
  }

  findBossesForEvent(
    eventId: string
  ) {
    return prisma.raidBoss.findMany({
      where: {
        raidEventId: eventId
      },
      include: {
        rosterEntries: true
      },
      orderBy: {
        sortOrder: "asc"
      }
    });
  }

  findBossById(bossId: string) {
    return prisma.raidBoss.findUnique({
      where: {
        id: bossId
      },
      include: {
        rosterEntries: true
      }
    });
  }

  findBossesForSetup(
    raidEventId: string,
    setupId: string
  ) {
    return prisma.raidBoss.findMany({
      where: {
        raidEventId
      },
      include: {
        rosterEntries: {
          where: { setupId }
        }
      },
      orderBy: {
        sortOrder: "asc"
      }
    });
  }

  findBossWithSetupEntries(
    bossId: string,
    setupId: string
  ) {
    return prisma.raidBoss.findUnique({
      where: {
        id: bossId
      },
      include: {
        rosterEntries: {
          where: { setupId }
        }
      }
    });
  }

  findMemberById(
    memberId: string
  ) {
    return prisma.guildMember.findUnique({
      where: {
        id: memberId
      }
    });
  }

  createBoss(
    eventId: string,
    input: RaidBossInput
  ) {
    return prisma.raidBoss.create({
      data: {
        raidEventId: eventId,
        name: input.name,
        sortOrder:
          input.sortOrder
      },
      include: {
        rosterEntries: true
      }
    });
  }

  updateBoss(
    bossId: string,
    input: RaidBossInput
  ) {
    return prisma.raidBoss.update({
      where: {
        id: bossId
      },
      data: {
        name: input.name,
        sortOrder:
          input.sortOrder
      },
      include: {
        rosterEntries: true
      }
    });
  }

  deleteBoss(bossId: string) {
    return prisma.raidBoss.delete({
      where: {
        id: bossId
      }
    });
  }

  upsertEntry(
    bossId: string,
    setupId: string,
    memberId: string,
    status: string
  ) {
    return prisma.raidBossRosterEntry.upsert({
      where: {
        bossId_setupId_memberId: {
          bossId,
          setupId,
          memberId
        }
      },
      create: {
        bossId,
        setupId,
        memberId,
        status
      },
      update: {
        status
      }
    });
  }

  deleteEntry(
    bossId: string,
    setupId: string,
    memberId: string
  ) {
    return prisma.raidBossRosterEntry.deleteMany({
      where: {
        bossId,
        setupId,
        memberId
      }
    });
  }

  findEntry(
    bossId: string,
    setupId: string,
    memberId: string
  ) {
    return prisma.raidBossRosterEntry.findUnique({
      where: {
        bossId_setupId_memberId: {
          bossId,
          setupId,
          memberId
        }
      }
    });
  }

  updateSpec(
    bossId: string,
    setupId: string,
    memberId: string,
    specId: number | null
  ) {
    return prisma.raidBossRosterEntry.update({
      where: {
        bossId_setupId_memberId: {
          bossId,
          setupId,
          memberId
        }
      },
      data: {
        specId
      }
    });
  }
}
