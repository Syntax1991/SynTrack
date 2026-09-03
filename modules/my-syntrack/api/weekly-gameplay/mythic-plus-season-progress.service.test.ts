import { describe, expect, it } from "vitest";
import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { MythicPlusSeasonProgressService } from "./mythic-plus-season-progress.service.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

function snapshot(
  overrides: Partial<WeeklyGameplaySnapshotInput> = {}
): WeeklyGameplaySnapshotInput {
  return {
    characterId: "char-1",
    vaultCaptured: false,
    vaultCurrentPeriod: null,
    vaultGenerated: null,
    vaultCanClaim: null,
    vaultHasAvailable: null,
    mythicPlusCaptured: true,
    raidCaptured: false,
    vaultActivities: [],
    mythicPlusRuns: [],
    raidLockouts: [],
    ...overrides
  };
}

function fakeRepository(snapshots: WeeklyGameplaySnapshotInput[]) {
  return {
    findSnapshotsForPeriod: async (periodKey: string) =>
      periodKey === getWeeklyPeriod().key ? snapshots : []
  };
}

describe("MythicPlusSeasonProgressService", () => {
  it("reports uncaptured for a Character with no current-week snapshot", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([]) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({ captured: false, dungeonBests: [] });
  });

  it("reports uncaptured when mythicPlusCaptured is false", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({ mythicPlusCaptured: false })
      ]) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")?.captured).toBe(false);
  });

  it("takes the max keyLevel per dungeon, deduped by mapChallengeModeId", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({
          mythicPlusRuns: [
            { keyLevel: 12, completed: true, thisWeek: false, mapChallengeModeId: 501 },
            { keyLevel: 15, completed: true, thisWeek: true, mapChallengeModeId: 501 },
            { keyLevel: 14, completed: true, thisWeek: true, mapChallengeModeId: 502 }
          ]
        })
      ]) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({
      captured: true,
      dungeonBests: [
        { mapChallengeModeId: 501, bestKeyLevel: 15 },
        { mapChallengeModeId: 502, bestKeyLevel: 14 }
      ]
    });
  });

  it("refuses to guess when a run can't be attributed to a dungeon", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({
          mythicPlusRuns: [
            { keyLevel: 15, completed: true, thisWeek: true, mapChallengeModeId: null }
          ]
        })
      ]) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({ captured: false, dungeonBests: [] });
  });

  it("never mixes another Character's snapshot into this one's result", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({
          characterId: "char-2",
          mythicPlusRuns: [
            { keyLevel: 20, completed: true, thisWeek: true, mapChallengeModeId: 501 }
          ]
        })
      ]) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({ captured: false, dungeonBests: [] });
  });
});
