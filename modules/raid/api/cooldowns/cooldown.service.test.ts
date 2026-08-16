import { describe, expect, it, vi } from "vitest";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import type { RaidSetupRepository } from "../setups/setup.repository.js";
import type { RaidCooldownRepository } from "./cooldown.repository.js";
import { RaidCooldownService } from "./cooldown.service.js";

function createService() {
  const calls: string[] = [];

  const repository = {
    findBossById: vi.fn(async () => {
      calls.push("repository");
      return {
        id: "boss-1",
        raidEventId: "event-1",
        name: "Imperator Averzian",
        fightDurationSeconds: null,
        wclReportCode: null,
        wclFightId: null,
        wclSyncedAt: null
      };
    }),
    findAssignmentById: vi.fn(async () => {
      calls.push("repository");
      return {
        id: "assignment-1",
        setupId: "setup-1",
        bossId: "boss-1"
      };
    }),
    findMemberById: vi.fn(async () => {
      calls.push("repository");
      return { id: "member-1" };
    }),
    createAssignment: vi.fn(async () => {
      calls.push("repository");
      return { id: "assignment-1" };
    }),
    updateAssignment: vi.fn(async () => {
      calls.push("repository");
      return { id: "assignment-1" };
    }),
    deleteAssignment: vi.fn(async () => {
      calls.push("repository");
    }),
    findForSetup: vi.fn(async () => {
      calls.push("repository");
      return [];
    })
  } as unknown as RaidCooldownRepository;

  const setupRepository = {
    findSetupById: vi.fn(async () => ({
      id: "setup-1",
      raidEventId: "event-1"
    }))
  } as unknown as RaidSetupRepository;

  const verification: GuildVerificationGuard = {
    ensureVerified: vi.fn(async () => {
      calls.push("verification");
    }),
    requireCurrentOfficer: vi.fn(async () => {
      calls.push("verification");
      return { id: "member-1" };
    })
  };

  const service = new RaidCooldownService(
    repository,
    setupRepository,
    verification
  );

  return {
    service,
    repository,
    setupRepository,
    verification,
    calls
  };
}

const assignmentInput = {
  memberId: "member-1",
  abilityName: "Aura Mastery",
  spellId: null,
  abilityIcon: null,
  phaseLabel: null,
  timestampSeconds: 10,
  sortOrder: 0
};

describe("RaidCooldownService mutating methods", () => {
  it("createAssignment verifies before touching the repository", async () => {
    const { service, verification, calls } =
      createService();

    await service.createAssignment(
      "setup-1",
      "boss-1",
      assignmentInput
    );

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);
    expect(calls[0]).toBe("verification");
  });

  it("createAssignment rejects a Setup and Boss from different events", async () => {
    const { service, setupRepository } =
      createService();

    vi.mocked(
      setupRepository.findSetupById
    ).mockResolvedValueOnce({
      id: "setup-2",
      raidEventId: "other-event"
    } as never);

    await expect(
      service.createAssignment(
        "setup-2",
        "boss-1",
        assignmentInput
      )
    ).rejects.toMatchObject({
      statusCode: 400
    });
  });

  it("updateAssignment verifies before touching the repository", async () => {
    const { service, verification, calls } =
      createService();

    await service.updateAssignment(
      "setup-1",
      "boss-1",
      "assignment-1",
      assignmentInput
    );

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);
    expect(calls[0]).toBe("verification");
  });

  it("updateAssignment refuses an assignment that belongs to a different Setup", async () => {
    const { service, repository } =
      createService();

    vi.mocked(
      repository.findAssignmentById
    ).mockResolvedValueOnce({
      id: "assignment-1",
      setupId: "other-setup",
      bossId: "boss-1"
    } as never);

    await expect(
      service.updateAssignment(
        "setup-1",
        "boss-1",
        "assignment-1",
        assignmentInput
      )
    ).rejects.toMatchObject({
      statusCode: 404
    });

    expect(
      repository.updateAssignment
    ).not.toHaveBeenCalled();
  });

  it("deleteAssignment verifies before touching the repository", async () => {
    const { service, verification, calls } =
      createService();

    await service.deleteAssignment(
      "setup-1",
      "boss-1",
      "assignment-1"
    );

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);
    expect(calls[0]).toBe("verification");
  });

  it("deleteAssignment refuses an assignment that belongs to a different Boss", async () => {
    const { service, repository } =
      createService();

    vi.mocked(
      repository.findAssignmentById
    ).mockResolvedValueOnce({
      id: "assignment-1",
      setupId: "setup-1",
      bossId: "other-boss"
    } as never);

    await expect(
      service.deleteAssignment(
        "setup-1",
        "boss-1",
        "assignment-1"
      )
    ).rejects.toMatchObject({
      statusCode: 404
    });

    expect(
      repository.deleteAssignment
    ).not.toHaveBeenCalled();
  });
});

describe("RaidCooldownService read methods", () => {
  it("listForSetup does not require verification", async () => {
    const { service, verification } =
      createService();

    await service.listForSetup("setup-1");

    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });
});
