import { describe, expect, it, vi } from "vitest";
import { CharacterAchievementsRefreshService } from "./character-achievements-refresh.service.js";
import type { RefreshableCharacter } from "./character-equipment-refresh.service.js";

function createHarness(
  characters: RefreshableCharacter[],
  options: { achievementsResult?: unknown; achievementsError?: Error } = {}
) {
  const getAccessToken = vi.fn(async () => "app-token");
  const getCharacterAchievements = vi.fn(async () => {
    if (options.achievementsError) {
      throw options.achievementsError;
    }

    return "achievementsResult" in options ? options.achievementsResult : null;
  });
  const recordSuccess = vi.fn(async () => {});
  const recordFailure = vi.fn(async () => {});

  const service = new CharacterAchievementsRefreshService(
    { getAccessToken } as never,
    { getCharacterAchievements } as never,
    { recordSuccess, recordFailure } as never,
    {
      findById: vi.fn(
        async (id: string) =>
          characters.find((character) => character.id === id) ?? null
      ),
      findAllEligible: vi.fn(async () => characters)
    } as never
  );

  return {
    service,
    getAccessToken,
    getCharacterAchievements,
    recordSuccess,
    recordFailure
  };
}

const character: RefreshableCharacter = {
  id: "char-1",
  name: "Synblast",
  realm: "Antonidas",
  realmSlug: null
};

describe("CharacterAchievementsRefreshService", () => {
  it("uses the Blizzard app token, never a user OAuth token or RaiderAccount", async () => {
    const harness = createHarness([character]);

    await harness.service.refreshCharacter("char-1");

    expect(harness.getAccessToken).toHaveBeenCalledTimes(1);
    expect(harness.getCharacterAchievements).toHaveBeenCalledWith(
      "app-token",
      "antonidas",
      "Synblast"
    );
  });

  it("returns NOT_FOUND without calling Blizzard for an unknown SynTrack character id", async () => {
    const harness = createHarness([character]);

    const outcome = await harness.service.refreshCharacter("missing");

    expect(outcome).toEqual({ status: "NOT_FOUND", characterId: "missing" });
    expect(harness.getAccessToken).not.toHaveBeenCalled();
  });

  it("persists a successful BLIZZARD/ACHIEVEMENTS snapshot filtered to watched ids", async () => {
    const harness = createHarness([character], {
      achievementsResult: {
        achievements: [
          { id: 62437, criteria: { id: 1, is_completed: true }, completed_timestamp: 100 },
          { id: 999999, criteria: { id: 2, is_completed: true }, completed_timestamp: 200 }
        ]
      }
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome.status).toBe("SUCCESS");
    // 999999 is not in the catalog's watched set - the payload must
    // contain ONLY the watched 62437 entry, confirming filtering happened.
    expect(harness.recordSuccess).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "ACHIEVEMENTS",
      { achievements: [{ achievementId: 62437, earnedByCharacter: true, completedTimestamp: 100 }] }
    );
  });

  it("treats a clean null (no achievements profile) as a SUCCESSFUL refresh, not a failure", async () => {
    const harness = createHarness([character]);

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      watchedAchievementCount: 0
    });
    expect(harness.recordFailure).not.toHaveBeenCalled();
  });

  it("records a failure without throwing on network/5xx errors, never touching the last snapshot", async () => {
    const harness = createHarness([character], {
      achievementsError: new Error("Battle.net request failed (503).")
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome.status).toBe("FAILED");
    expect(harness.recordFailure).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "ACHIEVEMENTS",
      "Battle.net request failed (503)."
    );
    expect(harness.recordSuccess).not.toHaveBeenCalled();
  });

  it("one character failing does not corrupt the refresh of unrelated characters", async () => {
    const good: RefreshableCharacter = {
      id: "char-2",
      name: "Synbeast",
      realm: "Antonidas",
      realmSlug: null
    };

    const getAccessToken = vi.fn(async () => "app-token");
    const getCharacterAchievements = vi.fn(
      async (_token: string, _realm: string, name: string) => {
        if (name === "Synblast") {
          throw new Error("Battle.net timeout");
        }

        return null;
      }
    );
    const recordSuccess = vi.fn(async () => {});
    const recordFailure = vi.fn(async () => {});

    const service = new CharacterAchievementsRefreshService(
      { getAccessToken } as never,
      { getCharacterAchievements } as never,
      { recordSuccess, recordFailure } as never,
      {
        findById: vi.fn(),
        findAllEligible: vi.fn(async () => [character, good])
      } as never
    );

    const summary = await service.refreshAllEligible();

    expect(summary.totalCharacters).toBe(2);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);
    expect(recordFailure).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "ACHIEVEMENTS",
      "Battle.net timeout"
    );
    expect(recordSuccess).toHaveBeenCalledWith(
      "char-2",
      "BLIZZARD",
      "ACHIEVEMENTS",
      expect.anything()
    );
  });
});
