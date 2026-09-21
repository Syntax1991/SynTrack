import { describe, expect, it, vi } from "vitest";
import { CharacterMythicPlusRefreshService } from "./character-mythic-plus-refresh.service.js";
import type { RefreshableCharacter } from "./character-equipment-refresh.service.js";

function createHarness(
  characters: RefreshableCharacter[],
  options: {
    mythicPlusResult?: unknown;
    mythicPlusError?: Error;
    seasonResult?: unknown;
    seasonError?: Error;
  } = {}
) {
  const getAccessToken = vi.fn(async () => "app-token");
  const getCharacterMythicKeystoneProfile = vi.fn(async () => {
    if (options.mythicPlusError) {
      throw options.mythicPlusError;
    }

    return "mythicPlusResult" in options ? options.mythicPlusResult : null;
  });
  const getCharacterMythicKeystoneProfileSeason = vi.fn(async () => {
    if (options.seasonError) {
      throw options.seasonError;
    }

    return "seasonResult" in options ? options.seasonResult : null;
  });
  const recordSuccess = vi.fn(async () => {});
  const recordFailure = vi.fn(async () => {});

  const service = new CharacterMythicPlusRefreshService(
    { getAccessToken } as never,
    { getCharacterMythicKeystoneProfile, getCharacterMythicKeystoneProfileSeason } as never,
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
    getCharacterMythicKeystoneProfile,
    getCharacterMythicKeystoneProfileSeason,
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

describe("CharacterMythicPlusRefreshService", () => {
  it("uses the Blizzard app token, never a user OAuth token or RaiderAccount", async () => {
    const harness = createHarness([character]);

    await harness.service.refreshCharacter("char-1");

    expect(harness.getAccessToken).toHaveBeenCalledTimes(1);
    expect(harness.getCharacterMythicKeystoneProfile).toHaveBeenCalledWith(
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

  it("persists a successful BLIZZARD/MYTHIC_PLUS snapshot with both currentPeriod and season data", async () => {
    const harness = createHarness([character], {
      mythicPlusResult: {
        current_mythic_rating: { rating: 3125.5818 },
        current_period: {
          period: { id: 1079 },
          best_runs: [{ keystone_level: 11, dungeon: { id: 585 } }]
        },
        seasons: [{ id: 18 }, { id: 14 }]
      },
      seasonResult: {
        season: { id: 18 },
        best_runs: [{ keystone_level: 12, dungeon: { id: 587 }, is_completed_within_time: true }]
      }
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      hasMythicPlusProfile: true,
      currentPeriodBestRunCount: 1,
      seasonBestRunCount: 1
    });
    expect(harness.getCharacterMythicKeystoneProfileSeason).toHaveBeenCalledWith(
      "app-token",
      "antonidas",
      "Synblast",
      18
    );
    expect(harness.recordSuccess).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "MYTHIC_PLUS",
      expect.objectContaining({
        hasProfile: true,
        rating: 3125,
        season: expect.objectContaining({ seasonId: 18 })
      })
    );
  });

  it("does not fetch the season sub-resource when the profile has no seasons link", async () => {
    const harness = createHarness([character], {
      mythicPlusResult: { current_period: { period: { id: 1079 } } }
    });

    await harness.service.refreshCharacter("char-1");

    expect(harness.getCharacterMythicKeystoneProfileSeason).not.toHaveBeenCalled();
  });

  it("a failed season fetch does not fail the whole refresh - current_period data is still recorded as a success", async () => {
    const harness = createHarness([character], {
      mythicPlusResult: {
        current_period: { period: { id: 1079 }, best_runs: [{ keystone_level: 11, dungeon: { id: 585 } }] },
        seasons: [{ id: 18 }]
      },
      seasonError: new Error("season endpoint temporarily unavailable")
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      hasMythicPlusProfile: true,
      currentPeriodBestRunCount: 1,
      seasonBestRunCount: 0
    });
    expect(harness.recordFailure).not.toHaveBeenCalled();
    expect(harness.recordSuccess).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "MYTHIC_PLUS",
      expect.objectContaining({
        currentPeriod: expect.objectContaining({ periodId: 1079 }),
        season: { seasonId: null, bestRuns: [] }
      })
    );
  });

  it("treats a clean null (no Mythic Keystone profile) as a SUCCESSFUL refresh, not a failure - genuine 'no activity' evidence", async () => {
    const harness = createHarness([character]);

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      hasMythicPlusProfile: false,
      currentPeriodBestRunCount: 0,
      seasonBestRunCount: 0
    });
    expect(harness.getCharacterMythicKeystoneProfileSeason).not.toHaveBeenCalled();
    expect(harness.recordSuccess).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "MYTHIC_PLUS",
      expect.objectContaining({ hasProfile: false })
    );
    expect(harness.recordFailure).not.toHaveBeenCalled();
  });

  it("records a failure without throwing on network/5xx errors from the base profile call, never touching the last snapshot", async () => {
    const harness = createHarness([character], {
      mythicPlusError: new Error("Battle.net request failed (503).")
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome.status).toBe("FAILED");
    expect(harness.recordFailure).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "MYTHIC_PLUS",
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
    const getCharacterMythicKeystoneProfile = vi.fn(
      async (_token: string, _realm: string, name: string) => {
        if (name === "Synblast") {
          throw new Error("Battle.net timeout");
        }

        return null;
      }
    );
    const getCharacterMythicKeystoneProfileSeason = vi.fn(async () => null);
    const recordSuccess = vi.fn(async () => {});
    const recordFailure = vi.fn(async () => {});

    const service = new CharacterMythicPlusRefreshService(
      { getAccessToken } as never,
      { getCharacterMythicKeystoneProfile, getCharacterMythicKeystoneProfileSeason } as never,
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
      "MYTHIC_PLUS",
      "Battle.net timeout"
    );
    expect(recordSuccess).toHaveBeenCalledWith(
      "char-2",
      "BLIZZARD",
      "MYTHIC_PLUS",
      expect.anything()
    );
  });
});
