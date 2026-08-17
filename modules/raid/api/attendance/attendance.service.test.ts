import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type { GuildRosterRepository } from "../../../guild/api/roster/roster.repository.js";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import type { RaidAttendanceRepository } from "./attendance.repository.js";
import { RaidAttendanceService } from "./attendance.service.js";

function createService(
  options: {
    isOfficer?: boolean;
  } = {}
) {
  const repository = {
    findEventById: vi.fn(async () => ({
      id: "event-1"
    })),
    findAllEventsWithRecords: vi.fn(
      async () => []
    ),
    findRecordsForEvent: vi.fn(
      async () => []
    ),
    findMemberById: vi.fn(async () => ({
      id: "member-1"
    })),
    upsertRecord: vi.fn(async () => ({
      id: "record-1",
      raidEventId: "event-1",
      memberId: "member-1",
      status: "PRESENT"
    })),
    deleteRecord: vi.fn(async () => ({
      count: 1
    }))
  } as unknown as RaidAttendanceRepository;

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

  const service = new RaidAttendanceService(
    repository,
    rosterRepository,
    verification
  );

  return { service, repository, verification };
}

describe("RaidAttendanceService", () => {
  it("setRecord requires the current request's authenticated officer, not ensureVerified", async () => {
    const { service, verification } =
      createService();

    await service.setRecord(
      "token",
      "event-1",
      "member-1",
      "PRESENT"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });

  it("setRecord rejects a non-officer (or unauthenticated) caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.setRecord(
        "token",
        "event-1",
        "member-1",
        "PRESENT"
      )
    ).rejects.toThrow(AppError);
  });

  it("setRecord persists the status once authorized", async () => {
    const { service, repository } =
      createService();

    await service.setRecord(
      "token",
      "event-1",
      "member-1",
      "PRESENT"
    );

    expect(
      repository.upsertRecord
    ).toHaveBeenCalledWith(
      "event-1",
      "member-1",
      "PRESENT"
    );
  });

  it("clearRecord requires the current request's authenticated officer", async () => {
    const { service, verification } =
      createService();

    await service.clearRecord(
      "token",
      "event-1",
      "member-1"
    );

    expect(
      verification.requireCurrentOfficer
    ).toHaveBeenCalledWith("token");
  });

  it("clearRecord rejects a non-officer caller", async () => {
    const { service } = createService({
      isOfficer: false
    });

    await expect(
      service.clearRecord(
        "token",
        "event-1",
        "member-1"
      )
    ).rejects.toThrow(AppError);
  });

  it("clearRecord removes the record once authorized", async () => {
    const { service, repository } =
      createService();

    await service.clearRecord(
      "token",
      "event-1",
      "member-1"
    );

    expect(
      repository.deleteRecord
    ).toHaveBeenCalledWith(
      "event-1",
      "member-1"
    );
  });
});
