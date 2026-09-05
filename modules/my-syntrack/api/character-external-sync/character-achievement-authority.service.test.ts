import { describe, expect, it, vi } from "vitest";
import {
  CharacterAchievementAuthorityService,
  mergeAchievementCompletion
} from "./character-achievement-authority.service.js";

describe("mergeAchievementCompletion", () => {
  it("TRUE from either source wins outright (monotonic - never regresses a real completion)", () => {
    expect(mergeAchievementCompletion(true, false)).toBe(true);
    expect(mergeAchievementCompletion(false, true)).toBe(true);
    expect(mergeAchievementCompletion(true, null)).toBe(true);
    expect(mergeAchievementCompletion(null, true)).toBe(true);
  });

  it("regression guard: Blizzard's false never overrides the addon's true (live-caught AOTC staleness case)", () => {
    // Phase E audit: addon captured true (real, live client state);
    // Blizzard's criteria.is_completed showed false for the same
    // achievement/character at the same moment.
    expect(mergeAchievementCompletion(true, false)).toBe(true);
  });

  it("FALSE from one source is used only when the other has no opinion", () => {
    expect(mergeAchievementCompletion(false, null)).toBe(false);
    expect(mergeAchievementCompletion(null, false)).toBe(false);
    expect(mergeAchievementCompletion(false, false)).toBe(false);
  });

  it("UNKNOWN only when both sources have no opinion", () => {
    expect(mergeAchievementCompletion(null, null)).toBeNull();
  });
});

describe("CharacterAchievementAuthorityService", () => {
  it("returns an empty map when no successful Blizzard snapshot exists", async () => {
    const findOne = vi.fn(async () => null);
    const service = new CharacterAchievementAuthorityService({ findOne } as never);

    const result = await service.getBlizzardEarnedByCharacterMap("char-1");

    expect(result.size).toBe(0);
  });

  it("maps achievementId to earnedByCharacter from the persisted payload", async () => {
    const findOne = vi.fn(async () => ({
      payload: {
        achievements: [
          { achievementId: 62437, earnedByCharacter: true, completedTimestamp: 100 },
          { achievementId: 63650, earnedByCharacter: false, completedTimestamp: 200 }
        ]
      },
      fetchedAt: new Date(),
      lastStatus: "SUCCESS" as const,
      lastAttemptAt: new Date(),
      lastError: null
    }));
    const service = new CharacterAchievementAuthorityService({ findOne } as never);

    const result = await service.getBlizzardEarnedByCharacterMap("char-1");

    expect(result.get(62437)).toBe(true);
    expect(result.get(63650)).toBe(false);
    expect(result.get(999999)).toBeUndefined();
  });

  it("batches multiple characters via getBlizzardEarnedByCharacterMaps", async () => {
    const findOne = vi.fn(async (characterId: string) => {
      if (characterId === "char-1") {
        return {
          payload: { achievements: [{ achievementId: 62437, earnedByCharacter: true, completedTimestamp: 1 }] },
          fetchedAt: new Date(),
          lastStatus: "SUCCESS" as const,
          lastAttemptAt: new Date(),
          lastError: null
        };
      }

      return null;
    });
    const service = new CharacterAchievementAuthorityService({ findOne } as never);

    const result = await service.getBlizzardEarnedByCharacterMaps(["char-1", "char-2"]);

    expect(result.get("char-1")?.get(62437)).toBe(true);
    expect(result.get("char-2")?.size).toBe(0);
  });

  it("has no successful snapshot -> UNKNOWN, never a fabricated false (isStale/staleness threshold does not apply - achievement completion is monotonic)", async () => {
    const findOne = vi.fn(async () => ({
      payload: null,
      fetchedAt: null,
      lastStatus: "FAILED" as const,
      lastAttemptAt: new Date(),
      lastError: "network error"
    }));
    const service = new CharacterAchievementAuthorityService({ findOne } as never);

    const result = await service.getBlizzardEarnedByCharacterMap("char-1");

    expect(result.size).toBe(0);
  });
});
