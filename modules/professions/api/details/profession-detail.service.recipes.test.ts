import { describe, expect, it } from "vitest";
import { CharacterProfessionAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profession-authority.service.js";
import { ProfessionDetailService } from "./profession-detail.service.js";

/*
 * Service-level wiring test (Phase F3 final closure pass): the last
 * remaining raw Character.className read was ProfessionDetailService
 * .getRecipes() - it already resolved effective public skill (Phase F1)
 * but built each ProfessionRecipeCrafter's className straight from the
 * raw Character row, feeding ProfessionRecipeCard.tsx,
 * ProfessionRecipeDetailPanel.tsx, and (transitively, via the shared
 * ProfessionRecipeCrafter type) ProfessionFindCraftCandidateRow.tsx and
 * ProfessionFindCraftBrowseCandidateRow.tsx. Split out of
 * profession-detail.service.test.ts (getDetail() coverage) to stay
 * under the 350-line architecture cap.
 */

function recipeProfession(characterOverrides: Partial<{ skill: number; className: string; knowledgePoints: number }>[] = [{}]) {
  return {
    id: "prof-alchemy",
    key: "alchemy",
    name: "Alchemy",
    recipes: [
      {
        id: "recipe-1",
        gameRecipeId: 1,
        name: "Item",
        expansion: "MIDNIGHT",
        categoryId: null,
        craftedItemId: 1,
        iconUrl: null,
        itemQuality: null,
        itemLevel: null,
        baseDifficulty: null,
        capabilities: [],
        characters: characterOverrides.map((overrides, index) => ({
          source: "ADDON",
          lastSyncedAt: null,
          baseSkill: null,
          bonusSkill: null,
          effectiveSkill: null,
          craftingQuality: null,
          craftingQualityId: null,
          guaranteedCraftingQualityId: null,
          lowerSkillThreshold: null,
          upperSkillThreshold: null,
          concentrationCost: null,
          concentrationCurrencyId: null,
          ingenuityRefund: null,
          quality: null,
          operationMetricsJson: null,
          reagentSimulationJson: null,
          operationCapturedAt: null,
          operationCaptureVersion: null,
          operationScopeVersion: null,
          characterProfession: {
            skill: overrides.skill ?? 90,
            skillModifier: 0,
            knowledgePoints: overrides.knowledgePoints ?? 66,
            character: {
              id: `char-${index + 1}`,
              name: `Character${index + 1}`,
              realm: "Antonidas",
              region: "eu",
              className: overrides.className ?? "Shaman",
              level: 80
            }
          }
        }))
      }
    ]
  } as never;
}

function noSnapshotAuthorityServices() {
  return {
    professionAuthorityService: new CharacterProfessionAuthorityService({
      findOne: async () => null
    } as never),
    profileAuthorityService: {
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
    } as never
  };
}

describe("ProfessionDetailService.getRecipes - Phase F3 final closure effective className", () => {
  it("renders the fresh Blizzard className for the crafter DTO (feeds ProfessionRecipeCard / ProfessionRecipeDetailPanel / Find Craft)", async () => {
    const recipeRepository = {
      findByProfessionId: async () => recipeProfession()
    } as never;
    const repository = {} as never;
    const profileAuthorityService = {
      getAuthoritativeProfile: async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Character1",
        realm: "Antonidas",
        region: "eu",
        level: 80,
        class: "Enhancement Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      })
    } as never;

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      new CharacterProfessionAuthorityService({ findOne: async () => null } as never),
      profileAuthorityService
    );

    const catalog = await service.getRecipes("prof-alchemy");

    expect(catalog.items[0]!.crafters[0]!.className).toBe("Enhancement Shaman");
  });

  it("falls back to the persisted className when no usable Blizzard profile exists, without touching skillModifier or knowledgePoints", async () => {
    const { professionAuthorityService, profileAuthorityService } = noSnapshotAuthorityServices();
    const recipeRepository = {
      findByProfessionId: async () => recipeProfession([{ className: "Shaman", knowledgePoints: 66 }])
    } as never;
    const repository = {} as never;

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      professionAuthorityService,
      profileAuthorityService
    );

    const catalog = await service.getRecipes("prof-alchemy");
    const crafter = catalog.items[0]!.crafters[0]!;

    expect(crafter.className).toBe("Shaman");
    expect(crafter.knowledgePoints).toBe(66);
  });

  it("resolves one effective identity per distinct character across multiple crafters, not per crafter", async () => {
    let callCount = 0;
    const profileAuthorityService = {
      getAuthoritativeProfile: async (_id: string, character: { name: string }) => {
        callCount += 1;

        return {
          source: "BLIZZARD" as const,
          fetchedAt: new Date(),
          isStale: false,
          name: character.name,
          realm: "Antonidas",
          region: "eu",
          level: 80,
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
    const recipeRepository = {
      findByProfessionId: async () =>
        recipeProfession([
          { className: "Shaman" },
          { className: "Mage" }
        ])
    } as never;
    const repository = {} as never;

    const service = new ProfessionDetailService(
      repository,
      recipeRepository,
      new CharacterProfessionAuthorityService({ findOne: async () => null } as never),
      profileAuthorityService
    );

    const catalog = await service.getRecipes("prof-alchemy");

    expect(catalog.items[0]!.crafters).toHaveLength(2);
    expect(callCount).toBe(2); // one lookup per distinct character (char-1, char-2), not re-resolved
  });
});
