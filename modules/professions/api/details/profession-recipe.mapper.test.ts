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
});
