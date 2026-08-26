import { describe, expect, it } from "vitest";
import {
  createAssignment,
  createLearnedRecipe,
  familyCapability,
  slotCapability
} from "./profession-equipment-coverage.mapper.fixtures.js";
import { mapProfessionEquipmentCoverage } from "./profession-equipment-coverage.mapper.js";

describe("mapProfessionEquipmentCoverage", () => {
  it("resolves Leather Wrist from a recipe carrying both capabilities", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          familyCapability("Leather"),
          slotCapability("WRIST", "Wrist")
        ])
      ]);

    const result =
      mapProfessionEquipmentCoverage(
        assignment
      );

    expect(result).toEqual([
      expect.objectContaining({
        familyName: "Leather",
        slotKey: "WRIST",
        slotName: "Wrist",
        recipeCount: 1
      })
    ]);
  });

  it("resolves Mail Wrist independently from Leather Wrist", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          familyCapability("Mail"),
          slotCapability("WRIST", "Wrist")
        ])
      ]);

    const result =
      mapProfessionEquipmentCoverage(
        assignment
      );

    expect(result).toEqual([
      expect.objectContaining({
        familyName: "Mail",
        slotKey: "WRIST",
        slotName: "Wrist"
      })
    ]);
  });

  it("does not produce Mail Wrist from a Mail Chest recipe plus a separate Leather Wrist recipe", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          familyCapability("Mail"),
          slotCapability("CHEST", "Chest")
        ]),
        createLearnedRecipe([
          familyCapability("Leather"),
          slotCapability("WRIST", "Wrist")
        ])
      ]);

    const result =
      mapProfessionEquipmentCoverage(
        assignment
      );

    const claimedPairs =
      result.map(
        (entry) =>
          `${entry.familyName} ${entry.slotName}`
      );

    expect(claimedPairs).toEqual(
      expect.arrayContaining([
        "Mail Chest",
        "Leather Wrist"
      ])
    );

    expect(claimedPairs).not.toContain(
      "Mail Wrist"
    );

    expect(claimedPairs).not.toContain(
      "Leather Chest"
    );

    expect(claimedPairs).toHaveLength(2);
  });

  it("keeps the same slot separate across Leather, Mail, Plate and Cloth", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          familyCapability("Leather"),
          slotCapability("WRIST", "Wrist")
        ]),
        createLearnedRecipe([
          familyCapability("Mail"),
          slotCapability("WRIST", "Wrist")
        ]),
        createLearnedRecipe([
          familyCapability("Plate"),
          slotCapability("WRIST", "Wrist")
        ]),
        createLearnedRecipe([
          familyCapability("Cloth"),
          slotCapability("WRIST", "Wrist")
        ])
      ]);

    const result =
      mapProfessionEquipmentCoverage(
        assignment
      );

    expect(
      result.map(
        (entry) => entry.familyName
      )
    ).toEqual([
      "Cloth",
      "Leather",
      "Mail",
      "Plate"
    ]);
  });

  it("counts multiple recipes that resolve to the same family+slot pair", () => {
    /*
     * CraftCapability rows are upserted per profession+expansion+key, so in
     * real data the SAME "Leather" and "Wrist" capability rows are shared
     * across every Leatherworking recipe that produces a leather wrist
     * item. The fixture reuses one capability pair across two recipes to
     * mirror that, rather than minting a distinct capability per recipe.
     */
    const leather =
      familyCapability("Leather");

    const wrist =
      slotCapability("WRIST", "Wrist");

    const assignment =
      createAssignment([
        createLearnedRecipe([
          leather,
          wrist
        ]),
        createLearnedRecipe([
          leather,
          wrist
        ])
      ]);

    const result =
      mapProfessionEquipmentCoverage(
        assignment
      );

    expect(result).toEqual([
      expect.objectContaining({
        familyName: "Leather",
        slotKey: "WRIST",
        recipeCount: 2
      })
    ]);
  });
});
