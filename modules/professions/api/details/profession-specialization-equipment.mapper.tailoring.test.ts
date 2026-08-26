import { describe, expect, it } from "vitest";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";
import { mapProfessionExplicitSlotNodeRanks } from "./profession-explicit-slot-node.mapper.js";
import { buildSpecializationNodeCatalog } from "./profession-specialization-node-catalog.helpers.js";
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

const tailoringCatalog =
  buildSpecializationNodeCatalog([
    {
      nodes: [
        {
          key: "addon:104204",
          name: "Cloaks",
          maxRank: 21,
          knowledgeMaxRank: 20,
          iconUrl: null
        },
        {
          key: "addon:104207",
          name: "Outfit Essentials",
          maxRank: 31,
          knowledgeMaxRank: 30,
          iconUrl: null
        }
      ]
    }
  ] as never);

describe("Tailoring specialization equipment mapping", () => {
  it("credits Cloaks investment as Cloth Back specialization (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        { key: "addon:104204", rank: 18, name: "Cloaks" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "tailoring"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        familyName: "Cloth",
        slotKey: "BACK",
        rank: 18,
        nodeName: "Cloaks"
      })
    ]);
  });

  it("prefers the specific Cloaks node over the Outfit Essentials bundle for Cloth Back", () => {
    const assignment =
      createAssignment([
        { key: "addon:104204", rank: 18, name: "Cloaks" },
        {
          key: "addon:104207",
          rank: 30,
          name: "Outfit Essentials"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "tailoring"
      );

    const backClaim = claims.find(
      (claim) => claim.slotKey === "BACK"
    );

    expect(backClaim).toEqual(
      expect.objectContaining({
        nodeName: "Cloaks",
        rank: 18
      })
    );
  });

  it("credits an Outfit Essentials-only investment to Chest, Legs, and Back alike", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104207",
          rank: 30,
          name: "Outfit Essentials"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "tailoring"
      );

    const slotKeys = claims
      .map((claim) => claim.slotKey)
      .sort();

    expect(slotKeys).toEqual([
      "BACK",
      "CHEST",
      "LEGS"
    ]);
  });

  it("does not credit a Blacksmithing node key under the Tailoring profession scope", () => {
    const assignment =
      createAssignment([
        { key: "addon:104564", rank: 20, name: "Gauntlets" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "tailoring"
      )
    ).toEqual([]);
  });

  it("scopes explicit slot node ranks to Tailoring's own Cloth pairs only, never Plate or Leather/Mail", () => {
    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        createAssignment([]),
        tailoringCatalog,
        "tailoring"
      );

    const families = new Set(
      ranks.map((entry) => entry.familyName)
    );

    expect(families).toEqual(new Set(["Cloth"]));
  });
});
