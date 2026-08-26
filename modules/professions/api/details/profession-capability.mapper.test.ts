import { describe, expect, it } from "vitest";
import { mapProfessionCapabilities } from "./profession-capability.mapper.js";
import {
  createAssignment,
  createCapability,
  createLearnedRecipe,
  weaponTypeCapability
} from "./profession-equipment-coverage.mapper.fixtures.js";

describe("mapProfessionCapabilities", () => {
  it("excludes WEAPON_TYPE from the general capability list, the same way EQUIPMENT_FAMILY is excluded", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          weaponTypeCapability("Sword"),
          createCapability({
            name: "Weapons",
            type: "RECIPE_GROUP"
          })
        ])
      ]);

    const capabilities =
      mapProfessionCapabilities(
        assignment as never
      );

    expect(
      capabilities.map(
        (capability) => capability.type
      )
    ).toEqual(["RECIPE_GROUP"]);

    expect(
      capabilities.some(
        (capability) =>
          capability.type === "WEAPON_TYPE"
      )
    ).toBe(false);
  });
});
