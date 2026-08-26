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
          maxRank: 41,
          knowledgeMaxRank: 40,
          iconUrl: null
        }
      })
    )
  } as Assignment;
}

const jewelcraftingCatalog =
  buildSpecializationNodeCatalog([
    {
      nodes: [
        {
          key: "addon:107057",
          name: "Luxurious Lockets",
          maxRank: 41,
          knowledgeMaxRank: 40,
          iconUrl: null
        },
        {
          key: "addon:107058",
          name: "Regal Rings",
          maxRank: 41,
          knowledgeMaxRank: 40,
          iconUrl: null
        }
      ]
    }
  ] as never);

describe("Jewelcrafting specialization equipment mapping", () => {
  it("credits Luxurious Lockets investment as a Neck claim with no armor family (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107057",
          rank: 18,
          name: "Luxurious Lockets"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "jewelcrafting"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        slotKey: "NECK",
        rank: 18,
        nodeName: "Luxurious Lockets"
      })
    ]);
  });

  it("credits Regal Rings investment as a Ring/FINGER claim independently of the Neck claim", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107058",
          rank: 12,
          name: "Regal Rings"
        }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "jewelcrafting"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        slotKey: "FINGER",
        rank: 12,
        nodeName: "Regal Rings"
      })
    ]);
  });

  it("does not credit the Jewelcrafting gem-cutting tree, which has no ID-backed capability link", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:106900",
          rank: 25,
          name: "Powerful Peridot"
        }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "jewelcrafting"
      )
    ).toEqual([]);
  });

  it("does not credit a Leatherworking node key under the Jewelcrafting profession scope", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107884",
          rank: 20,
          name: "Wonderful Wristguards"
        }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "jewelcrafting"
      )
    ).toEqual([]);
  });

  it("scopes explicit slot node ranks to Jewelcrafting's own Neck/Ring pairs only", () => {
    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        createAssignment([]),
        jewelcraftingCatalog,
        "jewelcrafting"
      );

    const slotKeys = new Set(
      ranks.map((entry) => entry.slotKey)
    );

    expect(slotKeys).toEqual(
      new Set(["NECK", "FINGER"])
    );
  });
});
