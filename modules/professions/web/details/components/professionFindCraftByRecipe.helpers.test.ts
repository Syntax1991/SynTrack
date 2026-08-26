import { describe, expect, it } from "vitest";
import type {
  ProfessionRecipeCapability,
  ProfessionRecipeCatalogItem,
  ProfessionRecipeCrafter
} from "../types/professionRecipe.types";
import {
  getFindCraftRecipeSubtitle,
  matchesFindCraftQuery
} from "./professionFindCraftByRecipe.helpers";

function createCapability(
  overrides: Partial<ProfessionRecipeCapability>
): ProfessionRecipeCapability {
  return {
    id: "capability-1",
    key: "test-key",
    name: "Unnamed",
    type: "RECIPE_GROUP",
    slotKey: null,
    description: null,
    isPrimary: false,
    ...overrides
  };
}

function createRecipe(
  overrides: Partial<ProfessionRecipeCatalogItem>
): ProfessionRecipeCatalogItem {
  return {
    id: "recipe-1",
    gameRecipeId: 1,
    name: "Scout's Scaled Bracers",
    expansion: "THE_WAR_WITHIN",
    categoryId: null,
    craftedItemId: null,
    iconUrl: null,
    itemQuality: null,
    itemLevel: null,
    baseDifficulty: null,
    craftStatus: "UNKNOWN",
    capabilities: [],
    crafters: [],

    operationCoverage: {
      totalCrafterCount: 0,
      capturedCrafterCount: 0,
      missingCrafterCount: 0,
      coveragePercent: 0
    },

    ...overrides
  };
}

describe("matchesFindCraftQuery", () => {
  it("defaults to known recipes only when the search is empty", () => {
    const known =
      createRecipe({
        crafters: [
          {} as ProfessionRecipeCrafter
        ]
      });

    const unknown =
      createRecipe({
        crafters: []
      });

    expect(
      matchesFindCraftQuery(
        known,
        ""
      )
    ).toBe(true);

    expect(
      matchesFindCraftQuery(
        unknown,
        ""
      )
    ).toBe(false);
  });

  it("searches every recipe by name once a query is typed, known or not", () => {
    const unknown =
      createRecipe({
        name: "Scout's Scaled Bracers",
        crafters: []
      });

    expect(
      matchesFindCraftQuery(
        unknown,
        "scaled bracers"
      )
    ).toBe(true);

    expect(
      matchesFindCraftQuery(
        unknown,
        "wristguards"
      )
    ).toBe(false);
  });
});

describe("getFindCraftRecipeSubtitle", () => {
  it("combines family and slot when both are proven", () => {
    const recipe =
      createRecipe({
        capabilities: [
          createCapability({
            name: "Mail",
            type: "EQUIPMENT_FAMILY"
          }),
          createCapability({
            name: "Wrist",
            type: "EQUIPMENT_SLOT",
            slotKey: "WRIST"
          })
        ]
      });

    expect(
      getFindCraftRecipeSubtitle(
        recipe
      )
    ).toBe("Mail · Wrist");
  });

  it("falls back to a neutral label when neither family nor slot is proven", () => {
    const recipe =
      createRecipe({
        capabilities: [
          createCapability({
            name: "Reagents",
            type: "RECIPE_GROUP"
          })
        ]
      });

    expect(
      getFindCraftRecipeSubtitle(
        recipe
      )
    ).toBe("Recipe");
  });
});
