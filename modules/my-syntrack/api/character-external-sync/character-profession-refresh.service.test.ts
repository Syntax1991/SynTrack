import { describe, expect, it, vi } from "vitest";
import { CharacterProfessionRefreshService } from "./character-profession-refresh.service.js";
import type { RefreshableCharacter } from "./character-equipment-refresh.service.js";

function createHarness(
  characters: RefreshableCharacter[],
  options: { professionsResult?: unknown; professionsError?: Error } = {}
) {
  const getAccessToken = vi.fn(async () => "app-token");
  const getCharacterProfessions = vi.fn(async () => {
    if (options.professionsError) {
      throw options.professionsError;
    }

    return "professionsResult" in options
      ? options.professionsResult
      : { primaries: [], secondaries: [] };
  });
  const recordSuccess = vi.fn(async () => {});
  const recordFailure = vi.fn(async () => {});

  const service = new CharacterProfessionRefreshService(
    { getAccessToken } as never,
    { getCharacterProfessions } as never,
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
    getCharacterProfessions,
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

describe("CharacterProfessionRefreshService", () => {
  it("uses the Blizzard app token, never a user OAuth token or RaiderAccount", async () => {
    const harness = createHarness([character]);

    await harness.service.refreshCharacter("char-1");

    expect(harness.getAccessToken).toHaveBeenCalledTimes(1);
    expect(harness.getCharacterProfessions).toHaveBeenCalledWith(
      "app-token",
      "antonidas",
      "Synblast"
    );
  });

  it("persists a successful snapshot as BLIZZARD/PROFESSIONS with the normalized payload", async () => {
    const harness = createHarness([character], {
      professionsResult: {
        primaries: [
          {
            profession: { id: 171, name: "Alchemy" },
            tiers: [{ tier: { id: 2906 }, skill_points: 97, max_skill_points: 100 }]
          },
          {
            profession: { id: 165, name: "Leatherworking" },
            tiers: [{ tier: { id: 2915 }, skill_points: 100, max_skill_points: 100 }]
          }
        ]
      }
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      professionCount: 2
    });
    expect(harness.recordSuccess).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "PROFESSIONS",
      expect.objectContaining({
        professions: expect.arrayContaining([
          expect.objectContaining({ professionKey: "alchemy", skill: 97 })
        ])
      })
    );
  });

  it("treats an empty {primaries:[],secondaries:[]} response as a valid success, not a failure", async () => {
    // getCharacterProfessions() resolves an unknown/never-professions
    // character to this same shape rather than null - a real character
    // with zero primary professions looks identical, so there is no
    // separate not-found branch here.
    const harness = createHarness([character]);

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      professionCount: 0
    });
    expect(harness.recordFailure).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND without calling Blizzard for an unknown SynTrack character id", async () => {
    const harness = createHarness([character]);

    const outcome = await harness.service.refreshCharacter("missing");

    expect(outcome).toEqual({ status: "NOT_FOUND", characterId: "missing" });
    expect(harness.getAccessToken).not.toHaveBeenCalled();
  });

  it("records a failure without throwing on network/5xx errors, never touching the last snapshot", async () => {
    const harness = createHarness([character], {
      professionsError: new Error("Battle.net request failed (503).")
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome.status).toBe("FAILED");
    expect(harness.recordFailure).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "PROFESSIONS",
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
    const getCharacterProfessions = vi.fn(
      async (_token: string, _realm: string, name: string) => {
        if (name === "Synblast") {
          throw new Error("Battle.net timeout");
        }

        return {
          primaries: [
            { profession: { id: 202, name: "Engineering" }, tiers: [{ tier: { id: 2910 }, skill_points: 84, max_skill_points: 100 }] }
          ]
        };
      }
    );
    const recordSuccess = vi.fn(async () => {});
    const recordFailure = vi.fn(async () => {});

    const service = new CharacterProfessionRefreshService(
      { getAccessToken } as never,
      { getCharacterProfessions } as never,
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
      "PROFESSIONS",
      "Battle.net timeout"
    );
    expect(recordSuccess).toHaveBeenCalledWith(
      "char-2",
      "BLIZZARD",
      "PROFESSIONS",
      expect.anything()
    );
  });
});
