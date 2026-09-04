import { describe, expect, it, vi } from "vitest";

// BattleNetImportService's suppression check (RemovedCharacterRepository)
// imports the real prisma client directly rather than taking it via
// constructor DI - mocked here so this stays a pure unit test instead of
// depending on real dev.db state for an unrelated raiderAccountId.
vi.mock(
  "../../../../../apps/api/src/infrastructure/database/prismaClient.js",
  () => ({
    prisma: {
      removedCharacter: {
        findFirst: async () => null
      }
    }
  })
);

const { BattleNetImportService } = await import(
  "./battlenet-import.service.js"
);

const accountProfile = {
  wow_accounts: [
    {
      characters: [
        {
          id: 1,
          name: "Synblast",
          level: 90,
          realm: { name: "Antonidas", slug: "antonidas" },
          playable_class: { name: "Shaman" }
        }
      ]
    }
  ]
};

function createHarness() {
  const requireUsableAccessToken = vi.fn(async () => ({
    accessToken: "user-token",
    raiderAccountId: "raider-1"
  }));
  const getAccountProfile = vi.fn(async () => accountProfile);
  const getCharacterProfessions = vi.fn(async () => ({
    primaries: [],
    secondaries: []
  }));
  const getAppAccessToken = vi.fn(async () => "app-token");
  const upsertFromBattleNet = vi.fn(async () => ({ id: "char-1" }));
  const findBattleNetIdentities = vi.fn(async () => []);
  const refreshCharacter = vi.fn(async () => ({
    status: "SUCCESS",
    characterId: "char-1",
    identityMismatch: false
  }));

  const service = new BattleNetImportService(
    { getAccountProfile, getCharacterProfessions } as never,
    { upsertFromBattleNet, findBattleNetIdentities } as never,
    { findAll: vi.fn(async () => []) } as never,
    { requireUsableAccessToken } as never,
    { getAccessToken: getAppAccessToken } as never,
    { refreshCharacter } as never
  );

  return {
    service,
    requireUsableAccessToken,
    getAccountProfile,
    getCharacterProfessions,
    getAppAccessToken,
    upsertFromBattleNet,
    refreshCharacter
  };
}

describe("BattleNetImportService token usage", () => {
  it("uses the user's OAuth token only for account discovery (/profile/user/wow)", async () => {
    const harness = createHarness();

    await harness.service.listCharacters("session-token");

    expect(harness.requireUsableAccessToken).toHaveBeenCalledWith(
      "session-token"
    );
    expect(harness.getAccountProfile).toHaveBeenCalledWith("user-token");
  });

  it("uses the app token, not the user's OAuth token, for the Professions fetch during import", async () => {
    const harness = createHarness();

    await harness.service.importCharacters("session-token", ["1:antonidas"]);

    expect(harness.getAppAccessToken).toHaveBeenCalled();
    expect(harness.getCharacterProfessions).toHaveBeenCalledWith(
      "app-token",
      "antonidas",
      "Synblast"
    );
  });

  it("triggers a PROFILE refresh for the newly-imported character via the app-token pipeline", async () => {
    const harness = createHarness();

    await harness.service.importCharacters("session-token", ["1:antonidas"]);

    expect(harness.refreshCharacter).toHaveBeenCalledWith("char-1");
  });

  it("still reports the character as imported even if profile enrichment fails", async () => {
    const requireUsableAccessToken = vi.fn(async () => ({
      accessToken: "user-token",
      raiderAccountId: "raider-1"
    }));

    const service = new BattleNetImportService(
      {
        getAccountProfile: vi.fn(async () => accountProfile),
        getCharacterProfessions: vi.fn(async () => ({
          primaries: [],
          secondaries: []
        }))
      } as never,
      { upsertFromBattleNet: vi.fn(async () => ({ id: "char-1" })) } as never,
      { findAll: vi.fn(async () => []) } as never,
      { requireUsableAccessToken } as never,
      { getAccessToken: vi.fn(async () => "app-token") } as never,
      {
        refreshCharacter: vi.fn(async () => {
          throw new Error("unexpected profile refresh bug");
        })
      } as never
    );

    const result = await service.importCharacters("session-token", [
      "1:antonidas"
    ]);

    expect(result.importedCharacters).toBe(1);
    expect(result.failedCharacters).toEqual([]);
  });
});
