import { describe, expect, it } from "vitest";
import { FakeDataHealthRepository } from "./data-health.fakes.js";
import { DataHealthService } from "./data-health.service.js";

const now = new Date(
  "2026-08-27T12:00:00.000Z"
);

/*
 * Extracted from data-health.service.test.ts to stay under the 350-line
 * architecture cap - Resources health follows the exact same generic
 * freshness semantics as Gear (resolveResourceHealth mirrors
 * resolveGearHealth), evaluated against its own capturedAt evidence.
 */
describe("DataHealthService - resources", () => {
  it("becomes FRESH once real addon Resource rows with a current-period capturedAt exist", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedResourceSnapshotSummary({
      characterId: "char-1",
      trackedResourceCount: 2,
      maxCapturedAt: new Date(
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
      health.get("char-1")?.resources.state
    ).toBe("FRESH");

    expect(
      health.get("char-1")?.resources
        .lastSyncedAt
    ).toBe("2026-08-27T19:34:31.000Z");
  });

  it("becomes STALE once real addon Resource rows exist but the capture predates the current reset period", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedResourceSnapshotSummary({
      characterId: "char-1",
      trackedResourceCount: 2,
      maxCapturedAt: new Date(
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
      health.get("char-1")?.resources.state
    ).toBe("STALE");
  });

  it("returns resources NOT_TRACKED for a character with zero tracked resource rows, never a false NEVER_CAPTURED/FRESH", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedCharacterSync({
      characterId: "char-1",
      source: "ADDON",
      lastSyncedAt: new Date(
        "2026-08-27T00:00:00.000Z"
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
      health.get("char-1")?.resources.state
    ).toBe("NOT_TRACKED");
  });

  it("keeps resources health independent from gear health for the same character", async () => {
    const repository =
      new FakeDataHealthRepository();

    repository.seedGearSlotSummary({
      characterId: "char-1",
      trackedSlotCount: 3,
      maxLastSyncedAt: new Date(
        "2026-08-27T19:34:31.000Z"
      )
    });

    repository.seedResourceSnapshotSummary({
      characterId: "char-1",
      trackedResourceCount: 2,
      maxCapturedAt: new Date(
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
    ).toBe("FRESH");

    expect(
      health.get("char-1")?.resources.state
    ).toBe("STALE");
  });
});
