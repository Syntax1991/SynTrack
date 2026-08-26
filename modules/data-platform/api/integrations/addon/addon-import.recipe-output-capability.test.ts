import { describe, expect, it } from "vitest";
import {
  resolveRecipeEquipmentFamily,
  resolveRecipeEquipmentFamilyFromArmorSubclassKey,
  resolveRecipeOutputSlot
} from "./addon-import.recipe-output-capability.js";

describe("resolveRecipeEquipmentFamilyFromArmorSubclassKey", () => {
  it("resolves each of the four armor families from Blizzard's own enum key spelling", () => {
    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        "Cloth"
      )
    ).toEqual({
      key: "CLOTH",
      name: "Cloth"
    });

    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        "Leather"
      )
    ).toEqual({
      key: "LEATHER",
      name: "Leather"
    });

    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        "Mail"
      )
    ).toEqual({
      key: "MAIL",
      name: "Mail"
    });

    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        "Plate"
      )
    ).toEqual({
      key: "PLATE",
      name: "Plate"
    });
  });

  it("returns null for a non-armor subclass key instead of guessing", () => {
    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        "Shield"
      )
    ).toBeNull();
  });

  it("returns null when no armor subclass key was captured", () => {
    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        null
      )
    ).toBeNull();
  });

  it("does not fuzzy-match a differently-cased or partial key", () => {
    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        "MAIL"
      )
    ).toBeNull();

    expect(
      resolveRecipeEquipmentFamilyFromArmorSubclassKey(
        "Mailx"
      )
    ).toBeNull();
  });
});

describe("resolveRecipeEquipmentFamily (category-name fallback)", () => {
  it("still resolves a family from the recipe category name for legacy data", () => {
    expect(
      resolveRecipeEquipmentFamily(
        "Mail Armor"
      )
    ).toEqual({
      key: "MAIL",
      name: "Mail"
    });
  });
});

describe("resolveRecipeOutputSlot", () => {
  it("resolves the exact Blizzard equip-location enum, unaffected by this change", () => {
    expect(
      resolveRecipeOutputSlot(
        "INVTYPE_WRIST"
      )
    ).toEqual({
      key: "WRIST",
      name: "Wrist"
    });
  });
});
