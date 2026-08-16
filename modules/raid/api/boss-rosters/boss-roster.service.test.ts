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
    isSetupMember?: boolean;
  } = {}
) {
  const calls: string[] = [];

  const repository = {
    findEventById: vi.fn(async () => ({
      id: "event-1"
    })),
    findMemberById: vi.fn(async () => ({
      id: "member-1"
    })),
    findBossById: vi.fn(async () => {
      calls.push("repository");
      return boss;
    }),
    findBossesForSetup: vi.fn(
      async () => {
        calls.push("repository");
        return [boss];
      }
    ),
    findBossWithSetupEntries: vi.fn(
      async () => {
        calls.push("repository");
        return boss;
      }
    ),
    upsertEntry: vi.fn(async () => {
      calls.push("repository");
    }),
    deleteEntry: vi.fn(async () => {
      calls.push("repository");
    })
  } as unknown as RaidBossRosterRepository;

  const rosterRepository = {
    findAll: vi.fn(async () => [])
  };

  const setupRepository = {
    findSetupById: vi.fn(async () => {
      calls.push("setupRepository");
      return setup;
    }),
    isSetupMember: vi.fn(async () => {
      calls.push("setupRepository");
      return options.isSetupMember ?? true;
    })
  } as unknown as RaidSetupRepository;

  const verification: GuildVerificationGuard = {
    ensureVerified: vi.fn(async () => {
      calls.push("verification");
    }),
    requireCurrentOfficer: vi.fn(
      async () => {
        calls.push("verification");
        return { id: "member-1" };
      }
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
    verification,
    raiderLink,
    calls
  };
}

describe("RaidBossRosterService.listForSetup", () => {
  it("rejects an unlinked requester", async () => {
    const { service, raiderLink } =
      createService();

    (
      raiderLink.getLinkedMember as ReturnType<
        typeof vi.fn
      >
    ).mockResolvedValueOnce(null);

    await expect(
      service.listForSetup(
        "token",
        "setup-1"
      )
    ).rejects.toThrow(AppError);
  });

  it("does not require officer authorization to read", async () => {
    const { service, verification } =
      createService();

    await service.listForSetup(
      "token",
      "setup-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).not.toHaveBeenCalled();
  });
});

describe("RaidBossRosterService.setEntry", () => {
  it("requires officer authorization", async () => {
    const { service, verification } =
      createService();

    await service.setEntry(
      "token",
      "boss-1",
      "setup-1",
      "member-1",
      "CONFIRMED"
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
      service.setEntry(
        "token",
        "boss-1",
        "setup-1",
        "member-1",
        "CONFIRMED"
      )
    ).rejects.toThrow(AppError);
  });

  it("rejects a member who is not currently in the Setup pool", async () => {
    const { service } = createService({
      isSetupMember: false
    });

    await expect(
      service.setEntry(
        "token",
        "boss-1",
        "setup-1",
        "member-1",
        "CONFIRMED"
      )
    ).rejects.toThrow(AppError);
  });

  it("allows a current Setup pool member", async () => {
    const { service, repository } =
      createService({
        isSetupMember: true
      });

    await service.setEntry(
      "token",
      "boss-1",
      "setup-1",
      "member-1",
      "CONFIRMED"
    );

    expect(
      repository.upsertEntry
    ).toHaveBeenCalledWith(
      "boss-1",
      "setup-1",
      "member-1",
      "CONFIRMED"
    );
  });
});

describe("RaidBossRosterService.clearEntry", () => {
  it("requires officer authorization", async () => {
    const { service, verification } =
      createService();

    await service.clearEntry(
      "token",
      "boss-1",
      "setup-1",
      "member-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledTimes(1);
  });

  it("does not require current Setup pool membership — clearing an orphaned entry is always allowed", async () => {
    const { service, repository } =
      createService({
        isSetupMember: false
      });

    await service.clearEntry(
      "token",
      "boss-1",
      "setup-1",
      "member-1"
    );

    expect(
      repository.deleteEntry
    ).toHaveBeenCalledWith(
      "boss-1",
      "setup-1",
      "member-1"
    );
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
      service.clearEntry(
        "token",
        "boss-1",
        "setup-1",
        "member-1"
      )
    ).rejects.toThrow(AppError);
  });
});
