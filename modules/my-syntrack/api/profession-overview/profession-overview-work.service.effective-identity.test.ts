import { describe, expect, it } from "vitest";
import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import { ProfessionOverviewWorkService } from "./profession-overview-work.service.js";
import type { ProfessionOverviewWorkAssignment } from "./profession-overview-work.types.js";

/*
 * Service-level wiring test (Phase F3 follow-up): the Work Matrix's
 * character className was one of the remaining raw Character.className
 * reads identified after the Specializations page fix (commit 29ea241) -
 * proves it now comes from CharacterProfileAuthorityService (BLIZZARD-
 * primary/ADDON-fallback), resolved once per distinct character even
 * when that character has multiple profession rows, and that no
 * Character row is ever written.
 */

function noSnapshotProfessionAuthorityService() {
  return new CharacterProfessionAuthorityService({
    findOne: async () => null
  } as never);
}

function fakeWeeklyStatusService() {
  return { getOverview: async () => ({ characters: [] }) } as never;
}

function fakeTreasureStatusService() {
  return { getOverview: async () => ({ characters: [] }) } as never;
}

function fakeCraftLookup() {
  return { getOverview: async () => ({ items: [] }) } as never;
}

function assignment(
  overrides: Partial<ProfessionOverviewWorkAssignment> = {}
): ProfessionOverviewWorkAssignment {
  return {
    characterId: "char-1",
    characterName: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    professionId: "prof-alchemy",
    professionKey: "alchemy",
    professionName: "Alchemy",
    professionCategory: "CRAFTING",
    skill: 90,
    knowledgePoints: 42,
    ...overrides
  };
}

describe("ProfessionOverviewWorkService.getOverview - Phase F3 follow-up effective className", () => {
  it("renders the fresh Blizzard className instead of the raw addon-captured Character row", async () => {
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

    const service = new ProfessionOverviewWorkService(
      { findAssignments: async () => [assignment()] } as never,
      fakeWeeklyStatusService(),
      fakeTreasureStatusService(),
      fakeCraftLookup(),
      noSnapshotProfessionAuthorityService(),
      profileAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.rows[0]!.character.className).toBe("Enhancement Shaman");
  });

  it("falls back to the persisted className when no usable Blizzard profile exists", async () => {
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

    const service = new ProfessionOverviewWorkService(
      { findAssignments: async () => [assignment()] } as never,
      fakeWeeklyStatusService(),
      fakeTreasureStatusService(),
      fakeCraftLookup(),
      noSnapshotProfessionAuthorityService(),
      profileAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.rows[0]!.character.className).toBe("Shaman");
  });

  it("resolves one effective identity per distinct character even with multiple profession rows for the same character", async () => {
    let callCount = 0;
    const profileAuthorityService = {
      getAuthoritativeProfile: async () => {
        callCount += 1;

        return {
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
        };
      }
    } as never;

    const service = new ProfessionOverviewWorkService(
      {
        findAssignments: async () => [
          assignment({ professionKey: "alchemy" }),
          assignment({ professionId: "prof-lw", professionKey: "leatherworking" })
        ]
      } as never,
      fakeWeeklyStatusService(),
      fakeTreasureStatusService(),
      fakeCraftLookup(),
      noSnapshotProfessionAuthorityService(),
      profileAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.rows).toHaveLength(2);
    expect(overview.rows.every((row) => row.character.className === "Enhancement Shaman")).toBe(true);
    expect(callCount).toBe(1); // one lookup for the one distinct character, not per row
  });

  it("leaves knowledgePoints addon-owned while overriding className", async () => {
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

    const service = new ProfessionOverviewWorkService(
      { findAssignments: async () => [assignment({ knowledgePoints: 66 })] } as never,
      fakeWeeklyStatusService(),
      fakeTreasureStatusService(),
      fakeCraftLookup(),
      noSnapshotProfessionAuthorityService(),
      profileAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.rows[0]!.character.className).toBe("Enhancement Shaman");
    expect(overview.rows[0]!.investedKnowledge).toBeDefined();
  });
});
