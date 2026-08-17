import { vi } from "vitest";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidCooldownService } from "../cooldowns/cooldown.service.js";
import type { RaidCooldownAssignmentInput } from "../cooldowns/cooldown.types.js";

type PlanMemberRow = {
  bossId: string;
  setupId: string;
  memberId: string;
};

type AssignmentRow =
  RaidCooldownAssignmentInput & {
    id: string;
    bossId: string;
    setupId: string;
  };

/**
 * The RaidCooldownService half of the shared multi-Setup isolation
 * environment — split into its own file purely to keep
 * setup.multiSetupIsolation.testSupport.ts under the architecture
 * line limit. Every method below reads/writes the SAME `planMembers`/
 * `assignments` maps the caller owns, so it's a real filtering store,
 * not a canned mock.
 */
export function createFakeCooldownService(
  params: {
    boss: { id: string; raidEventId: string };
    setupRepository: unknown;
    verification: GuildVerificationGuard;
    planMembers: Map<string, PlanMemberRow>;
    assignments: Map<string, AssignmentRow>;
    entryKey: (
      bossId: string,
      setupId: string,
      memberId: string
    ) => string;
    assignmentIdCounter: { value: number };
  }
): RaidCooldownService {
  const {
    boss,
    setupRepository,
    verification,
    planMembers,
    assignments,
    entryKey,
    assignmentIdCounter
  } = params;

  const cooldownRepository = {
    findBossById: vi.fn(async () => boss),
    findMemberById: vi.fn(async () => ({
      id: "member-1"
    })),
    findForSetup: vi.fn(
      async (setupId: string) =>
        Array.from(assignments.values()).filter(
          (assignment) =>
            assignment.setupId === setupId
        )
    ),
    findPlanMembersForSetupAndBoss: vi.fn(
      async (
        setupId: string,
        bossId: string
      ) =>
        Array.from(planMembers.values()).filter(
          (member) =>
            member.setupId === setupId &&
            member.bossId === bossId
        )
    ),
    addPlanMember: vi.fn(
      async (
        setupId: string,
        bossId: string,
        memberId: string
      ) => {
        planMembers.set(
          entryKey(bossId, setupId, memberId),
          { bossId, setupId, memberId }
        );
      }
    ),
    deletePlanMember: vi.fn(
      async (
        setupId: string,
        bossId: string,
        memberId: string
      ) => {
        planMembers.delete(
          entryKey(bossId, setupId, memberId)
        );
      }
    ),
    countAssignmentsForSetupBossMember: vi.fn(
      async (
        setupId: string,
        bossId: string,
        memberId: string
      ) =>
        Array.from(
          assignments.values()
        ).filter(
          (assignment) =>
            assignment.setupId === setupId &&
            assignment.bossId === bossId &&
            assignment.memberId === memberId
        ).length
    ),
    createAssignment: vi.fn(
      async (
        setupId: string,
        bossId: string,
        input: RaidCooldownAssignmentInput
      ) => {
        const id = `assignment-${assignmentIdCounter.value}`;

        assignmentIdCounter.value += 1;

        const assignment = {
          id,
          bossId,
          setupId,
          ...input
        };

        assignments.set(id, assignment);

        return assignment;
      }
    ),
    findAssignmentById: vi.fn(
      async (assignmentId: string) =>
        assignments.get(assignmentId) ?? null
    ),
    updateAssignment: vi.fn(async () => {}),
    deleteAssignment: vi.fn(async () => {})
  };

  return new RaidCooldownService(
    cooldownRepository as never,
    setupRepository as never,
    verification
  );
}
