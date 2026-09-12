import { describe, expect, it } from "vitest";
import { mapProfessionRecipeCatalog } from "./profession-recipe.mapper.js";

type CatalogRecord =
  Parameters<
    typeof mapProfessionRecipeCatalog
  >[0];

function createRecipe(
  overrides: {
    id: string;
    name: string;
    craftedItemId: number | null;
    iconUrl: string | null;
    itemQuality?: string | null;
    itemLevel?: number | null;
  }
) {
  return {
    id: overrides.id,
    gameRecipeId: 1,
    name: overrides.name,
    expansion: "MIDNIGHT",
    categoryId: null,
    craftedItemId:
      overrides.craftedItemId,
    iconUrl: overrides.iconUrl,
    itemQuality:
      overrides.itemQuality ?? null,
    itemLevel:
      overrides.itemLevel ?? null,
    baseDifficulty: null,
    capabilities: [],
    characters: []
  };
}

function createCatalog(
  recipes: ReturnType<
    typeof createRecipe
  >[]
): CatalogRecord {
  return {
    id: "profession-1",
    key: "leatherworking",
    name: "Leatherworking",
    recipes
  } as CatalogRecord;
}

describe("mapProfessionRecipeCatalog", () => {
  it("carries a recipe's craftedItemId and resolved iconUrl through to the catalog item untouched", () => {
    const catalog =
      createCatalog([
        createRecipe({
          id: "recipe-1",
          name: "Scout's Scaled Bracers",
          craftedItemId: 123456,
          iconUrl:
            "https://render.worldofwarcraft.com/icons/56/inv_scouts_scaled_bracers.jpg"
        })
      ]);

    const result =
      mapProfessionRecipeCatalog(
        catalog
      );

    expect(
      result.items
    ).toEqual([
      expect.objectContaining({
        name:
          "Scout's Scaled Bracers",
        craftedItemId: 123456,
        iconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_scouts_scaled_bracers.jpg"
      })
    ]);
  });

  it("carries a recipe's resolved itemQuality and itemLevel through, alongside the same craftedItemId/iconUrl", () => {
    const catalog =
      createCatalog([
        createRecipe({
          id: "recipe-epic",
          name: "Scout's Scaled Bracers",
          craftedItemId: 244589,
          iconUrl:
            "https://render.worldofwarcraft.com/eu/icons/56/7082302.jpg",
          itemQuality: "EPIC",
          itemLevel: 220
        })
      ]);

    const result =
      mapProfessionRecipeCatalog(
        catalog
      );

    expect(
      result.items
    ).toEqual([
      expect.objectContaining({
        craftedItemId: 244589,
        iconUrl:
          "https://render.worldofwarcraft.com/eu/icons/56/7082302.jpg",
        itemQuality: "EPIC",
        itemLevel: 220
      })
    ]);
  });

  it("carries a null itemQuality/itemLevel through as null for a recipe SynTrack has not resolved yet, never guessing Rare/Epic", () => {
    const catalog =
      createCatalog([
        createRecipe({
          id: "recipe-unresolved",
          name: "Some Reagent Recipe",
          craftedItemId: null,
          iconUrl: null
        })
      ]);

    const result =
      mapProfessionRecipeCatalog(
        catalog
      );

    expect(
      result.items[0]
    ).toEqual(
      expect.objectContaining({
        itemQuality: null,
        itemLevel: null
      })
    );
  });

  it("carries a null iconUrl through as null when SynTrack has not resolved one yet, never inventing one", () => {
    const catalog =
      createCatalog([
        createRecipe({
          id: "recipe-2",
          name: "Farstrider's Scouting Vest",
          craftedItemId: 654321,
          iconUrl: null
        })
      ]);

    const result =
      mapProfessionRecipeCatalog(
        catalog
      );

    expect(
      result.items[0]
    ).toEqual(
      expect.objectContaining({
        craftedItemId: 654321,
        iconUrl: null
      })
    );
  });

  it("carries a null craftedItemId through for a recipe with no known output item (e.g. a reagent), never guessing one", () => {
    const catalog =
      createCatalog([
        createRecipe({
          id: "recipe-3",
          name: "Some Reagent Recipe",
          craftedItemId: null,
          iconUrl: null
        })
      ]);

    const result =
      mapProfessionRecipeCatalog(
        catalog
      );

    expect(
      result.items[0]
    ).toEqual(
      expect.objectContaining({
        craftedItemId: null,
        iconUrl: null
      })
    );
  });

  describe("effective public skill (Phase F1 corrective review, Section 4)", () => {
    function createCrafterRelation(overrides: {
      characterId: string;
      skill: number;
      skillModifier?: number;
      knowledgePoints?: number;
    }) {
      return {
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
          skill: overrides.skill,
          skillModifier: overrides.skillModifier ?? 0,
          knowledgePoints: overrides.knowledgePoints ?? 66,
          character: {
            id: overrides.characterId,
            name: "Synblast",
            realm: "Antonidas",
            className: "Shaman",
            level: 90
          }
        }
      };
    }

    function createEligibilityCatalog(
      baseDifficulty: number | null,
      characters: ReturnType<typeof createCrafterRelation>[]
    ): CatalogRecord {
      return {
        id: "profession-1",
        key: "leatherworking",
        name: "Leatherworking",
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
            baseDifficulty,
            capabilities: [],
            characters
          }
        ]
      } as unknown as CatalogRecord;
    }

    it("changes recipe eligibility (baselineStatus) when the Blizzard-authoritative public skill differs from the addon's raw skill", () => {
      const catalog = createEligibilityCatalog(100, [
        createCrafterRelation({ characterId: "char-1", skill: 90 })
      ]);

      // Addon-only: skill 90 < baseDifficulty 100 -> RECIPE_BONUS_REQUIRED.
      const withoutEffectiveSkill = mapProfessionRecipeCatalog(catalog);
      expect(withoutEffectiveSkill.items[0]!.crafters[0]!.baselineStatus).toBe(
        "RECIPE_BONUS_REQUIRED"
      );

      // Blizzard-authoritative public skill (105) makes the recipe eligible.
      const withEffectiveSkill = mapProfessionRecipeCatalog(
        catalog,
        new Map([["char-1", 105]])
      );
      const crafter = withEffectiveSkill.items[0]!.crafters[0]!;
      expect(crafter.baselineStatus).toBe("BASE_SKILL_SUFFICIENT");
      expect(crafter.skill).toBe(105);
      expect(crafter.effectiveSkill).toBe(105);
    });

    it("still adds the addon-private skillModifier on top of the effective public skill", () => {
      const catalog = createEligibilityCatalog(null, [
        createCrafterRelation({ characterId: "char-1", skill: 90, skillModifier: 10 })
      ]);

      const result = mapProfessionRecipeCatalog(catalog, new Map([["char-1", 105]]));
      const crafter = result.items[0]!.crafters[0]!;

      expect(crafter.skill).toBe(105); // public skill only
      expect(crafter.skillModifier).toBe(10); // addon-private, unaffected
      expect(crafter.effectiveSkill).toBe(115); // 105 + 10
    });

    it("leaves knowledgePoints addon-owned even when the public skill is overridden", () => {
      const catalog = createEligibilityCatalog(null, [
        createCrafterRelation({ characterId: "char-1", skill: 90, knowledgePoints: 66 })
      ]);

      const result = mapProfessionRecipeCatalog(catalog, new Map([["char-1", 105]]));

      expect(result.items[0]!.crafters[0]!.knowledgePoints).toBe(66);
    });

    it("falls back to the addon's raw skill when no effective-skill entry exists for a character", () => {
      const catalog = createEligibilityCatalog(null, [
        createCrafterRelation({ characterId: "char-1", skill: 90 })
      ]);

      const result = mapProfessionRecipeCatalog(catalog, new Map());

      expect(result.items[0]!.crafters[0]!.skill).toBe(90);
    });

    it("Phase F3 follow-up: renders the fresh Blizzard className instead of the raw addon-captured Character row (ProfessionRecipeCard / ProfessionRecipeDetailPanel / Find Craft)", () => {
      const catalog = createEligibilityCatalog(null, [
        createCrafterRelation({ characterId: "char-1", skill: 90 })
      ]);

      const result = mapProfessionRecipeCatalog(
        catalog,
        new Map(),
        new Map([["char-1", "Enhancement Shaman"]])
      );

      expect(result.items[0]!.crafters[0]!.className).toBe("Enhancement Shaman");
    });

    it("falls back to the persisted className when no usable Blizzard profile exists", () => {
      const catalog = createEligibilityCatalog(null, [
        createCrafterRelation({ characterId: "char-1", skill: 90 })
      ]);

      const result = mapProfessionRecipeCatalog(catalog, new Map(), new Map());

      expect(result.items[0]!.crafters[0]!.className).toBe("Shaman");
    });
  });
});
