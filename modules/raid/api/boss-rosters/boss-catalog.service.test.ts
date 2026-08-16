import { describe, expect, it, vi } from "vitest";
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

function createService() {
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
      async () => ({ id: "member-1" })
    )
  };

  const service = new RaidBossCatalogService(
    repository,
    verification
  );

  return { service, repository, verification };
}

describe("RaidBossCatalogService", () => {
  it("createBoss uses ensureVerified, not requireCurrentOfficer", async () => {
    const { service, verification } =
      createService();

    await service.createBoss("event-1", {
      name: "New Boss",
      sortOrder: 0
    });

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);

    expect(
      verification.requireCurrentOfficer
    ).not.toHaveBeenCalled();
  });

  it("updateBoss trims the name", async () => {
    const { service, repository } =
      createService();

    await service.updateBoss("boss-1", {
      name: "  Padded Name  ",
      sortOrder: 1
    });

    expect(
      repository.updateBoss
    ).toHaveBeenCalledWith("boss-1", {
      name: "Padded Name",
      sortOrder: 1
    });
  });

  it("deleteBoss removes an existing boss", async () => {
    const { service, repository } =
      createService();

    await service.deleteBoss("boss-1");

    expect(
      repository.deleteBoss
    ).toHaveBeenCalledWith("boss-1");
  });
});
