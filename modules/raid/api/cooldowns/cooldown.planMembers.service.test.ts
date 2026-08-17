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
  const repository = {
    findBossById: vi.fn(async () => ({
      id: "boss-1",
      raidEventId: "event-1",
      name: "Imperator Averzian",
      fightDurationSeconds: null,
      wclReportCode: null,
      wclFightId: null,
      wclSyncedAt: null
    })),
    findMemberById: vi.fn(async () => ({
      id: "member-1"
    })),
    findPlanMembersForSetupAndBoss: vi.fn(
      async () => []
    ),
    addPlanMember: vi.fn(async () => ({
      id: "plan-member-1",
      bossId: "boss-1",
      setupId: "setup-1",
      memberId: "member-1"
    })),
    countAssignmentsForSetupBossMember: vi.fn(
      async () => 0
    ),
    deletePlanMember: vi.fn(async () => {})
  } as unknown as RaidCooldownRepository;

  const setupRepository = {
    findSetupById: vi.fn(async () => ({
      id: "setup-1",
      raidEventId: "event-1"
    }))
  } as unknown as RaidSetupRepository;

  const verification: GuildVerificationGuard = {
    ensureVerified: vi.fn(async () => {}),
    requireCurrentOfficer: vi.fn(
      async () => {
        if (options.isOfficer === false) {
          throw new AppError(
            403,
            "Not an officer."
          );
        }

        return { id: "member-1" };
      }
    )
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
    verification
  };
}

describe("RaidCooldownService plan-member methods", () => {
  it("listPlanMembers does not require verification", async () => {
    const { service, verification } =
      createService();

    await service.listPlanMembers(
      "setup-1",
      "boss-1"
    );

    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
    expect(
      verification.requireCurrentOfficer
    ).not.toHaveBeenCalled();
  });

  it("addPlanMember requires the current request's authenticated officer, not ensureVerified", async () => {
    const { service, verification } =
      createService();

    await service.addPlanMember(
      "token",
      "setup-1",
      "boss-1",
      "member-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });

  it("addPlanMember rejects a non-officer (or unauthenticated) caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.addPlanMember(
        "token",
        "setup-1",
        "boss-1",
        "member-1"
      )
    ).rejects.toThrow(AppError);
  });

  it("addPlanMember rejects a Setup and Boss from different events", async () => {
    const { service, setupRepository } =
      createService();

    vi.mocked(
      setupRepository.findSetupById
    ).mockResolvedValueOnce({
      id: "setup-2",
      raidEventId: "other-event"
    } as never);

    await expect(
      service.addPlanMember(
        "token",
        "setup-2",
        "boss-1",
        "member-1"
      )
    ).rejects.toMatchObject({
      statusCode: 400
    });
  });

  it("removePlanMember requires the current request's authenticated officer", async () => {
    const { service, verification } =
      createService();

    await service.removePlanMember(
      "token",
      "setup-1",
      "boss-1",
      "member-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
  });

  it("removePlanMember rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.removePlanMember(
        "token",
        "setup-1",
        "boss-1",
        "member-1"
      )
    ).rejects.toThrow(AppError);
  });

  it("removePlanMember refuses to delete a plan member who still has real assignments under this exact Setup+Boss", async () => {
    const { service, repository } =
      createService();

    vi.mocked(
      repository.countAssignmentsForSetupBossMember
    ).mockResolvedValueOnce(2);

    await expect(
      service.removePlanMember(
        "token",
        "setup-1",
        "boss-1",
        "member-1"
      )
    ).rejects.toMatchObject({
      statusCode: 409
    });

    expect(
      repository.deletePlanMember
    ).not.toHaveBeenCalled();
  });

  it("removePlanMember deletes the plan member when they have zero assignments", async () => {
    const { service, repository } =
      createService();

    await service.removePlanMember(
      "token",
      "setup-1",
      "boss-1",
      "member-1"
    );

    expect(
      repository.deletePlanMember
    ).toHaveBeenCalledWith(
      "setup-1",
      "boss-1",
      "member-1"
    );
  });
});
