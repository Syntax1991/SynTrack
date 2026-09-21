import { describe, expect, it } from "vitest";
import { CharacterService } from "./character.service.js";

/*
 * Service-level wiring test (Phase F3): proves CharacterService.list()
 * renders the Blizzard-primary/ADDON-fallback level/className through
 * CharacterProfileAuthorityService, matching Overview's established
 * pattern, without ever rewriting the underlying Character row.
 */

function characterRow() {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    professions: []
  };
}

function noopProfessionAuthorityService() {
  return { getAuthoritativeProfessions: async () => [] } as never;
}

function noopMythicPlusAuthorityService() {
  return {
    getAuthoritativeMythicPlus: async () => ({
      source: "NONE",
      rating: null,
      hasProfile: false,
      bestRuns: [],
      periodId: null,
      fetchedAt: null,
      isStale: false
    })
  } as never;
}

describe("CharacterService.list - service-level wiring", () => {
  it("renders the fresh Blizzard level/className, not the raw addon-captured Character row", async () => {
    const profileAuthorityService = {
      getAuthoritativeProfile: async (_id: string, character: { name: string; realm: string; region: string }) => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: character.name,
        realm: character.realm,
        region: character.region,
        level: 92, // Blizzard's fresher value, different from the addon-captured 90
        class: "Enhancement Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new CharacterService(
      { findAll: async () => [characterRow()] } as never,
      {} as never,
      undefined,
      profileAuthorityService,
      noopProfessionAuthorityService(),
      noopMythicPlusAuthorityService()
    );

    const characters = await service.list();

    expect(characters[0]).toMatchObject({
      id: "char-1",
      name: "Synblast",
      level: 92,
      className: "Enhancement Shaman"
    });
  });

  it("falls back to the persisted Character row's level/className when no usable Blizzard snapshot exists", async () => {
    const profileAuthorityService = {
      getAuthoritativeProfile: async (_id: string, character: { name: string; realm: string; region: string; level: number; className: string }) => ({
        source: "NONE" as const,
        fetchedAt: null,
        isStale: false,
        name: character.name,
        realm: character.realm,
        region: character.region,
        level: character.level,
        class: character.className,
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new CharacterService(
      { findAll: async () => [characterRow()] } as never,
      {} as never,
      undefined,
      profileAuthorityService,
      noopProfessionAuthorityService(),
      noopMythicPlusAuthorityService()
    );

    const characters = await service.list();

    expect(characters[0]).toMatchObject({
      id: "char-1",
      level: 90, // the addon-captured Character row value, unchanged
      className: "Shaman"
    });
  });

  it("never mutates identity fields (id/name/realm/region) while overriding level/className", async () => {
    const profileAuthorityService = {
      getAuthoritativeProfile: async (_id: string, character: { name: string; realm: string; region: string }) => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "SHOULD-NEVER-BE-USED",
        realm: "SHOULD-NEVER-BE-USED",
        region: "SHOULD-NEVER-BE-USED",
        level: 92,
        class: "Enhancement Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new CharacterService(
      { findAll: async () => [characterRow()] } as never,
      {} as never,
      undefined,
      profileAuthorityService,
      noopProfessionAuthorityService(),
      noopMythicPlusAuthorityService()
    );

    const characters = await service.list();

    // ...character is spread FIRST, so identity fields still come from the
    // real Character row - the authoritative profile's own name/realm/region
    // (a harness artifact here) is only ever used as an input to the lookup,
    // never written back onto the served character.
    expect(characters[0]).toMatchObject({
      id: "char-1",
      name: "Synblast",
      realm: "Antonidas",
      region: "eu"
    });
  });
});
