import { describe, expect, it } from "vitest";
import {
  createAssignment,
  createLearnedRecipe,
  familyCapability,
  slotCapability
} from "./profession-equipment-coverage.mapper.fixtures.js";
import { mapProfessionEquipmentCoverage } from "./profession-equipment-coverage.mapper.js";

describe("mapProfessionEquipmentCoverage edge cases", () => {
  it("produces no claim when a recipe has a family capability but no slot capability", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          familyCapability("Leather")
        ])
      ]);

    expect(
      mapProfessionEquipmentCoverage(
        assignment
      )
    ).toEqual([]);
  });

  it("produces no claim when a recipe has a slot capability but no family capability", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          slotCapability("WRIST", "Wrist")
        ])
      ]);

    expect(
      mapProfessionEquipmentCoverage(
        assignment
      )
    ).toEqual([]);
  });

  it("produces no claim when a recipe has no capability rows at all (absent capture)", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([])
      ]);

    expect(
      mapProfessionEquipmentCoverage(
        assignment
      )
    ).toEqual([]);
  });

  it("ignores specialization node progress entirely, even when it looks slot-shaped", () => {
    const assignment =
      createAssignment([]);

    (
      assignment.nodeProgress as unknown[]
    ).push({
      rank: 3,
      knowledgeRank: 3,
      unlockRank: 0,
      source: "ADDON",

      node: {
        name: "Wonderful Wristguards",
        maxRank: 3,
        knowledgeMaxRank: 3
      }
    });

    expect(
      mapProfessionEquipmentCoverage(
        assignment
      )
    ).toEqual([]);
  });

  it("reproduces the Synblast acceptance case: both Mail Wrist and Leather Wrist are learned", () => {
    const assignment =
      createAssignment([
        createLearnedRecipe([
          familyCapability("Mail"),
          slotCapability("WRIST", "Wrist")
        ]),
        createLearnedRecipe([
          familyCapability("Leather"),
          slotCapability("WRIST", "Wrist")
        ])
      ]);

    const claimedPairs =
      mapProfessionEquipmentCoverage(
        assignment
      ).map(
        (entry) =>
          `${entry.familyName} ${entry.slotName}`
      );

    expect(claimedPairs).toEqual([
      "Leather Wrist",
      "Mail Wrist"
    ]);
  });
});
