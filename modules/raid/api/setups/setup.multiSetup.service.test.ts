import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidSetupRepository } from "./setup.repository.js";
import { RaidSetupService } from "./setup.service.js";
import type { RaiderLinkGuard } from "./setup.types.js";

const emptySetup = {
  id: "setup-1",
  raidPlanId: "plan-1",
  raidEventId: "event-1",
  key: "main",
  name: "Main Setup",
  members: []
};

function createBasicService(
  options: {
    linkedMember?: { id: string } | null;
  } = {}
) {
  const repository = {
    findAllForEvent: vi.fn(async () => [
      emptySetup
    ]),
    getOrCreateForEvent: vi.fn(
      async () => emptySetup
    ),
    createSetup: vi.fn(async () => ({
      ...emptySetup,
      id: "setup-2",
      key: "thursday-mythic-abcd1234",
      name: "Thursday Mythic"
    }))
  } as unknown as RaidSetupRepository;

  const rosterRepository = {
    findAll: vi.fn(async () => [])
  };

  const verification: GuildVerificationGuard = {
    ensureVerified: vi.fn(async () => {}),
    requireCurrentOfficer: vi.fn(
      async () => ({ id: "member-1" })
    )
  };

  const raiderLink: RaiderLinkGuard = {
    getLinkedMember: vi.fn(async () =>
      options.linkedMember === undefined
        ? { id: "member-1" }
        : options.linkedMember
    )
  };

  const service = new RaidSetupService(
    repository,
    rosterRepository as never,
    {} as never,
    verification,
    raiderLink
  );

  return { service, repository, verification };
}

describe("RaidSetupService.listForEvent", () => {
  it("rejects an unlinked requester", async () => {
    const { service } = createBasicService({
      linkedMember: null
    });

    await expect(
      service.listForEvent(
        "token",
        "event-1"
      )
    ).rejects.toThrow(AppError);
  });

  it("does not require officer authorization to read", async () => {
    const { service, verification } =
      createBasicService();

    await service.listForEvent(
      "token",
      "event-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).not.toHaveBeenCalled();
  });

  it("bootstraps the default Setup before listing, so a never-opened event still returns it", async () => {
    const { service, repository } =
      createBasicService();

    await service.listForEvent(
      "token",
      "event-1"
    );

    expect(
      repository.getOrCreateForEvent
    ).toHaveBeenCalledWith("event-1");

    expect(
      repository.findAllForEvent
    ).toHaveBeenCalledWith("event-1");
  });

  it("404s when the event does not exist", async () => {
    const { service, repository } =
      createBasicService();

    (
      repository.getOrCreateForEvent as ReturnType<
        typeof vi.fn
      >
    ).mockResolvedValueOnce(null);

    await expect(
      service.listForEvent(
        "token",
        "missing-event"
      )
    ).rejects.toThrow(AppError);
  });
});

describe("RaidSetupService.createSetup", () => {
  it("requires officer authorization", async () => {
    const { service, verification } =
      createBasicService();

    await service.createSetup(
      "token",
      "event-1",
      "Thursday Mythic"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledTimes(1);
  });

  it("creates a genuinely new Setup rather than reusing 'main'", async () => {
    const { service, repository } =
      createBasicService();

    const result = await service.createSetup(
      "token",
      "event-1",
      "Thursday Mythic"
    );

    expect(
      repository.createSetup
    ).toHaveBeenCalledWith(
      "event-1",
      "Thursday Mythic"
    );

    expect(result.id).toBe("setup-2");
    expect(result.key).not.toBe("main");
  });

  it("404s when the event does not exist", async () => {
    const { service, repository } =
      createBasicService();

    (
      repository.createSetup as ReturnType<
        typeof vi.fn
      >
    ).mockResolvedValueOnce(null);

    await expect(
      service.createSetup(
        "token",
        "missing-event",
        "Thursday Mythic"
      )
    ).rejects.toThrow(AppError);
  });
});
