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
  const getAppAccessToken = vi.fn(async () => "app-token");
  const upsertFromBattleNet = vi.fn(async (input: { professions: unknown[] }) => ({
    id: "char-1",
    professionsPassedIn: input.professions
  }));
  const findBattleNetIdentities = vi.fn(async () => []);
  const refreshProfile = vi.fn(async () => ({
    status: "SUCCESS",
    characterId: "char-1",
    identityMismatch: false
  }));
  const refreshProfessions = vi.fn(async () => ({
    status: "SUCCESS",
    characterId: "char-1",
    professionCount: 2
  }));
  const refreshMythicPlus = vi.fn(async () => ({
    status: "SUCCESS",
    characterId: "char-1",
    hasMythicPlusProfile: true,
    currentPeriodBestRunCount: 1,
    seasonBestRunCount: 1
  }));
  const refreshAchievements = vi.fn(async () => ({
    status: "SUCCESS",
    characterId: "char-1",
    watchedAchievementCount: 3
  }));

  const service = new BattleNetImportService(
    { getAccountProfile } as never,
    { upsertFromBattleNet, findBattleNetIdentities } as never,
    { requireUsableAccessToken } as never,
    { getAccessToken: getAppAccessToken } as never,
    { refreshCharacter: refreshProfile } as never,
    { refreshCharacter: refreshProfessions } as never,
    { refreshCharacter: refreshMythicPlus } as never,
    { refreshCharacter: refreshAchievements } as never
  );

  return {
    service,
    requireUsableAccessToken,
    getAccountProfile,
    getAppAccessToken,
    upsertFromBattleNet,
    refreshProfile,
    refreshProfessions,
    refreshMythicPlus,
    refreshAchievements
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

  it("never fetches Character Professions directly during import - only identity is upserted", async () => {
    const harness = createHarness();

    await harness.service.importCharacters("session-token", ["1:antonidas"]);

    // No second profession-writing path: the identity upsert always
    // receives an empty professions array now, and profession data is
    // populated exclusively through the PROFESSIONS refresh pipeline
    // below (never a hardcoded knowledgePoints: 0 write again).
    expect(harness.upsertFromBattleNet).toHaveBeenCalledWith(
      expect.objectContaining({ professions: [] })
    );
  });

  it("triggers PROFILE, PROFESSIONS, MYTHIC_PLUS, and ACHIEVEMENTS refreshes for the newly-imported character via the app-token pipelines", async () => {
    const harness = createHarness();

    await harness.service.importCharacters("session-token", ["1:antonidas"]);

    expect(harness.refreshProfile).toHaveBeenCalledWith("char-1");
    expect(harness.refreshProfessions).toHaveBeenCalledWith("char-1");
    expect(harness.refreshMythicPlus).toHaveBeenCalledWith("char-1");
    expect(harness.refreshAchievements).toHaveBeenCalledWith("char-1");
  });

  it("still reports the character as imported even if profile, profession, Mythic+, or achievements enrichment fails", async () => {
    const requireUsableAccessToken = vi.fn(async () => ({
      accessToken: "user-token",
      raiderAccountId: "raider-1"
    }));

    const service = new BattleNetImportService(
      { getAccountProfile: vi.fn(async () => accountProfile) } as never,
      { upsertFromBattleNet: vi.fn(async () => ({ id: "char-1" })) } as never,
      { requireUsableAccessToken } as never,
      { getAccessToken: vi.fn(async () => "app-token") } as never,
      {
        refreshCharacter: vi.fn(async () => {
          throw new Error("unexpected profile refresh bug");
        })
      } as never,
      {
        refreshCharacter: vi.fn(async () => {
          throw new Error("unexpected profession refresh bug");
        })
      } as never,
      {
        refreshCharacter: vi.fn(async () => {
          throw new Error("unexpected mythic+ refresh bug");
        })
      } as never,
      {
        refreshCharacter: vi.fn(async () => {
          throw new Error("unexpected achievements refresh bug");
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
