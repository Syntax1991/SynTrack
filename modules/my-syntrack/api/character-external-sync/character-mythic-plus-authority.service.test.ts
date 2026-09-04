import { describe, expect, it, vi } from "vitest";
import { CharacterMythicPlusAuthorityService } from "./character-mythic-plus-authority.service.js";

function createHarness(
  snapshot: unknown,
  addonRating: number | null = null
) {
  const findOne = vi.fn(async () => snapshot);
  const findSeasonRating = vi.fn(async () => addonRating);
  const service = new CharacterMythicPlusAuthorityService(
    { findOne } as never,
    { findSeasonRating } as never
  );
  return { service, findOne, findSeasonRating };
}

const freshSnapshotWithProfile = {
  payload: {
    hasProfile: true,
    rating: 3125,
    rawRating: 3125.5818,
    currentPeriod: {
      periodId: 1079,
      bestRuns: [
        {
          dungeonId: 585,
          dungeonName: "Arena der Leerennarbe",
          keystoneLevel: 11,
          durationMs: 1043693,
          completedTimestamp: 1788361477000,
          completedInTime: true,
          affixIds: [160, 10, 9],
          runRating: 350,
          mapRating: 395.27353
        }
      ]
    },
    season: { seasonId: 18, bestRuns: [] }
  },
  fetchedAt: new Date(),
  lastStatus: "SUCCESS" as const,
  lastAttemptAt: new Date(),
  lastError: null
};

describe("CharacterMythicPlusAuthorityService", () => {
  it("prefers a fresh Blizzard snapshot with a confirmed profile as PRIMARY", async () => {
    const harness = createHarness(freshSnapshotWithProfile, 3100);

    const result = await harness.service.getAuthoritativeMythicPlus("char-1");

    expect(result).toEqual({
      source: "BLIZZARD",
      rating: 3125,
      hasProfile: true,
      bestRuns: freshSnapshotWithProfile.payload.currentPeriod.bestRuns,
      periodId: 1079,
      fetchedAt: freshSnapshotWithProfile.fetchedAt,
      isStale: false
    });
  });

  it("falls back to ADDON entirely when no Blizzard snapshot has ever succeeded", async () => {
    const harness = createHarness(null, 3100);

    const result = await harness.service.getAuthoritativeMythicPlus("char-1");

    expect(result).toEqual({
      source: "ADDON",
      rating: 3100,
      hasProfile: false,
      bestRuns: [],
      periodId: null,
      fetchedAt: null,
      isStale: false
    });
  });

  it("falls back to ADDON (not a fabricated null) when Blizzard confirms no profile but the addon has a real rating - a live-observed Blizzard 404 does not distinguish transient unavailability from genuine absence", async () => {
    const harness = createHarness(
      {
        ...freshSnapshotWithProfile,
        payload: {
          ...freshSnapshotWithProfile.payload,
          hasProfile: false,
          currentPeriod: { periodId: null, bestRuns: [] }
        }
      },
      3100
    );

    const result = await harness.service.getAuthoritativeMythicPlus("char-1");

    expect(result.source).toBe("ADDON");
    expect(result.rating).toBe(3100);
  });

  it("falls back to ADDON once the Blizzard snapshot is stale, but never invents bestRuns from the addon (no addon equivalent exists)", async () => {
    const staleSnapshot = {
      ...freshSnapshotWithProfile,
      fetchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    };
    const harness = createHarness(staleSnapshot, 3100);

    const result = await harness.service.getAuthoritativeMythicPlus("char-1");

    expect(result.source).toBe("ADDON");
    expect(result.rating).toBe(3100);
    expect(result.bestRuns).toEqual([]);
  });

  it("keeps serving a stale Blizzard snapshot when no addon fallback exists either, flagged isStale", async () => {
    const staleSnapshot = {
      ...freshSnapshotWithProfile,
      fetchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    };
    const harness = createHarness(staleSnapshot, null);

    const result = await harness.service.getAuthoritativeMythicPlus("char-1");

    expect(result).toMatchObject({
      source: "BLIZZARD",
      rating: 3125,
      isStale: true
    });
  });

  it("returns NONE when neither Blizzard nor the addon has ever produced a rating", async () => {
    const harness = createHarness(null, null);

    const result = await harness.service.getAuthoritativeMythicPlus("char-1");

    expect(result).toEqual({
      source: "NONE",
      rating: null,
      hasProfile: false,
      bestRuns: [],
      periodId: null,
      fetchedAt: null,
      isStale: false
    });
  });

  it("never reads or exposes any current-week Vault/gameplay field - the result type structurally cannot carry them", async () => {
    const harness = createHarness(freshSnapshotWithProfile, null);

    const result = await harness.service.getAuthoritativeMythicPlus("char-1");

    expect(result).not.toHaveProperty("vaultProgress");
    expect(result).not.toHaveProperty("thisWeekRuns");
    expect(result).not.toHaveProperty("vaultSlots");
  });
});
