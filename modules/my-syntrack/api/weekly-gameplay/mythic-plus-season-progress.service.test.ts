import { describe, expect, it, vi } from "vitest";
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

function fakeSnapshotRepository(blizzardSnapshot: unknown = null) {
  return { findOne: vi.fn(async () => blizzardSnapshot) };
}

const freshBlizzardSnapshotBase = {
  fetchedAt: new Date(),
  lastStatus: "SUCCESS" as const,
  lastAttemptAt: new Date(),
  lastError: null
};

describe("MythicPlusSeasonProgressService — ADDON fallback path", () => {
  it("reports uncaptured for a Character with no current-week snapshot", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([]) as any,
      fakeSnapshotRepository() as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({ captured: false, dungeonBests: [] });
  });

  it("reports uncaptured when mythicPlusCaptured is false", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([snapshot({ mythicPlusCaptured: false })]) as any,
      fakeSnapshotRepository() as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")?.captured).toBe(false);
  });

  it("takes the max keyLevel per dungeon among TIMED runs only, deduped by mapChallengeModeId", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({
          mythicPlusRuns: [
            { keyLevel: 12, completed: true, thisWeek: false, mapChallengeModeId: 501 },
            { keyLevel: 15, completed: true, thisWeek: true, mapChallengeModeId: 501 },
            { keyLevel: 14, completed: true, thisWeek: true, mapChallengeModeId: 502 }
          ]
        })
      ]) as any,
      fakeSnapshotRepository() as any
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

  it("bug fix regression: an untimed (completed=false) higher key never beats a timed lower one for the same dungeon", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({
          mythicPlusRuns: [
            { keyLevel: 15, completed: false, thisWeek: false, mapChallengeModeId: 501 },
            { keyLevel: 13, completed: true, thisWeek: false, mapChallengeModeId: 501 }
          ]
        })
      ]) as any,
      fakeSnapshotRepository() as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({
      captured: true,
      dungeonBests: [{ mapChallengeModeId: 501, bestKeyLevel: 13 }]
    });
  });

  it("bug fix regression: a dungeon with only untimed runs contributes no dungeonBests entry at all (not a fabricated 0, not the untimed level)", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({
          mythicPlusRuns: [
            { keyLevel: 15, completed: false, thisWeek: false, mapChallengeModeId: 501 }
          ]
        })
      ]) as any,
      fakeSnapshotRepository() as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({ captured: true, dungeonBests: [] });
  });

  it("refuses to guess when a run can't be attributed to a dungeon", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({
          mythicPlusRuns: [
            { keyLevel: 15, completed: true, thisWeek: true, mapChallengeModeId: null }
          ]
        })
      ]) as any,
      fakeSnapshotRepository() as any
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
      ]) as any,
      fakeSnapshotRepository() as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({ captured: false, dungeonBests: [] });
  });
});

describe("MythicPlusSeasonProgressService — BLIZZARD primary path", () => {
  it("prefers a fresh Blizzard season snapshot over addon data, even when the addon synced more recently", async () => {
    const blizzardSnapshot = {
      ...freshBlizzardSnapshotBase,
      payload: {
        hasProfile: true,
        rating: 3125,
        rawRating: 3125.5818,
        currentPeriod: { periodId: 1079, bestRuns: [] },
        season: {
          seasonId: 18,
          bestRuns: [
            { dungeonId: 587, dungeonName: "X", keystoneLevel: 12, durationMs: 1, completedTimestamp: 1, completedInTime: true, affixIds: [], runRating: null, mapRating: null }
          ]
        }
      }
    };

    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({ mythicPlusRuns: [{ keyLevel: 20, completed: true, thisWeek: true, mapChallengeModeId: 999 }] })
      ]) as any,
      fakeSnapshotRepository(blizzardSnapshot) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({
      captured: true,
      dungeonBests: [{ mapChallengeModeId: 587, bestKeyLevel: 12 }]
    });
  });

  it("current_period cannot satisfy season-wide Resilient Keystone evidence - only season.bestRuns is read", async () => {
    const blizzardSnapshot = {
      ...freshBlizzardSnapshotBase,
      payload: {
        hasProfile: true,
        rating: null,
        rawRating: null,
        currentPeriod: {
          periodId: 1079,
          bestRuns: [
            { dungeonId: 999, dungeonName: "X", keystoneLevel: 20, durationMs: 1, completedTimestamp: 1, completedInTime: true, affixIds: [], runRating: null, mapRating: null }
          ]
        },
        season: { seasonId: 18, bestRuns: [] }
      }
    };

    const service = new MythicPlusSeasonProgressService(
      fakeRepository([]) as any,
      fakeSnapshotRepository(blizzardSnapshot) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({ captured: true, dungeonBests: [] });
  });

  it("only counts season.bestRuns entries with completedInTime===true", async () => {
    const blizzardSnapshot = {
      ...freshBlizzardSnapshotBase,
      payload: {
        hasProfile: true,
        rating: null,
        rawRating: null,
        currentPeriod: { periodId: 1079, bestRuns: [] },
        season: {
          seasonId: 18,
          bestRuns: [
            { dungeonId: 584, dungeonName: "X", keystoneLevel: 15, durationMs: 1, completedTimestamp: 1, completedInTime: false, affixIds: [], runRating: null, mapRating: null },
            { dungeonId: 584, dungeonName: "X", keystoneLevel: 13, durationMs: 1, completedTimestamp: 1, completedInTime: true, affixIds: [], runRating: null, mapRating: null }
          ]
        }
      }
    };

    const service = new MythicPlusSeasonProgressService(
      fakeRepository([]) as any,
      fakeSnapshotRepository(blizzardSnapshot) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({
      captured: true,
      dungeonBests: [{ mapChallengeModeId: 584, bestKeyLevel: 13 }]
    });
  });

  it("falls back to ADDON when no Blizzard snapshot has ever succeeded", async () => {
    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({ mythicPlusRuns: [{ keyLevel: 12, completed: true, thisWeek: false, mapChallengeModeId: 501 }] })
      ]) as any,
      fakeSnapshotRepository(null) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({
      captured: true,
      dungeonBests: [{ mapChallengeModeId: 501, bestKeyLevel: 12 }]
    });
  });

  it("falls back to ADDON when the Blizzard snapshot is stale (transient failure retains last successful snapshot, but this service still defers to addon once stale)", async () => {
    const staleBlizzardSnapshot = {
      ...freshBlizzardSnapshotBase,
      fetchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      payload: {
        hasProfile: true,
        rating: null,
        rawRating: null,
        currentPeriod: { periodId: 1079, bestRuns: [] },
        season: { seasonId: 18, bestRuns: [{ dungeonId: 587, dungeonName: "X", keystoneLevel: 20, durationMs: 1, completedTimestamp: 1, completedInTime: true, affixIds: [], runRating: null, mapRating: null }] }
      }
    };

    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({ mythicPlusRuns: [{ keyLevel: 12, completed: true, thisWeek: false, mapChallengeModeId: 501 }] })
      ]) as any,
      fakeSnapshotRepository(staleBlizzardSnapshot) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({
      captured: true,
      dungeonBests: [{ mapChallengeModeId: 501, bestKeyLevel: 12 }]
    });
  });

  it("falls back to ADDON when Blizzard has no confirmed profile (hasProfile:false)", async () => {
    const blizzardSnapshot = {
      ...freshBlizzardSnapshotBase,
      payload: {
        hasProfile: false,
        rating: null,
        rawRating: null,
        currentPeriod: { periodId: null, bestRuns: [] },
        season: { seasonId: null, bestRuns: [] }
      }
    };

    const service = new MythicPlusSeasonProgressService(
      fakeRepository([
        snapshot({ mythicPlusRuns: [{ keyLevel: 12, completed: true, thisWeek: false, mapChallengeModeId: 501 }] })
      ]) as any,
      fakeSnapshotRepository(blizzardSnapshot) as any
    );

    const result = await service.getForCharacters(["char-1"]);

    expect(result.get("char-1")).toEqual({
      captured: true,
      dungeonBests: [{ mapChallengeModeId: 501, bestKeyLevel: 12 }]
    });
  });
});
