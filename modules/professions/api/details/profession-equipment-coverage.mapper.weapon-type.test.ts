import { describe, expect, it } from "vitest";
import { mapProfessionEquipmentCoverage } from "./profession-equipment-coverage.mapper.js";
import {
  createAssignment,
  createLearnedRecipe,
  slotCapability,
  weaponTypeCapability
} from "./profession-equipment-coverage.mapper.fixtures.js";

describe("mapProfessionEquipmentCoverage - WEAPON_TYPE", () => {
  it("combines a WEAPON_TYPE and EQUIPMENT_SLOT capability from the same recipe into one craftable entry", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          weaponTypeCapability("Sword"),
          slotCapability("TWO_HAND", "Two-Hand")
        ])
      ]);

    const coverage =
      mapProfessionEquipmentCoverage(
        assignment
      );

    expect(coverage).toEqual([
      expect.objectContaining({
        familyName: "Sword",
        slotKey: "TWO_HAND",
        slotName: "Two-Hand"
      })
    ]);
  });

  it("never combines a WEAPON_TYPE from one recipe with an EQUIPMENT_SLOT from a different recipe", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          weaponTypeCapability("Sword")
        ]),
        createLearnedRecipe([
          slotCapability("TWO_HAND", "Two-Hand")
        ])
      ]);

    const coverage =
      mapProfessionEquipmentCoverage(
        assignment
      );

    expect(coverage).toEqual([]);
  });

  it("keeps Axe and Sword as distinct craftable entries even when both share the Two-Hand slot", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          weaponTypeCapability("Sword"),
          slotCapability("TWO_HAND", "Two-Hand")
        ]),
        createLearnedRecipe([
          weaponTypeCapability("Axe"),
          slotCapability("TWO_HAND", "Two-Hand")
        ])
      ]);

    const coverage =
      mapProfessionEquipmentCoverage(
        assignment
      );

    expect(
      coverage.map((entry) => entry.familyName).sort()
    ).toEqual(["Axe", "Sword"]);
  });
});
