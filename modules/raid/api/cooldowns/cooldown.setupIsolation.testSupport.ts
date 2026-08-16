import { vi } from "vitest";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import type { RaidSetupRepository } from "../setups/setup.repository.js";
import type { RaidCooldownRepository } from "./cooldown.repository.js";
import { RaidCooldownService } from "./cooldown.service.js";

/**
 * A fake repository that actually filters by setupId/bossId/memberId
 * the same way the real Prisma queries do — a plain canned-value mock
 * couldn't catch a real cross-Setup leak, since it would return the
 * same thing no matter which ids were passed. This is the
 * architectural acceptance test support for the Setup+Boss
 * cooldown-scoping correction: two Setups sharing a RaidEvent/Boss
 * must never see each other's plan members or assignments.
 */
function createFakeRepository() {
  const planMembers: Array<{
    id: string;
    setupId: string;
    bossId: string;
    memberId: string;
  }> = [];

  const assignments: Array<{
    id: string;
    setupId: string;
    bossId: string;
    memberId: string;
    abilityName: string;
  }> = [];

  let nextId = 1;

  return {
    findBossById: vi.fn(
      async (bossId: string) => ({
        id: bossId,
        raidEventId: "event-1",
        name: "Imperator Averzian",
        fightDurationSeconds: null,
        wclReportCode: null,
        wclFightId: null,
        wclSyncedAt: null
      })
    ),
    findMemberById: vi.fn(
      async (memberId: string) => ({
        id: memberId
      })
    ),
    findForSetup: vi.fn(
      async (setupId: string) =>
        assignments.filter(
          (a) => a.setupId === setupId
        )
    ),
    createAssignment: vi.fn(
      async (
        setupId: string,
        bossId: string,
        input: {
          memberId: string;
          abilityName: string;
        }
      ) => {
        const row = {
          id: `assignment-${nextId++}`,
          setupId,
          bossId,
          memberId: input.memberId,
          abilityName: input.abilityName
        };

        assignments.push(row);

        return row;
      }
    ),
    findPlanMembersForSetupAndBoss: vi.fn(
      async (
        setupId: string,
        bossId: string
      ) =>
        planMembers.filter(
          (m) =>
            m.setupId === setupId &&
            m.bossId === bossId
        )
    ),
    addPlanMember: vi.fn(
      async (
        setupId: string,
        bossId: string,
        memberId: string
      ) => {
        const existing =
          planMembers.find(
            (m) =>
              m.setupId === setupId &&
              m.bossId === bossId &&
              m.memberId === memberId
          );

        if (existing) {
          return existing;
        }

        const row = {
          id: `plan-member-${nextId++}`,
          setupId,
          bossId,
          memberId
        };

        planMembers.push(row);

        return row;
      }
    ),
    countAssignmentsForSetupBossMember: vi.fn(
      async (
        setupId: string,
        bossId: string,
        memberId: string
      ) =>
        assignments.filter(
          (a) =>
            a.setupId === setupId &&
            a.bossId === bossId &&
            a.memberId === memberId
        ).length
    ),
    deletePlanMember: vi.fn(
      async (
        setupId: string,
        bossId: string,
        memberId: string
      ) => {
        const index =
          planMembers.findIndex(
            (m) =>
              m.setupId === setupId &&
              m.bossId === bossId &&
              m.memberId === memberId
          );

        if (index !== -1) {
          planMembers.splice(index, 1);
        }
      }
    )
  } as unknown as RaidCooldownRepository;
}

export function createIsolationTestService(
  setups: Record<string, string>
) {
  const repository =
    createFakeRepository();

  const setupRepository = {
    findSetupById: vi.fn(
      async (setupId: string) =>
        setups[setupId]
          ? {
              id: setupId,
              raidEventId:
                setups[setupId]
            }
          : null
    )
  } as unknown as RaidSetupRepository;

  const verification: GuildVerificationGuard =
    {
      ensureVerified: vi.fn(
        async () => {}
      ),
      requireCurrentOfficer: vi.fn(
        async () => ({
          id: "member-1"
        })
      )
    };

  return new RaidCooldownService(
    repository,
    setupRepository,
    verification
  );
}

export function isolationAssignmentInput(
  memberId: string,
  abilityName: string
) {
  return {
    memberId,
    abilityName,
    spellId: null,
    abilityIcon: null,
    phaseLabel: null,
    timestampSeconds: 60,
    sortOrder: 0
  };
}

export const sameEventSetups = {
  "setup-a": "event-1",
  "setup-b": "event-1"
};
