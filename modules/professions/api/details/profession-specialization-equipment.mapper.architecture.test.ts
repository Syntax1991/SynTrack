import { describe, expect, it } from "vitest";
import { slotClaim } from "./profession-specialization-equipment.types.js";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";
import type { DetailAssignment } from "./profession-specialization-node-catalog.helpers.js";

/*
 * These tests exercise the generic curated-mapping ARCHITECTURE itself
 * (capabilityKey identity, ID-only resolution) rather than any single
 * profession's real curated data - none of the 7 currently-mapped
 * professions actually needs two distinct nodes sharing one generic slot
 * yet (see "multiple specific nodes" in
 * docs/architecture/profession-specialization-mapping.md), but the mapper's
 * own grouping mechanism already supports it, which is what this proves.
 */

type Assignment = DetailAssignment;

function createAssignment(
  nodeProgress: {
    key: string;
    rank: number;
    name?: string;
  }[]
): Assignment {
  return {
    nodeProgress: nodeProgress.map(
      (entry) => ({
        rank: entry.rank,
        knowledgeRank: entry.rank,

        node: {
          key: entry.key,
          name: entry.name ?? "Unnamed Node",
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        }
      })
    )
  } as Assignment;
}

describe("slotClaim - capabilityKey identity", () => {
  it("defaults capabilityKey to `${familyName}:${slotKey}`, matching every existing curated table's implicit pairing", () => {
    const claim = slotClaim(
      "PLATE",
      "Plate",
      "HANDS",
      "Hands",
      false
    );

    expect(claim.capabilityKey).toBe(
      "Plate:HANDS"
    );

    expect(claim.presentationGroup).toBe(
      "Plate"
    );

    expect(claim.kind).toBe(
      "EQUIPMENT_SLOT"
    );

    expect(claim.provenance).toBe(
      "CURATED_VERIFIED"
    );
  });

  it("lets two different claims share the same slotKey while owning two different capabilityKeys - the exact case a plain family+slot pair could not represent", () => {
    const scribeToolClaim = slotClaim(
      null,
      "Profession Gear",
      "PROFESSION_TOOL",
      "Profession Tool",
      false,
      {
        capabilityKey:
          "inscription.profession_gear.scribe_tool",
        kind: "PROFESSION_GEAR"
      }
    );

    const cookingToolClaim = slotClaim(
      null,
      "Profession Gear",
      "PROFESSION_TOOL",
      "Profession Tool",
      false,
      {
        capabilityKey:
          "inscription.profession_gear.cooking_tool",
        kind: "PROFESSION_GEAR"
      }
    );

    expect(scribeToolClaim.slotKey).toBe(
      cookingToolClaim.slotKey
    );

    expect(
      scribeToolClaim.capabilityKey
    ).not.toBe(
      cookingToolClaim.capabilityKey
    );
  });
});

describe("curated specialization mapping - ID-only resolution", () => {
  it("does not resolve a node whose NAME matches a curated node but whose ID does not", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:999999999",
          rank: 20,
          name: "Gauntlets"
        }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      )
    ).toEqual([]);
  });

  it("resolves the real curated node by ID regardless of what the character's own node.name currently says", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104564",
          rank: 20,
          name: "A Completely Different Localized Name"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        slotKey: "HANDS",
        rank: 20
      })
    ]);
  });
});
