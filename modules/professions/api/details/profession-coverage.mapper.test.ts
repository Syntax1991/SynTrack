import { describe, expect, it } from "vitest";
import { mapProfessionCharacterCoverage } from "./profession-coverage.mapper.js";
import {
  createAssignment,
  createCapability,
  createLearnedRecipe
} from "./profession-coverage.mapper.fixtures.js";

describe("mapProfessionCharacterCoverage", () => {
  it("never derives craftableEquipment from specialization node progress", () => {
    const assignment =
      createAssignment({
        nodeProgressCount: 12
      });

    const coverage =
      mapProfessionCharacterCoverage(
        assignment,
        true,
        true,
        true,
        false,
        new Map(),
        "leatherworking",
        assignment.skill,
        assignment.character.className
      );

    expect(
      coverage.craftableEquipment
    ).toEqual([]);
  });

  it("reports PARTIAL when specialization points are invested but nothing else is tracked", () => {
    const assignment =
      createAssignment({
        nodeProgressCount: 3
      });

    const coverage =
      mapProfessionCharacterCoverage(
        assignment,
        true,
        true,
        true,
        false,
        new Map(),
        "leatherworking",
        assignment.skill,
        assignment.character.className
      );

    expect(coverage.dataStatus).toBe(
      "PARTIAL"
    );
  });

  it("reports UNTRACKED when nothing is tracked and no specialization points exist", () => {
    const assignment =
      createAssignment();

    const coverage =
      mapProfessionCharacterCoverage(
        assignment,
        true,
        true,
        true,
        false,
        new Map(),
        "leatherworking",
        assignment.skill,
        assignment.character.className
      );

    expect(coverage.dataStatus).toBe(
      "UNTRACKED"
    );
  });

  it("reports TRACKED once a concrete craftable equipment pair is proven, regardless of specialization", () => {
    const assignment =
      createAssignment({
        recipes: [
          createLearnedRecipe([
            createCapability({
              name: "Leather",
              type: "EQUIPMENT_FAMILY"
            }),
            createCapability({
              name: "Wrist",
              type: "EQUIPMENT_SLOT",
              slotKey: "WRIST"
            })
          ])
        ]
      });

    const coverage =
      mapProfessionCharacterCoverage(
        assignment,
        true,
        true,
        true,
        false,
        new Map(),
        "leatherworking",
        assignment.skill,
        assignment.character.className
      );

    expect(coverage.dataStatus).toBe(
      "TRACKED"
    );

    expect(
      coverage.craftableEquipment
    ).toEqual([
      expect.objectContaining({
        familyName: "Leather",
        slotName: "Wrist"
      })
    ]);
  });

  it("never exposes EQUIPMENT_FAMILY or EQUIPMENT_SLOT as independent capability rows", () => {
    const assignment =
      createAssignment({
        recipes: [
          createLearnedRecipe([
            createCapability({
              name: "Leather",
              type: "EQUIPMENT_FAMILY"
            }),
            createCapability({
              name: "Wrist",
              type: "EQUIPMENT_SLOT",
              slotKey: "WRIST"
            }),
            createCapability({
              name: "Reagents",
              type: "RECIPE_GROUP"
            })
          ])
        ]
      });

    const coverage =
      mapProfessionCharacterCoverage(
        assignment,
        true,
        true,
        true,
        false,
        new Map(),
        "leatherworking",
        assignment.skill,
        assignment.character.className
      );

    const capabilityTypes =
      coverage.capabilities.map(
        (capability) =>
          capability.type
      );

    expect(capabilityTypes).not.toContain(
      "EQUIPMENT_FAMILY"
    );

    expect(capabilityTypes).not.toContain(
      "EQUIPMENT_SLOT"
    );

    expect(capabilityTypes).toEqual([
      "RECIPE_GROUP"
    ]);
  });

  it("Synblast acceptance case: knows a Mail Wrist recipe but is only specialized for Leather Wrist", () => {
    const assignment =
      createAssignment({
        recipes: [
          createLearnedRecipe([
            createCapability({
              name: "Mail",
              type: "EQUIPMENT_FAMILY"
            }),
            createCapability({
              name: "Wrist",
              type: "EQUIPMENT_SLOT",
              slotKey: "WRIST"
            })
          ])
        ]
      });

    (
      assignment.nodeProgress as unknown[]
    ).push({
      rank: 16,
      knowledgeRank: 15,

      node: {
        key: "addon:107884",
        name: "Wonderful Wristguards",
        maxRank: 21,
        knowledgeMaxRank: 20
      }
    });

    const coverage =
      mapProfessionCharacterCoverage(
        assignment,
        true,
        true,
        true,
        false,
        new Map(),
        "leatherworking",
        assignment.skill,
        assignment.character.className
      );

    expect(
      coverage.craftableEquipment
    ).toEqual([
      expect.objectContaining({
        familyName: "Mail",
        slotName: "Wrist"
      })
    ]);

    expect(
      coverage.specializationEquipment
    ).toEqual([
      expect.objectContaining({
        familyName: "Leather",
        slotKey: "WRIST",
        nodeName: "Wonderful Wristguards",
        rank: 15
      })
    ]);

    expect(
      coverage.specializationEquipment.some(
        (claim) =>
          claim.familyName === "Mail"
      )
    ).toBe(false);
  });
});
