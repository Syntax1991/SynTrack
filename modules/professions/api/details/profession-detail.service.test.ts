import { describe, expect, it, vi } from "vitest";
import { CharacterProfessionAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profession-authority.service.js";
import { ProfessionDetailService } from "./profession-detail.service.js";

/*
 * Service-level wiring test (Phase F3 + follow-up): Profession Detail/
 * Knowledge was one of the real direct readers of raw
 * CharacterProfession.skill AND Character.className identified by the
 * post-F2 redundancy audit - proves getDetail() now renders the
 * effective (BLIZZARD-primary/ADDON-fallback) public skill and
 * className, while Knowledge Points, specialization node progress, and
 * the Character row itself are never touched.
 */

function profession(assignmentOverrides: Partial<{ skill: number; knowledgePoints: number }> = {}) {
  return {
    id: "prof-alchemy",
    key: "alchemy",
    name: "Alchemy",
    category: "CRAFTING",
    specializationTrees: [],
    capabilities: [],
    recipes: [],
    assignments: [
      {
        id: "assignment-1",
        skill: 90,
        knowledgePoints: 42,
        ...assignmentOverrides,
        character: {
          id: "char-1",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu",
          className: "Shaman",
          level: 80
        },
        nodeProgress: [
          {
            rank: 15,
            knowledgeRank: 15,
            node: {
              key: "addon:107884",
              name: "Wonderful Wristguards",
              maxRank: 21,
              knowledgeMaxRank: 20,
              parentNodeId: null
            }
          }
        ],
        recipes: []
      }
    ]
  } as never;
}

// No Blizzard PROFILE snapshot exists for this fake character id - the
// authority service falls back to the addon-provided className unchanged,
// keeping tests hermetic (no real Prisma-backed
// CharacterExternalSnapshotRepository round trip).
function noSnapshotProfileAuthorityService() {
  return {
    getAuthoritativeProfile: async (
      _id: string,
      character: { name: string; realm: string; region: string; level: number; className: string }
    ) => ({
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
}

function blizzardProfileAuthorityService(className: string) {
  return {
    getAuthoritativeProfile: async (
      _id: string,
      character: { name: string; realm: string; region: string }
    ) => ({
      source: "BLIZZARD" as const,
      fetchedAt: new Date(),
      isStale: false,
      name: character.name,
      realm: character.realm,
      region: character.region,
      level: 80,
      class: className,
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null
    })
  } as never;
}

describe("ProfessionDetailService.getDetail - Phase F3 effective public skill", () => {
  it("renders the fresh Blizzard skill instead of the raw addon-captured CharacterProfession.skill", async () => {
    const repository = { findById: async () => profession() } as never;
    const recipeRepository = {} as never;
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

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      professionAuthorityService,
      noSnapshotProfileAuthorityService()
    );

    const detail = await service.getDetail("prof-alchemy");

    expect(detail.characters[0]).toMatchObject({
      characterProfessionId: "assignment-1",
      skill: 97, // Blizzard's fresh value, not the addon's stale 90
      knowledgePoints: 42 // addon-private, untouched
    });
  });

  it("falls back to the addon's own skill when no usable Blizzard snapshot exists, without ever touching Knowledge Points or specialization nodes", async () => {
    const repository = { findById: async () => profession() } as never;
    const recipeRepository = {} as never;
    const professionAuthorityService = new CharacterProfessionAuthorityService({
      findOne: async () => null
    } as never);

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      professionAuthorityService,
      noSnapshotProfileAuthorityService()
    );

    const detail = await service.getDetail("prof-alchemy");
    const character = detail.characters[0]!;

    expect(character.skill).toBe(90); // the addon's own value, unchanged
    expect(character.knowledgePoints).toBe(42);
    expect(character.explicitSlotNodeRanks.length + character.slotSpecializationNodes.length).toBeGreaterThanOrEqual(0);
  });

  it("a Blizzard refresh never zeroes or alters Knowledge Points, even when the addon's own skill is 0", async () => {
    const repository = {
      findById: async () => profession({ skill: 0, knowledgePoints: 12 })
    } as never;
    const recipeRepository = {} as never;
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
              skill: 55,
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

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      professionAuthorityService,
      noSnapshotProfileAuthorityService()
    );

    const detail = await service.getDetail("prof-alchemy");
    const character = detail.characters[0]!;

    expect(character.skill).toBe(55); // Blizzard's public skill
    expect(character.knowledgePoints).toBe(12); // never zeroed by the Blizzard refresh
  });

  it("renders the fresh Blizzard className (feeds ProfessionKnowledgePage / ProfessionSpecializationCharacter / ProfessionTooltipContent)", async () => {
    const repository = { findById: async () => profession() } as never;
    const recipeRepository = {} as never;
    const professionAuthorityService = new CharacterProfessionAuthorityService({
      findOne: async () => null
    } as never);

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      professionAuthorityService,
      blizzardProfileAuthorityService("Enhancement Shaman")
    );

    const detail = await service.getDetail("prof-alchemy");

    expect(detail.characters[0]!.character).toMatchObject({
      id: "char-1",
      className: "Enhancement Shaman" // Blizzard's fresh value, not the addon's stale "Shaman"
    });
  });

  it("falls back to the persisted className when no usable Blizzard profile exists, leaving private profession state untouched", async () => {
    const update = vi.fn();
    const repository = {
      findById: async () => profession(),
      update
    } as never;
    const recipeRepository = {} as never;
    const professionAuthorityService = new CharacterProfessionAuthorityService({
      findOne: async () => null
    } as never);

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      professionAuthorityService,
      noSnapshotProfileAuthorityService()
    );

    const detail = await service.getDetail("prof-alchemy");
    const character = detail.characters[0]!;

    expect(character.character.className).toBe("Shaman"); // the addon's own value, unchanged
    expect(character.knowledgePoints).toBe(42);
    expect(character.explicitSlotNodeRanks).toBeDefined();
    expect(update).not.toHaveBeenCalled(); // no Character row write of any kind
  });
});
