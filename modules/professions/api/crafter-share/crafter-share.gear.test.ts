import { describe, expect, it } from "vitest";
import {
  getPublicCrafterShareGearSlotName,
  isPublicCrafterSharePlayerGear
} from "./crafter-share.gear.js";

describe("isPublicCrafterSharePlayerGear", () => {
  it("accepts armor, weapons, and jewelry from a verified EQUIPMENT_SLOT", () => {
    expect(
      isPublicCrafterSharePlayerGear([
        { type: "EQUIPMENT_SLOT", name: "Wrist", slotKey: "WRIST" }
      ])
    ).toBe(true);

    expect(
      isPublicCrafterSharePlayerGear([
        { type: "WEAPON_TYPE", name: "Sword", slotKey: null },
        { type: "EQUIPMENT_SLOT", name: "Two-Hand", slotKey: "TWO_HAND" }
      ])
    ).toBe(true);

    expect(
      isPublicCrafterSharePlayerGear([
        { type: "EQUIPMENT_SLOT", name: "Ring", slotKey: "FINGER" }
      ])
    ).toBe(true);
  });

  it("rejects reagents, bolts, and profession tools without guessing from the name", () => {
    expect(
      isPublicCrafterSharePlayerGear([
        {
          type: "PRODUCT_CATEGORY",
          name: "Sunfire Silk Bolt",
          slotKey: null
        }
      ])
    ).toBe(false);

    expect(
      isPublicCrafterSharePlayerGear([
        {
          type: "EQUIPMENT_SLOT",
          name: "Profession Tool",
          slotKey: "PROFESSION_TOOL"
        }
      ])
    ).toBe(false);

    expect(isPublicCrafterSharePlayerGear([])).toBe(false);
  });
});

describe("getPublicCrafterShareGearSlotName", () => {
  it("uses the EQUIPMENT_SLOT name, not a primary reagent category", () => {
    expect(
      getPublicCrafterShareGearSlotName([
        { type: "PRODUCT_CATEGORY", name: "Optional Reagents", slotKey: null },
        { type: "EQUIPMENT_SLOT", name: "Wrist", slotKey: "WRIST" }
      ])
    ).toBe("Wrist");
  });
});
