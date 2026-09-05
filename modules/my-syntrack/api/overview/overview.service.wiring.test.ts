import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Service-level wiring test (Phase F1 corrective review, Section 6):
 * OverviewService.getOverview() is the real orchestration boundary Phase
 * F1 exists to change - it must prove Blizzard-authoritative profile
 * level/class and profession public skill actually reach the FINAL
 * served character, while Knowledge Points stay addon-owned. Not a
 * duplicate of overview-profile-effective.test.ts/overview-profession-
 * effective.test.ts's exhaustive pure-function coverage - only the
 * wiring itself.
 *
 * OverviewService's ~11 other dependencies are plain field initializers
 * (not constructor-injected, unlike profileAuthorityService/
 * professionAuthorityService which Phase F1 made injectable) and hit the
 * shared Prisma singleton directly - including a free function,
 * loadProfessionIssuesByCharacter(), which builds its own
 * ProfessionDetailService internally and cannot be reached via instance
 * fields at all. A real-database integration test was considered and
 * rejected: this repo's vitest run resolves `DATABASE_URL` from the
 * process cwd (repo root, whose .env has no DATABASE_URL at all), not
 * apps/api/.env - so a real query would either throw or silently touch
 * the wrong sqlite file. The Prisma client module itself is mocked
 * instead (the same technique already used by battlenet-import.service.
 * test.ts), with a permissive default for every model/method this one
 * character exercises.
 */

const character = {
  id: "char-1",
  name: "Synblast",
  realm: "Antonidas",
  region: "eu",
  className: "Shaman",
  level: 80,
  lastSyncedAt: new Date("2026-09-01T00:00:00Z"),
  weeklyCompletions: [],
  gearSlots: [],
  gearBagSetPieces: [],
  resourceSnapshots: [],
  professionWeeklySnapshots: [],
  professionKnowledgeTreasureSnapshots: [],
  weeklyGameplaySnapshots: [],
  professions: [
    {
      id: "assignment-1",
      professionId: "prof-1",
      skill: 90,
      skillModifier: 0,
      knowledgePoints: 66,
      specializationSummary: null,
      profession: { id: "prof-1", key: "alchemy", name: "Alchemy", category: "CRAFTING", order: 0 },
      nodeProgress: []
    }
  ]
};

const professionAssignment = {
  id: "assignment-1",
  skill: 90,
  knowledgePoints: 66,
  character: {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    className: "Shaman",
    level: 80
  },
  nodeProgress: [],
  recipes: []
};

const professionRow = {
  id: "prof-1",
  key: "alchemy",
  name: "Alchemy",
  category: "CRAFTING",
  order: 0,
  capabilities: [],
  recipes: [],
  specializationTrees: [],
  assignments: [professionAssignment]
};

function permissiveModel() {
  return {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 0,
    upsert: async () => ({}),
    create: async () => ({}),
    update: async () => ({}),
    groupBy: async () => []
  };
}

vi.mock(
  "../../../../apps/api/src/infrastructure/database/prismaClient.js",
  () => ({
    prisma: new Proxy(
      {
        $transaction: async (operations: Promise<unknown>[]) =>
          Promise.all(operations)
      },
      {
        get(target, modelName) {
          if (modelName in target) {
            return (target as Record<string | symbol, unknown>)[modelName];
          }

          if (modelName === "character") {
            return {
              ...permissiveModel(),
              findMany: async () => [character],
              findUnique: async () => character
            };
          }

          if (modelName === "profession") {
            return {
              ...permissiveModel(),
              findMany: async () => [professionRow],
              findUnique: async () => professionRow
            };
          }

          return permissiveModel();
        }
      }
    )
  })
);

describe("OverviewService.getOverview - service-level wiring", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reaches the final served character with Blizzard-authoritative level/class, and Blizzard public skill on the profession, while KP stays addon-owned", async () => {
    const { OverviewService } = await import("./overview.service.js");

    const getAuthoritativeProfile = vi.fn(async () => ({
      source: "BLIZZARD" as const,
      fetchedAt: new Date(),
      isStale: false,
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      level: 999, // sentinel - obviously not the addon's real level (80)
      class: "Warlock", // sentinel - obviously not the addon's real class (Shaman)
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null,
      lastLoginAt: null
    }));

    const getAuthoritativeProfessions = vi.fn(async () => [
      {
        source: "BLIZZARD" as const,
        professionKey: "alchemy",
        professionId: 171,
        professionName: "Alchemy",
        tierId: 1,
        tierName: "Tier",
        skill: 12345, // sentinel - obviously not the addon's real skill (90)
        maxSkill: null,
        fetchedAt: new Date(),
        isStale: false
      }
    ]);

    const service = new OverviewService(
      { getAuthoritativeProfile } as never,
      { getAuthoritativeProfessions } as never
    );

    const overview = await service.getOverview();
    const entry = overview.characters.find((c) => c.character.id === "char-1");

    expect(entry).toBeDefined();
    expect(entry!.character.level).toBe(999);
    expect(entry!.character.className).toBe("Warlock");

    const alchemy = entry!.professions.items.find((p) => p.key === "alchemy");
    expect(alchemy?.skill).toBe(12345);
    // Knowledge Points remain addon-owned - never touched by the authority overlay.
    expect(alchemy?.knowledgePoints).toBe(66);
  });

  it("falls back to the addon's real level/class/skill when no Blizzard data exists (source=NONE)", async () => {
    const { OverviewService } = await import("./overview.service.js");

    const getAuthoritativeProfile = vi.fn(async () => ({
      source: "NONE" as const,
      fetchedAt: null,
      isStale: false,
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      level: 80, // the addon's real value, passed straight through
      class: "Shaman",
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null,
      lastLoginAt: null
    }));

    const getAuthoritativeProfessions = vi.fn(async () => []); // no Blizzard match at all

    const service = new OverviewService(
      { getAuthoritativeProfile } as never,
      { getAuthoritativeProfessions } as never
    );

    const overview = await service.getOverview();
    const entry = overview.characters.find((c) => c.character.id === "char-1");

    expect(entry!.character.level).toBe(80);
    expect(entry!.character.className).toBe("Shaman");

    const alchemy = entry!.professions.items.find((p) => p.key === "alchemy");
    expect(alchemy?.skill).toBe(90); // addon's own raw skill, untouched
  });
});
