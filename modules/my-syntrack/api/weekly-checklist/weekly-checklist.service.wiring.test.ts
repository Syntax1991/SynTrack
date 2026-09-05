import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Service-level wiring test (Phase F3): Weekly Checklist character
 * metadata was one of the real direct readers of the raw
 * Character.level/className identified by the post-F2 redundancy audit -
 * proves it now renders the effective (BLIZZARD-primary/ADDON-fallback)
 * value instead.
 *
 * Same technique as season-checklist.service.wiring.test.ts: the Prisma
 * client module is mocked with a permissive default for every model, since
 * WeeklyChecklistService's many other sub-services (profession weekly,
 * tags, weekly gameplay, tracker scope/value) are private, non-injectable
 * fields - this test isolates the level/className wiring, not their
 * derivation.
 */

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

          return permissiveModel();
        }
      }
    )
  })
);

function characterRow() {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    weeklyCompletions: []
  };
}

function fakeRepository() {
  return {
    syncTaskCatalog: async () => {},
    findTasks: async () => [],
    findCharacters: async () => [characterRow()]
  } as never;
}

describe("WeeklyChecklistService.getChecklist - Phase F3 effective level/className", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders the fresh Blizzard level/className", async () => {
    const { WeeklyChecklistService } = await import("./weekly-checklist.service.js");

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

    const service = new WeeklyChecklistService(fakeRepository(), profileAuthorityService);
    const checklist = await service.getChecklist();

    expect(checklist.characters[0]).toMatchObject({
      id: "char-1",
      level: 91,
      className: "Enhancement Shaman"
    });
  });

  it("falls back to the persisted level/className when no usable Blizzard profile exists", async () => {
    const { WeeklyChecklistService } = await import("./weekly-checklist.service.js");

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

    const service = new WeeklyChecklistService(fakeRepository(), profileAuthorityService);
    const checklist = await service.getChecklist();

    expect(checklist.characters[0]).toMatchObject({
      id: "char-1",
      level: 90,
      className: "Shaman"
    });
  });
});
