import { describe, expect, it, vi } from "vitest";
import { CharacterProfileRefreshService } from "./character-profile-refresh.service.js";
import type { RefreshableCharacter } from "./character-equipment-refresh.service.js";

function createHarness(
  characters: RefreshableCharacter[],
  options: { profileResult?: unknown; profileError?: Error } = {}
) {
  const getAccessToken = vi.fn(async () => "app-token");
  const getCharacterProfile = vi.fn(async () => {
    if (options.profileError) {
      throw options.profileError;
    }

    return "profileResult" in options
      ? options.profileResult
      : { name: "Synblast", realm: { name: "Antonidas" }, level: 90 };
  });
  const recordSuccess = vi.fn(async () => {});
  const recordFailure = vi.fn(async () => {});

  const service = new CharacterProfileRefreshService(
    { getAccessToken } as never,
    { getCharacterProfile } as never,
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
    getCharacterProfile,
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

describe("CharacterProfileRefreshService", () => {
  it("uses the Blizzard app token, never a user OAuth token or RaiderAccount", async () => {
    const harness = createHarness([character]);

    await harness.service.refreshCharacter("char-1");

    expect(harness.getAccessToken).toHaveBeenCalledTimes(1);
    expect(harness.getCharacterProfile).toHaveBeenCalledWith(
      "app-token",
      "antonidas",
      "Synblast"
    );
  });

  it("persists a successful snapshot as BLIZZARD/PROFILE with the normalized payload", async () => {
    const harness = createHarness([character], {
      profileResult: {
        name: "Synblast",
        realm: { name: "Antonidas" },
        level: 90,
        character_class: { id: 7, name: "Schamane" },
        faction: { type: "ALLIANCE" }
      }
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toEqual({
      status: "SUCCESS",
      characterId: "char-1",
      identityMismatch: false
    });
    expect(harness.recordSuccess).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "PROFILE",
      expect.objectContaining({ className: "Shaman", faction: "ALLIANCE" })
    );
  });

  it("returns NOT_FOUND without calling Blizzard for an unknown SynTrack character id", async () => {
    const harness = createHarness([character]);

    const outcome = await harness.service.refreshCharacter("missing");

    expect(outcome).toEqual({ status: "NOT_FOUND", characterId: "missing" });
    expect(harness.getAccessToken).not.toHaveBeenCalled();
  });

  it("records a not_found failure, not a crash, when Blizzard returns null", async () => {
    const harness = createHarness([character], { profileResult: null });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome).toMatchObject({ status: "FAILED", reason: "not_found" });
  });

  it("records a failure without throwing on network/5xx errors, never touching the last snapshot", async () => {
    const harness = createHarness([character], {
      profileError: new Error("Battle.net request failed (503).")
    });

    const outcome = await harness.service.refreshCharacter("char-1");

    expect(outcome.status).toBe("FAILED");
    expect(harness.recordFailure).toHaveBeenCalledWith(
      "char-1",
      "BLIZZARD",
      "PROFILE",
      "Battle.net request failed (503)."
    );
    expect(harness.recordSuccess).not.toHaveBeenCalled();
  });

  it("one character failing does not corrupt the refresh of unrelated characters", async () => {
    const good: RefreshableCharacter = {
      id: "char-2",
      name: "Synbloom",
      realm: "Antonidas",
      realmSlug: null
    };

    const getAccessToken = vi.fn(async () => "app-token");
    const getCharacterProfile = vi.fn(
      async (_token: string, _realm: string, name: string) => {
        if (name === "Synblast") {
          throw new Error("Battle.net timeout");
        }

        return { name: "Synbloom", realm: { name: "Antonidas" }, level: 90 };
      }
    );
    const recordSuccess = vi.fn(async () => {});
    const recordFailure = vi.fn(async () => {});

    const service = new CharacterProfileRefreshService(
      { getAccessToken } as never,
      { getCharacterProfile } as never,
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
      "PROFILE",
      "Battle.net timeout"
    );
    expect(recordSuccess).toHaveBeenCalledWith(
      "char-2",
      "BLIZZARD",
      "PROFILE",
      expect.anything()
    );
  });
});
