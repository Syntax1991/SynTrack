import { describe, expect, it } from "vitest";
import { normalizeBlizzardAchievements } from "./blizzard-achievements.normalizer.js";

describe("normalizeBlizzardAchievements", () => {
  it("returns an empty list for a confirmed 'no achievements profile' (null)", () => {
    expect(normalizeBlizzardAchievements(null, new Set([62437]))).toEqual({
      achievements: []
    });
  });

  it("filters to only watched achievement ids, ignoring the other ~3000 entries Blizzard returns", () => {
    const result = normalizeBlizzardAchievements(
      {
        achievements: [
          { id: 62437, criteria: { id: 1, is_completed: true }, completed_timestamp: 100 },
          { id: 999999, criteria: { id: 2, is_completed: true }, completed_timestamp: 200 }
        ]
      },
      new Set([62437])
    );

    expect(result.achievements).toEqual([
      { achievementId: 62437, earnedByCharacter: true, completedTimestamp: 100 }
    ]);
  });

  it("uses canonical achievement.id for identity, never a localized name (Phase E12)", () => {
    // No `name` field is even read by the normalizer - this test documents
    // that identity is id-only by construction.
    const result = normalizeBlizzardAchievements(
      { achievements: [{ id: 63650, criteria: { id: 1, is_completed: false }, completed_timestamp: 100 }] },
      new Set([63650])
    );

    expect(result.achievements[0]).toMatchObject({ achievementId: 63650 });
  });

  it("real live-shaped discrepancy (Phase E audit, 2026-09-04): an achievement can be present with a completed_timestamp yet criteria.is_completed:false", () => {
    const result = normalizeBlizzardAchievements(
      {
        achievements: [
          { id: 63650, criteria: { id: 231570, is_completed: false }, completed_timestamp: 1788306974000 }
        ]
      },
      new Set([63650])
    );

    expect(result.achievements[0]).toEqual({
      achievementId: 63650,
      earnedByCharacter: false,
      completedTimestamp: 1788306974000
    });
  });

  it("never fabricates earnedByCharacter:true when criteria is missing entirely", () => {
    const result = normalizeBlizzardAchievements(
      { achievements: [{ id: 62437, completed_timestamp: 100 }] },
      new Set([62437])
    );

    expect(result.achievements[0]?.earnedByCharacter).toBe(false);
  });

  it("tolerates a fully empty response without throwing", () => {
    expect(normalizeBlizzardAchievements({}, new Set([1]))).toEqual({
      achievements: []
    });
  });
});
