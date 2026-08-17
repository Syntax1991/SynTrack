import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import { RaidSignupRepository } from "./signup.repository.js";
import { RaidSignupService } from "./signup.service.js";
import type { RaiderLinkGuard } from "./signup.types.js";

function createService(
  options: {
    isOfficer?: boolean;
  } = {}
) {
  const repository = {
    findEventById: vi.fn(async () => ({
      id: "event-1"
    })),
    findSignupsForEvent: vi.fn(
      async () => []
    ),
    findMemberById: vi.fn(async () => ({
      id: "member-1"
    })),
    upsertSignup: vi.fn(async () => ({
      status: "CONFIRMED",
      updatedAt: new Date()
    })),
    deleteSignup: vi.fn(async () => ({
      count: 1
    }))
  } as unknown as RaidSignupRepository;

  const rosterRepository = {
    findAll: vi.fn(async () => [])
  } as unknown as GuildRosterRepository;

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

  const raiderLink: RaiderLinkGuard = {
    getLinkedMember: vi.fn(async () => ({
      id: "member-1"
    }))
  };

  const service = new RaidSignupService(
    repository,
    rosterRepository,
    verification,
    raiderLink
  );

  return {
    service,
    repository,
    verification
  };
}

describe("RaidSignupService.setSignup / clearSignup", () => {
  it("setSignup requires the current request's authenticated officer, not ensureVerified", async () => {
    const { service, verification } =
      createService();

    await service.setSignup(
      "token",
      "event-1",
      "member-1",
      "CONFIRMED"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });

  it("setSignup rejects a non-officer (or unauthenticated) caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.setSignup(
        "token",
        "event-1",
        "member-1",
        "CONFIRMED"
      )
    ).rejects.toThrow(AppError);
  });

  it("setSignup persists the status once authorized", async () => {
    const { service, repository } =
      createService();

    await service.setSignup(
      "token",
      "event-1",
      "member-1",
      "CONFIRMED"
    );

    expect(
      repository.upsertSignup
    ).toHaveBeenCalledWith(
      "event-1",
      "member-1",
      "CONFIRMED"
    );
  });

  it("clearSignup requires the current request's authenticated officer", async () => {
    const { service, verification } =
      createService();

    await service.clearSignup(
      "token",
      "event-1",
      "member-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
  });

  it("clearSignup rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.clearSignup(
        "token",
        "event-1",
        "member-1"
      )
    ).rejects.toThrow(AppError);
  });

  it("clearSignup removes the signup once authorized", async () => {
    const { service, repository } =
      createService();

    await service.clearSignup(
      "token",
      "event-1",
      "member-1"
    );

    expect(
      repository.deleteSignup
    ).toHaveBeenCalledWith(
      "event-1",
      "member-1"
    );
  });
});
