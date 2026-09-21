import { describe, expect, it } from "vitest";
import {
  getPublicCraftStatusLabel,
  getPublicCrafterShareCraftLabel
} from "./crafterSharePresentation";
import type { PublicCrafterShareRecipe } from "./types/crafterShare.types";

function recipe(
  overrides: Partial<PublicCrafterShareRecipe> = {}
): PublicCrafterShareRecipe {
  return {
    name: "Scout's Scaled Bracers",
    itemQuality: "EPIC",
    itemLevel: 197,
    iconUrl: null,
    resultQuality: 3,
    craftStatus: "NOT_SAFE",
    slotName: "Wrist",
    ...overrides
  };
}

describe("getPublicCrafterShareCraftLabel", () => {
  it("leads with the captured quality they can craft, not cannot-reach", () => {
    expect(getPublicCrafterShareCraftLabel(recipe())).toBe("Q3 · not max");
    expect(
      getPublicCrafterShareCraftLabel(
        recipe({ craftStatus: "SAFE", resultQuality: 5 })
      )
    ).toBe("Q5");
    expect(
      getPublicCrafterShareCraftLabel(
        recipe({ craftStatus: "CONCENTRATION", resultQuality: 5 })
      )
    ).toBe("Q5 · Conc");
  });

  it("does not claim they cannot craft when no quality was captured", () => {
    expect(
      getPublicCrafterShareCraftLabel(
        recipe({ resultQuality: null, craftStatus: "NOT_SAFE" })
      )
    ).toBe("Not max quality");
  });
});

describe("getPublicCraftStatusLabel", () => {
  it("labels not-safe as not max quality rather than cannot craft", () => {
    expect(getPublicCraftStatusLabel("NOT_SAFE")).toBe("Not max quality");
  });
});
