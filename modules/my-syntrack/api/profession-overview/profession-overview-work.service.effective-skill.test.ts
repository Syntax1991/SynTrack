import { describe, expect, it } from "vitest";
import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import { ProfessionOverviewWorkService } from "./profession-overview-work.service.js";
import type { ProfessionOverviewWorkAssignment } from "./profession-overview-work.types.js";

/*
 * Service-level wiring test (Phase F3), split out from
 * profession-overview-work.service.test.ts to stay under the 350-line
 * architecture cap: proves the Work Matrix's base-skill column now comes
 * from CharacterProfessionAuthorityService (BLIZZARD-primary/ADDON-
 * fallback) instead of the raw CharacterProfession.skill row - one of the
 * direct reads identified by the post-F2 redundancy audit - while
 * knowledgePoints (addon-private, see resolveInvestedKnowledgeDisplay)
 * stays completely untouched.
 */

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
    professionId: "prof-alchemy",
    professionKey: "alchemy",
    professionName: "Alchemy",
    professionCategory: "CRAFTING",
    skill: 90,
    knowledgePoints: 42,
    ...overrides
  };
}

describe("ProfessionOverviewWorkService.getOverview - Phase F3 effective public skill", () => {
  it("renders the fresh Blizzard skill instead of the raw addon-captured base skill", async () => {
    const professionAuthorityService = new CharacterProfessionAuthorityService({
      findOne: async () => ({
        payload: {
          professions: [
            {
              professionId: 171,
              professionKey: "alchemy",
              professionName: "Alchemie",
              tierId: 2906,
              tierName: "Midnight Alchemy",
              skill: 97,
              maxSkill: 100
            }
          ]
        },
        fetchedAt: new Date(),
        lastStatus: "SUCCESS",
        lastAttemptAt: new Date(),
        lastError: null
      })
    } as never);

    const service = new ProfessionOverviewWorkService(
      { findAssignments: async () => [assignment()] } as never,
      fakeWeeklyStatusService(),
      fakeTreasureStatusService(),
      fakeCraftLookup(),
      professionAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.rows[0]!.skill.current).toBe(97);
    // addon-private, untouched by the Blizzard-sourced skill above
    expect(overview.rows[0]!.investedKnowledge).toBeDefined();
  });

  it("falls back to the addon's own base skill when no usable Blizzard snapshot exists", async () => {
    const professionAuthorityService = new CharacterProfessionAuthorityService({
      findOne: async () => null
    } as never);

    const service = new ProfessionOverviewWorkService(
      { findAssignments: async () => [assignment()] } as never,
      fakeWeeklyStatusService(),
      fakeTreasureStatusService(),
      fakeCraftLookup(),
      professionAuthorityService
    );

    const overview = await service.getOverview();

    expect(overview.rows[0]!.skill.current).toBe(90);
  });

  it("resolves multiple professions on the same character in a single authority lookup, each keeping its own effective skill", async () => {
    const professionAuthorityService = new CharacterProfessionAuthorityService({
      findOne: async () => ({
        payload: {
          professions: [
            {
              professionId: 171,
              professionKey: "alchemy",
              professionName: "Alchemie",
              tierId: 2906,
              tierName: "Midnight Alchemy",
              skill: 97,
              maxSkill: 100
            }
            // leatherworking deliberately absent from the Blizzard snapshot
          ]
        },
        fetchedAt: new Date(),
        lastStatus: "SUCCESS",
        lastAttemptAt: new Date(),
        lastError: null
      })
    } as never);

    const service = new ProfessionOverviewWorkService(
      {
        findAssignments: async () => [
          assignment({ skill: 90 }),
          assignment({
            professionId: "prof-lw",
            professionKey: "leatherworking",
            professionName: "Leatherworking",
            skill: 60
          })
        ]
      } as never,
      fakeWeeklyStatusService(),
      fakeTreasureStatusService(),
      fakeCraftLookup(),
      professionAuthorityService
    );

    const overview = await service.getOverview();
    const alchemy = overview.rows.find((row) => row.profession.key === "alchemy");
    const leatherworking = overview.rows.find(
      (row) => row.profession.key === "leatherworking"
    );

    expect(alchemy!.skill.current).toBe(97); // Blizzard-covered
    expect(leatherworking!.skill.current).toBe(60); // addon fallback, no Blizzard entry
  });
});
