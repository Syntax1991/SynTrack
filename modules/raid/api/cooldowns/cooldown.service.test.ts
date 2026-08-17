import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import type { RaidSetupRepository } from "../setups/setup.repository.js";
import type { RaidCooldownRepository } from "./cooldown.repository.js";
import { RaidCooldownService } from "./cooldown.service.js";

function createService(
  options: {
    isOfficer?: boolean;
  } = {}
) {
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

      if (options.isOfficer === false) {
        throw new AppError(
          403,
          "Not an officer."
        );
      }

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
  it("createAssignment requires the current request's authenticated officer, not ensureVerified", async () => {
    const { service, verification, calls } =
      createService();

    await service.createAssignment(
      "token",
      "setup-1",
      "boss-1",
      assignmentInput
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
    expect(calls[0]).toBe("verification");
  });

  it("createAssignment rejects a non-officer (or unauthenticated) caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.createAssignment(
        "token",
        "setup-1",
        "boss-1",
        assignmentInput
      )
    ).rejects.toThrow(AppError);
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
        "token",
        "setup-2",
        "boss-1",
        assignmentInput
      )
    ).rejects.toMatchObject({
      statusCode: 400
    });
  });

  it("updateAssignment requires the current request's authenticated officer", async () => {
    const { service, verification, calls } =
      createService();

    await service.updateAssignment(
      "token",
      "setup-1",
      "boss-1",
      "assignment-1",
      assignmentInput
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
    expect(calls[0]).toBe("verification");
  });

  it("updateAssignment rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.updateAssignment(
        "token",
        "setup-1",
        "boss-1",
        "assignment-1",
        assignmentInput
      )
    ).rejects.toThrow(AppError);
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
        "token",
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

  it("deleteAssignment requires the current request's authenticated officer", async () => {
    const { service, verification, calls } =
      createService();

    await service.deleteAssignment(
      "token",
      "setup-1",
      "boss-1",
      "assignment-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
    expect(calls[0]).toBe("verification");
  });

  it("deleteAssignment rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.deleteAssignment(
        "token",
        "setup-1",
        "boss-1",
        "assignment-1"
      )
    ).rejects.toThrow(AppError);
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
        "token",
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
    expect(
      verification.requireCurrentOfficer
    ).not.toHaveBeenCalled();
  });
});
