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
          maxRank: 36,
          knowledgeMaxRank: 35,
          iconUrl: null
        }
      })
    )
  } as Assignment;
}

describe("Engineering specialization equipment mapping", () => {
  it("credits Boots investment as a Feet claim (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        { key: "addon:109138", rank: 20, name: "Boots" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "engineering"
      )
    ).toEqual([
      expect.objectContaining({
        slotKey: "FEET",
        rank: 20,
        nodeName: "Boots"
      })
    ]);
  });

  it("credits Bracers, Goggles, and Guns each to their own independent slot", () => {
    const assignment =
      createAssignment([
        { key: "addon:109139", rank: 10, name: "Bracers" },
        { key: "addon:109140", rank: 15, name: "Goggles" },
        { key: "addon:110352", rank: 25, name: "Guns" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "engineering"
      );

    expect(claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slotKey: "WRIST",
          rank: 10,
          nodeName: "Bracers"
        }),
        expect.objectContaining({
          slotKey: "HEAD",
          rank: 15,
          nodeName: "Goggles"
        }),
        expect.objectContaining({
          slotKey: "RANGED",
          rank: 25,
          nodeName: "Guns"
        })
      ])
    );

    expect(claims).toHaveLength(3);
  });

  it("produces no claim for the Market Mobility profession-tool nodes, a deliberate multi-specific-per-pair gap", () => {
    const assignment =
      createAssignment([
        { key: "addon:106711", rank: 30, name: "Engineering Tools" },
        { key: "addon:106712", rank: 30, name: "Tailoring Tools" },
        { key: "addon:106713", rank: 30, name: "Jewelcrafting Tools" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "engineering"
      )
    ).toEqual([]);
  });
});
