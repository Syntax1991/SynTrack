import { describe, expect, it } from "vitest";
import type {
  ProfessionRecipeCapability,
  ProfessionRecipeCatalogItem
} from "../types/professionRecipe.types";
import {
  getProfessionRecipeFamilyName,
  getProfessionRecipeProductLabel,
  getProfessionRecipeSlotName
} from "./professionRecipePresentation";

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
  name: string,
  capabilities: ProfessionRecipeCapability[]
): ProfessionRecipeCatalogItem {
  return {
    id: "recipe-1",
    gameRecipeId: 1,
    name,
    expansion: "THE_WAR_WITHIN",
    categoryId: null,
    craftedItemId: null,
    iconUrl: null,
    itemQuality: null,
    itemLevel: null,
    baseDifficulty: null,
    craftStatus: "UNKNOWN",
    capabilities,
    crafters: [],

    operationCoverage: {
      totalCrafterCount: 0,
      capturedCrafterCount: 0,
      missingCrafterCount: 0,
      coveragePercent: 0
    }
  };
}

describe("getProfessionRecipeFamilyName", () => {
  it("returns the verified EQUIPMENT_FAMILY capability name", () => {
    const recipe =
      createRecipe(
        "Scout's Scaled Bracers",
        [
          createCapability({
            name: "Mail",
            type: "EQUIPMENT_FAMILY"
          })
        ]
      );

    expect(
      getProfessionRecipeFamilyName(
        recipe
      )
    ).toBe("Mail");
  });

  it("returns null instead of guessing from the recipe name when no capability is present", () => {
    const recipe =
      createRecipe(
        "Scout's Scaled Bracers",
        []
      );

    expect(
      getProfessionRecipeFamilyName(
        recipe
      )
    ).toBeNull();
  });
});

describe("getProfessionRecipeSlotName", () => {
  it("returns the verified EQUIPMENT_SLOT capability name", () => {
    const recipe =
      createRecipe(
        "Smuggler's Leather Wristbands",
        [
          createCapability({
            name: "Wrist",
            type: "EQUIPMENT_SLOT",
            slotKey: "WRIST"
          })
        ]
      );

    expect(
      getProfessionRecipeSlotName(
        recipe
      )
    ).toBe("Wrist");
  });

  it("does not infer a slot from a name that merely looks slot-shaped", () => {
    const recipe =
      createRecipe(
        "Smuggler's Reinforced Binding",
        []
      );

    expect(
      getProfessionRecipeSlotName(
        recipe
      )
    ).toBeNull();
  });
});

describe("getProfessionRecipeProductLabel", () => {
  it("combines a verified family and slot into a joint label", () => {
    const recipe =
      createRecipe(
        "Scout's Scaled Bracers",
        [
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
      );

    expect(
      getProfessionRecipeProductLabel(
        recipe
      )
    ).toBe("Mail · Wrist");
  });

  it("falls back to the recipe group, never a guessed family/slot label, when capability data is absent", () => {
    const recipe =
      createRecipe(
        "Silvermoon Weapon Wrap",
        [
          createCapability({
            name: "Reagents",
            type: "RECIPE_GROUP"
          })
        ]
      );

    expect(
      getProfessionRecipeProductLabel(
        recipe
      )
    ).toBe("Reagents");
  });
});
