import { describe, expect, it } from "vitest";
import {
  computeBrowseGroupOptions,
  computeBrowseSlotOptions,
  getRecipesForFamilySlot
} from "./professionFindCraftBrowse.helpers";
import {
  createCapability,
  createCrafter,
  createRecipe,
  leatherWristRecipe,
  mailWristRecipe
} from "./professionFindCraftBrowse.fixtures";

describe("computeBrowseGroupOptions", () => {
  it("counts only known recipes (at least one crafter), grouped by family/category", () => {
    const known =
      mailWristRecipe("Known Bracers", [
        createCrafter({})
      ]);

    const unknown =
      leatherWristRecipe(
        "Unknown Wristbands",
        []
      );

    const options =
      computeBrowseGroupOptions([
        known,
        unknown
      ]);

    expect(options).toEqual([
      expect.objectContaining({
        name: "Mail",
        recipeCount: 1,
        isArmorFamily: true
      })
    ]);
  });
});

describe("computeBrowseSlotOptions", () => {
  it("Browse Mail returns only Mail slots, distinct from Leather", () => {
    const mailWrist =
      mailWristRecipe("Mail Bracers", [
        createCrafter({})
      ]);

    const leatherWrist =
      leatherWristRecipe(
        "Leather Bracers",
        [createCrafter({})]
      );

    const mailSlots =
      computeBrowseSlotOptions(
        [mailWrist, leatherWrist],
        "Mail"
      );

    expect(mailSlots).toEqual([
      expect.objectContaining({
        slotKey: "WRIST",
        recipeCount: 1
      })
    ]);

    const leatherSlots =
      computeBrowseSlotOptions(
        [mailWrist, leatherWrist],
        "Leather"
      );

    expect(leatherSlots).toEqual([
      expect.objectContaining({
        slotKey: "WRIST",
        recipeCount: 1
      })
    ]);
  });
});

describe("getRecipesForFamilySlot", () => {
  it("Mail -> Wrist returns only Mail+Wrist recipes, never Leather+Wrist", () => {
    const mailWrist =
      mailWristRecipe(
        "Scout's Scaled Bracers",
        [createCrafter({})]
      );

    const leatherWrist =
      leatherWristRecipe(
        "Smuggler's Leather Wristbands",
        [createCrafter({})]
      );

    const mailChest =
      createRecipe(
        "Scout's Scaled Vest",
        [
          createCapability({
            name: "Mail",
            type: "EQUIPMENT_FAMILY"
          }),
          createCapability({
            name: "Chest",
            type: "EQUIPMENT_SLOT",
            slotKey: "CHEST"
          })
        ],
        [createCrafter({})]
      );

    const result =
      getRecipesForFamilySlot(
        [
          mailWrist,
          leatherWrist,
          mailChest
        ],
        "Mail",
        "WRIST"
      );

    expect(
      result.map(
        (recipe) => recipe.name
      )
    ).toEqual([
      "Scout's Scaled Bracers"
    ]);
  });
});
