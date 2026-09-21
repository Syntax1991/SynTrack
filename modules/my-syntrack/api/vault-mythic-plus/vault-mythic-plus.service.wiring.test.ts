import { describe, expect, it, vi } from "vitest";

/*
 * Service-level wiring test (Phase F3): Vault/M+ character metadata was
 * one of the real direct readers of the raw Character.level/className
 * identified by the post-F2 redundancy audit - proves it now renders the
 * effective (BLIZZARD-primary/ADDON-fallback) value instead.
 *
 * VaultMythicPlusService's own weeklyGameplayRepository is a private,
 * non-injectable field - same technique as
 * season-checklist.service.wiring.test.ts: the Prisma client module is
 * mocked with a permissive default (characterWeeklyGameplaySnapshot
 * resolves to no rows), so `getOverview()` falls into its own documented
 * "unresolved character" branch, keeping this test focused purely on the
 * level/className wiring, not weekly-gameplay derivation.
 */

function permissiveModel() {
  return {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 0
  };
}

vi.mock(
  "../../../../apps/api/src/infrastructure/database/prismaClient.js",
  () => ({
    prisma: new Proxy(
      {},
      {
        get(_target, modelName) {
          return permissiveModel();
        }
      }
    )
  })
);

function characterWithTags() {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    tagAssignments: []
  };
}

describe("VaultMythicPlusService.getOverview - Phase F3 effective level/className", () => {
  it("renders the fresh Blizzard level/className", async () => {
    const { VaultMythicPlusService } = await import("./vault-mythic-plus.service.js");

    const repository = {
      findCharactersWithTags: async () => [characterWithTags()]
    } as never;
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

    const service = new VaultMythicPlusService(repository, profileAuthorityService);
    const overview = await service.getOverview();

    expect(overview.characters[0]).toMatchObject({
      id: "char-1",
      level: 91,
      className: "Enhancement Shaman"
    });
  });

  it("falls back to the persisted level/className when no usable Blizzard profile exists", async () => {
    const { VaultMythicPlusService } = await import("./vault-mythic-plus.service.js");

    const repository = {
      findCharactersWithTags: async () => [characterWithTags()]
    } as never;
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

    const service = new VaultMythicPlusService(repository, profileAuthorityService);
    const overview = await service.getOverview();

    expect(overview.characters[0]).toMatchObject({
      id: "char-1",
      level: 90,
      className: "Shaman"
    });
  });
});
