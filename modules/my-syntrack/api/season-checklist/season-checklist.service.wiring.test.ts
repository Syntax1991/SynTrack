import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Service-level wiring test (Phase F1 corrective review, Section 6):
 * proves SeasonChecklistService.getChecklist() actually uses the
 * effective (Blizzard-primary/addon-fallback) Mythic+ rating path for
 * the mythicPlus goal, and that Vault/current-week state stays isolated
 * (this service never even imports the Vault-related modules - see
 * mythic-plus-vault-firewall.test.ts for the static import-graph proof;
 * this test proves the runtime *value* boundary instead: the served
 * mythicPlus goal reflects the injected Mythic+ authority service, and
 * the response carries no Vault-shaped field at all).
 *
 * Same technique as overview.service.wiring.test.ts: the Prisma client
 * module is mocked (this repo's vitest run cannot resolve a real
 * DATABASE_URL - see that file's comment for why), with a permissive
 * default for every model, and specific fixtures only where the mythicPlus
 * goal's derivation actually needs real data to produce a non-trivial result.
 */

const character = {
  id: "char-1",
  name: "Synblast",
  realm: "Antonidas",
  region: "eu",
  className: "Shaman",
  level: 90,
  gearSlots: [],
  gearBagSetPieces: []
};

const ratingTrackerDefinition = {
  id: "def-1",
  scopeKey: "GLOBAL",
  key: "mythic-plus-rating",
  name: "Mythic+ Rating",
  valueType: "NUMBER",
  resetBehavior: "SEASONAL",
  category: "GAMEPLAY",
  sortOrder: 1,
  isPinned: true,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date()
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

          if (modelName === "characterTrackerDefinition") {
            return {
              ...permissiveModel(),
              findMany: async () => [ratingTrackerDefinition]
            };
          }

          return permissiveModel();
        }
      }
    )
  })
);

describe("SeasonChecklistService.getChecklist - service-level wiring", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("uses the effective (Blizzard-primary) Mythic+ rating for the served mythicPlus goal", async () => {
    const { SeasonChecklistService } = await import("./season-checklist.service.js");

    const getAuthoritativeMythicPlusMap = vi.fn(async () =>
      new Map([
        [
          "char-1",
          {
            source: "BLIZZARD" as const,
            rating: 3125,
            hasProfile: true,
            bestRuns: [],
            periodId: 1079,
            fetchedAt: new Date(),
            isStale: false
          }
        ]
      ])
    );

    const service = new SeasonChecklistService({
      getAuthoritativeMythicPlusMap
    } as never);

    const checklist = await service.getChecklist();
    const entry = checklist.characters.find((c) => c.id === "char-1");

    expect(getAuthoritativeMythicPlusMap).toHaveBeenCalledWith(["char-1"]);
    expect(entry).toBeDefined();
    expect(entry!.mythicPlus.label).toContain("3125");
  });

  it("never exposes any Vault/current-week field on the served checklist response", async () => {
    const { SeasonChecklistService } = await import("./season-checklist.service.js");

    const getAuthoritativeMythicPlusMap = vi.fn(async () => new Map());
    const service = new SeasonChecklistService({
      getAuthoritativeMythicPlusMap
    } as never);

    const checklist = await service.getChecklist();

    expect(checklist).not.toHaveProperty("vault");
    expect(checklist.characters[0]).not.toHaveProperty("vault");
    expect(checklist.characters[0]).not.toHaveProperty("vaultProgress");
    expect(checklist.characters[0]).not.toHaveProperty("currentWeekRuns");
  });

  it("Phase F3: renders the fresh Blizzard level/className instead of the raw addon-captured Character row", async () => {
    const { SeasonChecklistService } = await import("./season-checklist.service.js");

    const getAuthoritativeMythicPlusMap = vi.fn(async () => new Map());
    const profileAuthorityService = {
      getAuthoritativeProfile: async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 91,
        class: "Enhancement Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new SeasonChecklistService(
      { getAuthoritativeMythicPlusMap } as never,
      profileAuthorityService
    );

    const checklist = await service.getChecklist();
    const entry = checklist.characters.find((c) => c.id === "char-1");

    expect(entry).toMatchObject({
      level: 91,
      className: "Enhancement Shaman"
    });
  });

  it("Phase F3: falls back to the persisted level/className when no usable Blizzard profile exists", async () => {
    const { SeasonChecklistService } = await import("./season-checklist.service.js");

    const getAuthoritativeMythicPlusMap = vi.fn(async () => new Map());
    const profileAuthorityService = {
      getAuthoritativeProfile: async () => ({
        source: "NONE" as const,
        fetchedAt: null,
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 90,
        class: "Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new SeasonChecklistService(
      { getAuthoritativeMythicPlusMap } as never,
      profileAuthorityService
    );

    const checklist = await service.getChecklist();
    const entry = checklist.characters.find((c) => c.id === "char-1");

    expect(entry).toMatchObject({
      level: 90,
      className: "Shaman"
    });
  });
});
