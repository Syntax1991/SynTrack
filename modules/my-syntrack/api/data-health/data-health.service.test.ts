import { describe, expect, it } from "vitest";
import { FakeDataHealthRepository } from "./data-health.fakes.js";
import { DataHealthService } from "./data-health.service.js";

const now = new Date(
  "2026-08-27T12:00:00.000Z"
);

describe("DataHealthService", () => {
  it("keeps each character's health isolated - one character's timestamps never leak into another's", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedCharacterSync({
      characterId: "char-1",
      source: "ADDON",
      lastSyncedAt: new Date(
        "2026-08-27T00:00:00.000Z"
      )
    });

    repository.seedCharacterSync({
      characterId: "char-2",
      source: "ADDON",
      lastSyncedAt: null
    });

    const service =
      new DataHealthService(repository);

    const health =
      await service.getHealthByCharacterIds(
        ["char-1", "char-2"],
        now
      );

    expect(
      health.get("char-1")?.character
        .state
    ).toBe("FRESH");

    expect(
      health.get("char-2")?.character
        .state
    ).toBe("NEVER_CAPTURED");
  });

  it("evaluates each profession independently per character, never mixing characters' profession assignments", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedCharacterSync({
      characterId: "char-1",
      source: "ADDON",
      lastSyncedAt: new Date(
        "2026-08-27T00:00:00.000Z"
      )
    });

    repository.seedProfessionAssignment(
      {
        characterProfessionId:
          "cp-alchemy",
        characterId: "char-1",
        professionId: "alchemy",
        professionName: "Alchemy"
      },
      new Date(
        "2026-08-27T00:00:00.000Z"
      )
    );

    repository.seedProfessionAssignment(
      {
        characterProfessionId:
          "cp-leatherworking",
        characterId: "char-1",
        professionId:
          "leatherworking",
        professionName:
          "Leatherworking"
      },
      null
    );

    const service =
      new DataHealthService(repository);

    const health =
      await service.getHealthByCharacterIds(
        ["char-1"],
        now
      );

    const professions =
      health.get("char-1")
        ?.professions;

    expect(professions?.state).toBe(
      "PARTIAL"
    );

    expect(
      professions?.items.find(
        (item) =>
          item.professionId ===
          "alchemy"
      )?.state
    ).toBe("FRESH");

    expect(
      professions?.items.find(
        (item) =>
          item.professionId ===
          "leatherworking"
      )?.state
    ).toBe("NEVER_CAPTURED");
  });

  it("becomes FRESH once real addon Gear rows with a current-period capture timestamp exist", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedGearSlotSummary({
      characterId: "char-1",
      trackedSlotCount: 3,
      maxLastSyncedAt: new Date(
        "2026-08-27T19:34:31.000Z"
      )
    });

    const service =
      new DataHealthService(repository);

    const health =
      await service.getHealthByCharacterIds(
        ["char-1"],
        now
      );

    expect(
      health.get("char-1")?.gear.state
    ).toBe("FRESH");

    expect(
      health.get("char-1")?.gear
        .lastSyncedAt
    ).toBe(
      "2026-08-27T19:34:31.000Z"
    );
  });

  it("becomes STALE once real addon Gear rows exist but the capture predates the current reset period", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedGearSlotSummary({
      characterId: "char-1",
      trackedSlotCount: 3,
      maxLastSyncedAt: new Date(
        "2026-08-01T00:00:00.000Z"
      )
    });

    const service =
      new DataHealthService(repository);

    const health =
      await service.getHealthByCharacterIds(
        ["char-1"],
        now
      );

    expect(
      health.get("char-1")?.gear.state
    ).toBe("STALE");
  });

  it("returns NOT_TRACKED professions for a character with no assignments, not a false NEVER_CAPTURED", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedCharacterSync({
      characterId: "char-1",
      source: "MANUAL",
      lastSyncedAt: null
    });

    const service =
      new DataHealthService(repository);

    const health =
      await service.getHealthByCharacterIds(
        ["char-1"],
        now
      );

    expect(
      health.get("char-1")
        ?.professions.state
    ).toBe("NOT_TRACKED");
  });

  it("returns gear NOT_TRACKED vs MANUAL correctly and never fabricates FRESH from manual entries", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedCharacterSync({
      characterId: "char-1",
      source: "MANUAL",
      lastSyncedAt: null
    });

    repository.seedCharacterSync({
      characterId: "char-2",
      source: "MANUAL",
      lastSyncedAt: null
    });

    repository.seedGearSlotSummary({
      characterId: "char-2",
      trackedSlotCount: 3,
      maxLastSyncedAt: null
    });

    const service =
      new DataHealthService(repository);

    const health =
      await service.getHealthByCharacterIds(
        ["char-1", "char-2"],
        now
      );

    expect(
      health.get("char-1")?.gear
        .state
    ).toBe("NOT_TRACKED");

    expect(
      health.get("char-2")?.gear
        .state
    ).toBe("MANUAL");
  });
});
