import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import type { GuildVerificationGuard } from "../../../guild/api/verification/verification.types.js";
import type { RaidCooldownRepository } from "./cooldown.repository.js";
import { RaidCooldownEncounterService } from "./cooldownEncounter.service.js";
import type { WarcraftLogsClient } from "./warcraftlogs.client.js";

function createService() {
  const calls: string[] = [];

  const repository = {
    findBossById: vi.fn(async () => {
      calls.push("repository");
      return {
        id: "boss-1",
        name: "Imperator Averzian",
        fightDurationSeconds: null,
        wclReportCode: null,
        wclFightId: null,
        wclSyncedAt: null
      };
    }),
    updateFightDuration: vi.fn(async () => {
      calls.push("repository");
      return { id: "boss-1" };
    }),
    findPhaseMarkersForBoss: vi.fn(async () => {
      calls.push("repository");
      return [];
    }),
    findPhaseMarkerById: vi.fn(async () => {
      calls.push("repository");
      return { id: "marker-1" };
    }),
    createPhaseMarker: vi.fn(async () => {
      calls.push("repository");
      return { id: "marker-1" };
    }),
    deletePhaseMarker: vi.fn(async () => {
      calls.push("repository");
    }),
    findAbilityCastsForBoss: vi.fn(async () => {
      calls.push("repository");
      return [];
    }),
    replaceAbilityCastsFromSync: vi.fn(async () => {
      calls.push("repository");
    })
  } as unknown as RaidCooldownRepository;

  const verification: GuildVerificationGuard = {
    ensureVerified: vi.fn(async () => {
      calls.push("verification");
    }),
    requireCurrentOfficer: vi.fn(async () => {
      calls.push("verification");
      return { id: "member-1" };
    })
  };

  const warcraftLogs = {
    findEncounterId: vi.fn(async () => {
      calls.push("warcraftLogs");
      return 42;
    }),
    getTopFight: vi.fn(async () => {
      calls.push("warcraftLogs");
      return { reportCode: "R1", fightId: 1 };
    }),
    getFightCasts: vi.fn(async () => {
      calls.push("warcraftLogs");
      return {
        fightDurationSeconds: 120,
        reportCode: "R1",
        fightId: 1,
        casts: [
          {
            abilityName: "Heaven's Lance",
            abilityIcon: null,
            timestampSeconds: 5
          }
        ]
      };
    })
  } as unknown as WarcraftLogsClient;

  const service =
    new RaidCooldownEncounterService(
      repository,
      verification,
      warcraftLogs
    );

  return { service, verification, calls };
}

describe("RaidCooldownEncounterService mutating methods", () => {
  it("updateFightDuration verifies before touching the repository", async () => {
    const { service, verification, calls } =
      createService();

    await service.updateFightDuration(
      "boss-1",
      { fightDurationSeconds: 300 }
    );

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);
    expect(calls[0]).toBe("verification");
  });

  it("createPhaseMarker verifies before touching the repository", async () => {
    const { service, verification, calls } =
      createService();

    await service.createPhaseMarker(
      "boss-1",
      { label: "Pull", startSeconds: 0, sortOrder: 0 }
    );

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);
    expect(calls[0]).toBe("verification");
  });

  it("deletePhaseMarker verifies before touching the repository", async () => {
    const { service, verification, calls } =
      createService();

    await service.deletePhaseMarker(
      "marker-1"
    );

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);
    expect(calls[0]).toBe("verification");
  });

  it("syncBossFromWarcraftLogs verifies before touching the repository or Warcraft Logs", async () => {
    const { service, verification, calls } =
      createService();

    await service.syncBossFromWarcraftLogs(
      "boss-1"
    );

    expect(
      verification.ensureVerified
    ).toHaveBeenCalledTimes(1);
    expect(calls[0]).toBe("verification");
  });
});

describe("RaidCooldownEncounterService read methods", () => {
  it("listPhaseMarkers does not require verification", async () => {
    const { service, verification } =
      createService();

    await service.listPhaseMarkers("boss-1");

    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });

  it("listAbilityCasts does not require verification", async () => {
    const { service, verification } =
      createService();

    await service.listAbilityCasts("boss-1");

    expect(
      verification.ensureVerified
    ).not.toHaveBeenCalled();
  });
});
