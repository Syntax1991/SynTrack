import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import type { RaidSetupRepository } from "../setups/setup.repository.js";
import type { RaidBossRosterRepository } from "./boss-roster.repository.js";
import { RaidBossRosterService } from "./boss-roster.service.js";
import type { RaiderLinkGuard } from "./boss-roster.types.js";

const boss = {
  id: "boss-1",
  raidEventId: "event-1",
  name: "Imperator Averzian",
  sortOrder: 0,
  rosterEntries: []
};

const setup = {
  id: "setup-1",
  raidEventId: "event-1"
};

function createService(
  options: {
    memberClassName?: string;
    hasEntry?: boolean;
  } = {}
) {
  const repository = {
    findMemberById: vi.fn(async () => ({
      id: "member-1",
      className:
        options.memberClassName ??
        "Paladin"
    })),
    findBossById: vi.fn(async () => boss),
    findBossWithSetupEntries: vi.fn(
      async () => boss
    ),
    findEntry: vi.fn(async () =>
      options.hasEntry === false
        ? null
        : { id: "entry-1" }
    ),
    updateSpec: vi.fn(async () => {})
  } as unknown as RaidBossRosterRepository;

  const rosterRepository = {
    findAll: vi.fn(async () => [])
  };

  const setupRepository = {
    findSetupById: vi.fn(
      async () => setup
    )
  } as unknown as RaidSetupRepository;

  const verification: GuildVerificationGuard = {
    ensureVerified: vi.fn(async () => {}),
    requireCurrentOfficer: vi.fn(
      async () => ({ id: "member-1" })
    )
  };

  const raiderLink: RaiderLinkGuard = {
    getLinkedMember: vi.fn(async () => ({
      id: "member-1"
    }))
  };

  const service = new RaidBossRosterService(
    repository,
    rosterRepository as never,
    setupRepository,
    verification,
    raiderLink
  );

  return {
    service,
    repository,
    setupRepository,
    verification
  };
}

describe("RaidBossRosterService.setSpec", () => {
  it("requires officer authorization", async () => {
    const { service, verification } =
      createService();

    await service.setSpec(
      "token",
      "boss-1",
      "setup-1",
      "member-1",
      65
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledTimes(1);
  });

  it("rejects when the boss and setup belong to different events", async () => {
    const { service, setupRepository } =
      createService();

    (
      setupRepository.findSetupById as ReturnType<
        typeof vi.fn
      >
    ).mockResolvedValueOnce({
      id: "setup-1",
      raidEventId: "event-2"
    });

    await expect(
      service.setSpec(
        "token",
        "boss-1",
        "setup-1",
        "member-1",
        65
      )
    ).rejects.toThrow(AppError);
  });

  it("rejects when the member has no existing lineup entry for this boss", async () => {
    const { service } = createService({
      hasEntry: false
    });

    await expect(
      service.setSpec(
        "token",
        "boss-1",
        "setup-1",
        "member-1",
        65
      )
    ).rejects.toThrow(AppError);
  });

  it("rejects a spec that doesn't belong to the member's real class", async () => {
    const { service } = createService({
      memberClassName: "Warrior"
    });

    await expect(
      service.setSpec(
        "token",
        "boss-1",
        "setup-1",
        "member-1",
        65
      )
    ).rejects.toThrow(AppError);
  });

  it("rejects an unrecognized spec id", async () => {
    const { service } = createService();

    await expect(
      service.setSpec(
        "token",
        "boss-1",
        "setup-1",
        "member-1",
        999999
      )
    ).rejects.toThrow(AppError);
  });

  it("accepts a real spec matching the member's class", async () => {
    const { service, repository } =
      createService({
        memberClassName: "Paladin"
      });

    await service.setSpec(
      "token",
      "boss-1",
      "setup-1",
      "member-1",
      65
    );

    expect(
      repository.updateSpec
    ).toHaveBeenCalledWith(
      "boss-1",
      "setup-1",
      "member-1",
      65
    );
  });

  it("accepts null to reset a member back to UNKNOWN", async () => {
    const { service, repository } =
      createService();

    await service.setSpec(
      "token",
      "boss-1",
      "setup-1",
      "member-1",
      null
    );

    expect(
      repository.updateSpec
    ).toHaveBeenCalledWith(
      "boss-1",
      "setup-1",
      "member-1",
      null
    );
  });
});
