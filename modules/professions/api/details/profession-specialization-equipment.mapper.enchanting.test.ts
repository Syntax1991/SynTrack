import { describe, expect, it } from "vitest";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";
import type { DetailAssignment } from "./profession-specialization-node-catalog.helpers.js";

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
          maxRank: 21,
          knowledgeMaxRank: 20,
          iconUrl: null
        }
      })
    )
  } as Assignment;
}

describe("Enchanting specialization equipment mapping", () => {
  it("credits Reputable Rods investment as a Profession Tool claim (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        { key: "addon:107686", rank: 15, name: "Reputable Rods" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "enchanting"
      )
    ).toEqual([
      expect.objectContaining({
        slotKey: "PROFESSION_TOOL",
        rank: 15,
        nodeName: "Reputable Rods"
      })
    ]);
  });

  it("credits Worthy Wands investment as a Ranged claim independently of Reputable Rods", () => {
    const assignment =
      createAssignment([
        { key: "addon:107685", rank: 10, name: "Worthy Wands" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "enchanting"
      )
    ).toEqual([
      expect.objectContaining({
        slotKey: "RANGED",
        rank: 10,
        nodeName: "Worthy Wands"
      })
    ]);
  });

  it("credits an Outstanding Outfits-only investment to both Ranged and Profession Tool (bundle)", () => {
    const assignment =
      createAssignment([
        { key: "addon:107687", rank: 18, name: "Outstanding Outfits" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "enchanting"
      );

    const slotKeys = claims
      .map((claim) => claim.slotKey)
      .sort();

    expect(slotKeys).toEqual([
      "PROFESSION_TOOL",
      "RANGED"
    ]);
  });

  it("produces no claim for Elevating Equipment nodes, whose text-named slots have no ID-backed capability", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107759",
          rank: 20,
          name: "Azerothian Arms"
        }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "enchanting"
      )
    ).toEqual([]);
  });

  it("does not credit an Inscription node key under the Enchanting profession scope", () => {
    const assignment =
      createAssignment([
        { key: "addon:106189", rank: 20, name: "Bows" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "enchanting"
      )
    ).toEqual([]);
  });
});
