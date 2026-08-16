import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type {
  RaidBossFightDurationInput,
  RaidBossPhaseMarkerInput,
  RaidCooldownAssignmentInput
} from "./cooldown.types.js";

export class RaidCooldownRepository {
  findBossById(bossId: string) {
    return prisma.raidBoss.findUnique({
      where: {
        id: bossId
      }
    });
  }

  findAssignmentById(
    assignmentId: string
  ) {
    return prisma.raidCooldownAssignment.findUnique(
      {
        where: {
          id: assignmentId
        }
      }
    );
  }

  /**
   * A Setup belongs to exactly one RaidEvent, so scoping by setupId
   * alone already covers every boss of that event — no separate
   * eventId parameter needed.
   */
  findForSetup(setupId: string) {
    return prisma.raidCooldownAssignment.findMany(
      {
        where: {
          setupId
        },
        orderBy: [
          {
            bossId: "asc"
          },
          {
            sortOrder: "asc"
          }
        ]
      }
    );
  }

  findPlanMembersForSetupAndBoss(
    setupId: string,
    bossId: string
  ) {
    return prisma.raidCooldownPlanMember.findMany(
      {
        where: {
          setupId,
          bossId
        },
        orderBy: {
          sortOrder: "asc"
        }
      }
    );
  }

  /**
   * Idempotent by design (upsert on the bossId+setupId+memberId
   * unique constraint) — "add to timeline" from Timeline Controls
   * should never error just because the player is already a plan
   * member of this exact Setup+Boss.
   */
  addPlanMember(
    setupId: string,
    bossId: string,
    memberId: string
  ) {
    return prisma.raidCooldownPlanMember.upsert(
      {
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
          memberId
        },
        update: {}
      }
    );
  }

  countAssignmentsForSetupBossMember(
    setupId: string,
    bossId: string,
    memberId: string
  ) {
    return prisma.raidCooldownAssignment.count(
      {
        where: {
          setupId,
          bossId,
          memberId
        }
      }
    );
  }

  deletePlanMember(
    setupId: string,
    bossId: string,
    memberId: string
  ) {
    return prisma.raidCooldownPlanMember.deleteMany(
      {
        where: {
          setupId,
          bossId,
          memberId
        }
      }
    );
  }

  findMemberById(
    memberId: string
  ) {
    return prisma.guildMember.findUnique(
      {
        where: {
          id: memberId
        }
      }
    );
  }

  createAssignment(
    setupId: string,
    bossId: string,
    input: RaidCooldownAssignmentInput
  ) {
    return prisma.raidCooldownAssignment.create(
      {
        data: {
          setupId,
          bossId,
          memberId: input.memberId,
          abilityName:
            input.abilityName,
          spellId:
            input.spellId,
          abilityIcon:
            input.abilityIcon,
          phaseLabel:
            input.phaseLabel,
          timestampSeconds:
            input.timestampSeconds,
          sortOrder:
            input.sortOrder
        }
      }
    );
  }

  updateAssignment(
    assignmentId: string,
    input: RaidCooldownAssignmentInput
  ) {
    return prisma.raidCooldownAssignment.update(
      {
        where: {
          id: assignmentId
        },
        data: {
          memberId: input.memberId,
          abilityName:
            input.abilityName,
          spellId:
            input.spellId,
          abilityIcon:
            input.abilityIcon,
          phaseLabel:
            input.phaseLabel,
          timestampSeconds:
            input.timestampSeconds,
          sortOrder:
            input.sortOrder
        }
      }
    );
  }

  deleteAssignment(
    assignmentId: string
  ) {
    return prisma.raidCooldownAssignment.delete(
      {
        where: {
          id: assignmentId
        }
      }
    );
  }

  updateFightDuration(
    bossId: string,
    input: RaidBossFightDurationInput
  ) {
    return prisma.raidBoss.update({
      where: {
        id: bossId
      },
      data: {
        fightDurationSeconds:
          input.fightDurationSeconds
      }
    });
  }

  findPhaseMarkersForBoss(
    bossId: string
  ) {
    return prisma.raidBossPhaseMarker.findMany(
      {
        where: {
          bossId
        },
        orderBy: {
          startSeconds: "asc"
        }
      }
    );
  }

  findPhaseMarkerById(
    markerId: string
  ) {
    return prisma.raidBossPhaseMarker.findUnique(
      {
        where: {
          id: markerId
        }
      }
    );
  }

  createPhaseMarker(
    bossId: string,
    input: RaidBossPhaseMarkerInput
  ) {
    return prisma.raidBossPhaseMarker.create(
      {
        data: {
          bossId,
          label: input.label,
          startSeconds:
            input.startSeconds,
          sortOrder:
            input.sortOrder
        }
      }
    );
  }

  deletePhaseMarker(
    markerId: string
  ) {
    return prisma.raidBossPhaseMarker.delete(
      {
        where: {
          id: markerId
        }
      }
    );
  }

  findAbilityCastsForBoss(
    bossId: string
  ) {
    return prisma.raidBossAbilityCast.findMany(
      {
        where: {
          bossId
        },
        orderBy: {
          timestampSeconds: "asc"
        }
      }
    );
  }

  async replaceAbilityCastsFromSync(
    bossId: string,
    data: {
      fightDurationSeconds: number;
      wclReportCode: string;
      wclFightId: number;
      casts: Array<{
        abilityName: string;
        abilityIcon: string | null;
        timestampSeconds: number;
      }>;
    }
  ) {
    return prisma.$transaction([
      prisma.raidBossAbilityCast.deleteMany(
        {
          where: { bossId }
        }
      ),

      prisma.raidBossAbilityCast.createMany(
        {
          data: data.casts.map(
            (cast, index) => ({
              bossId,
              abilityName:
                cast.abilityName,
              abilityIcon:
                cast.abilityIcon,
              timestampSeconds:
                cast.timestampSeconds,
              sortOrder: index
            })
          )
        }
      ),

      prisma.raidBoss.update({
        where: { id: bossId },
        data: {
          fightDurationSeconds:
            data.fightDurationSeconds,
          wclReportCode:
            data.wclReportCode,
          wclFightId: data.wclFightId,
          wclSyncedAt: new Date()
        }
      })
    ]);
  }
}
