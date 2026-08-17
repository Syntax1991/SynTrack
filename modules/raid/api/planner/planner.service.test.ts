import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildTeamRepository } from "../../../guild/api/teams/team.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import type { RaidBossRosterRepository } from "../boss-rosters/boss-roster.repository.js";
import type { RaidPlannerRepository } from "./planner.repository.js";
import { RaidPlannerService } from "./planner.service.js";

const eventInput = {
  title: "Thursday Mythic",
  raidInstance: "Unknown Test Raid",
  difficulty: "Mythic",
  scheduledAt: new Date().toISOString(),
  teamId: null,
  notes: null
};

function createService(
  options: {
    isOfficer?: boolean;
  } = {}
) {
  const repository = {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => ({
      id: "event-1"
    })),
    create: vi.fn(async () => ({
      id: "event-1",
      ...eventInput
    })),
    update: vi.fn(async () => ({
      id: "event-1",
      ...eventInput
    })),
    delete: vi.fn(async () => {})
  } as unknown as RaidPlannerRepository;

  const teamRepository = {
    findAll: vi.fn(async () => []),
    findById: vi.fn(async () => null)
  } as unknown as GuildTeamRepository;

  const bossRosterRepository = {
    createBoss: vi.fn(async () => ({}))
  } as unknown as RaidBossRosterRepository;

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

  const service = new RaidPlannerService(
    repository,
    teamRepository,
    bossRosterRepository,
    verification
  );

  return {
    service,
    repository,
    teamRepository,
    verification
  };
}

describe("RaidPlannerService", () => {
  it("create requires the current request's authenticated officer, not ensureVerified", async () => {
    const { service, verification } =
      createService();

    await service.create(
      "token",
      eventInput
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });

  it("create rejects a non-officer (or unauthenticated) caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.create("token", eventInput)
    ).rejects.toThrow(AppError);
  });

  it("update requires the current request's authenticated officer", async () => {
    const { service, verification } =
      createService();

    await service.update(
      "token",
      "event-1",
      eventInput
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
  });

  it("update rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.update(
        "token",
        "event-1",
        eventInput
      )
    ).rejects.toThrow(AppError);
  });

  it("delete requires the current request's authenticated officer", async () => {
    const { service, verification } =
      createService();

    await service.delete(
      "token",
      "event-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
  });

  it("delete rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.delete("token", "event-1")
    ).rejects.toThrow(AppError);
  });

  it("delete removes an existing event once authorized", async () => {
    const { service, repository } =
      createService();

    await service.delete(
      "token",
      "event-1"
    );

    expect(
      repository.delete
    ).toHaveBeenCalledWith("event-1");
  });
});
