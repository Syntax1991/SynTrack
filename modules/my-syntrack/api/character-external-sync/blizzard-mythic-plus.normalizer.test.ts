import { describe, expect, it } from "vitest";
import { normalizeBlizzardMythicPlus } from "./blizzard-mythic-plus.normalizer.js";

describe("normalizeBlizzardMythicPlus", () => {
  it("represents a confirmed 'no Mythic Keystone profile' (null) as hasProfile:false, not a fabricated zero score", () => {
    const result = normalizeBlizzardMythicPlus(null);

    expect(result).toEqual({
      hasProfile: false,
      rating: null,
      rawRating: null,
      periodId: null,
      seasonIds: [],
      bestRuns: []
    });
  });

  it("floors the decimal rating (Phase D4 rounding rule, matching the addon's own math.floor())", () => {
    const result = normalizeBlizzardMythicPlus({
      current_mythic_rating: { rating: 3125.5818 }
    });

    expect(result.rating).toBe(3125);
    expect(result.rawRating).toBe(3125.5818);
  });

  it("normalizes a real live-shaped best run (2026-09-04 Synblast capture) with dungeon id, affixes, and completedInTime", () => {
    const result = normalizeBlizzardMythicPlus({
      current_period: {
        period: { id: 1079 },
        best_runs: [
          {
            completed_timestamp: 1788361477000,
            duration: 1043693,
            keystone_level: 11,
            keystone_affixes: [
              { id: 160, name: "Xal'ataths Handel: Verschlingen" },
              { id: 10, name: "Verstärkt" },
              { id: 9, name: "Tyrannisch" }
            ],
            members: [{}],
            dungeon: { id: 585, name: "Arena der Leerennarbe" },
            is_completed_within_time: true,
            mythic_rating: { rating: 350.0 },
            map_rating: { rating: 395.27353 }
          }
        ]
      }
    });

    expect(result.periodId).toBe(1079);
    expect(result.bestRuns).toEqual([
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
    ]);
  });

  it("never fabricates completedInTime when Blizzard omits is_completed_within_time", () => {
    const result = normalizeBlizzardMythicPlus({
      current_period: {
        best_runs: [{ keystone_level: 10, dungeon: { id: 1 } }]
      }
    });

    expect(result.bestRuns[0]?.completedInTime).toBeNull();
  });

  it("keeps seasonIds as raw evidence without acting on the linked season sub-resource", () => {
    const result = normalizeBlizzardMythicPlus({
      seasons: [{ id: 14 }, { id: 15 }]
    });

    expect(result.seasonIds).toEqual([14, 15]);
    expect(result.hasProfile).toBe(true);
    expect(result.bestRuns).toEqual([]);
  });

  it("returns a real profile with zero best runs (current period has none) distinctly from hasProfile:false", () => {
    const result = normalizeBlizzardMythicPlus({
      current_period: { period: { id: 1079 } }
    });

    expect(result.hasProfile).toBe(true);
    expect(result.bestRuns).toEqual([]);
  });

  it("tolerates a fully empty profile object without throwing", () => {
    expect(normalizeBlizzardMythicPlus({})).toEqual({
      hasProfile: true,
      rating: null,
      rawRating: null,
      periodId: null,
      seasonIds: [],
      bestRuns: []
    });
  });
});
