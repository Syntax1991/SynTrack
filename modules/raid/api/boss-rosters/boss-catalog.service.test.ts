import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidBossCatalogService } from "./boss-catalog.service.js";
import type { RaidBossRosterRepository } from "./boss-roster.repository.js";

const boss = {
  id: "boss-1",
  raidEventId: "event-1",
  name: "Imperator Averzian",
  sortOrder: 0,
  rosterEntries: []
};

function createService(
  options: {
    isOfficer?: boolean;
  } = {}
) {
  const repository = {
    findEventById: vi.fn(async () => ({
      id: "event-1"
    })),
    findBossById: vi.fn(async () => boss),
    createBoss: vi.fn(async () => boss),
    updateBoss: vi.fn(async () => boss),
    deleteBoss: vi.fn(async () => {})
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

  const service = new RaidBossCatalogService(
    repository,
    verification
  );

  return { service, repository, verification };
}

describe("RaidBossCatalogService", () => {
  it("createBoss requires the current request's authenticated officer, not ensureVerified", async () => {
    const { service, verification } =
      createService();

    await service.createBoss(
      "token",
      "event-1",
      {
        name: "New Boss",
        sortOrder: 0
      }
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");

    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });

  it("createBoss rejects a non-officer (or unauthenticated) caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.createBoss(
        "token",
        "event-1",
        { name: "New Boss", sortOrder: 0 }
      )
    ).rejects.toThrow(AppError);
  });

  it("updateBoss requires the current request's authenticated officer", async () => {
    const { service, verification } =
      createService();

    await service.updateBoss(
      "token",
      "boss-1",
      { name: "  Padded Name  ", sortOrder: 1 }
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
  });

  it("updateBoss rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.updateBoss(
        "token",
        "boss-1",
        { name: "Name", sortOrder: 0 }
      )
    ).rejects.toThrow(AppError);
  });

  it("updateBoss trims the name", async () => {
    const { service, repository } =
      createService();

    await service.updateBoss(
      "token",
      "boss-1",
      { name: "  Padded Name  ", sortOrder: 1 }
    );

    expect(
      repository.updateBoss
    ).toHaveBeenCalledWith("boss-1", {
      name: "Padded Name",
      sortOrder: 1
    });
  });

  it("deleteBoss requires the current request's authenticated officer", async () => {
    const { service, verification } =
      createService();

    await service.deleteBoss(
      "token",
      "boss-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
  });

  it("deleteBoss rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.deleteBoss("token", "boss-1")
    ).rejects.toThrow(AppError);
  });

  it("deleteBoss removes an existing boss", async () => {
    const { service, repository } =
      createService();

    await service.deleteBoss(
      "token",
      "boss-1"
    );

    expect(
      repository.deleteBoss
    ).toHaveBeenCalledWith("boss-1");
  });
});
