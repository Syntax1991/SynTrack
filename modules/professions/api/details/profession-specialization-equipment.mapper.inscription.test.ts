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
          maxRank: 31,
          knowledgeMaxRank: 30,
          iconUrl: null
        }
      })
    )
  } as Assignment;
}

describe("Inscription specialization equipment mapping", () => {
  it("credits Bows investment as a Ranged claim (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        { key: "addon:106189", rank: 20, name: "Bows" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "inscription"
      )
    ).toEqual([
      expect.objectContaining({
        slotKey: "RANGED",
        rank: 20,
        nodeName: "Bows"
      })
    ]);
  });

  it("credits Staves investment as a Two-Hand claim independently of Bows", () => {
    const assignment =
      createAssignment([
        { key: "addon:106190", rank: 15, name: "Staves" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "inscription"
      )
    ).toEqual([
      expect.objectContaining({
        slotKey: "TWO_HAND",
        rank: 15,
        nodeName: "Staves"
      })
    ]);
  });

  it("credits Lamps and Lanterns investment as an Off Hand claim", () => {
    const assignment =
      createAssignment([
        { key: "addon:106188", rank: 25, name: "Lamps and Lanterns" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "inscription"
      )
    ).toEqual([
      expect.objectContaining({
        slotKey: "OFF_HAND",
        rank: 25,
        nodeName: "Lamps and Lanterns"
      })
    ]);
  });

  it("credits a Field Research-only investment to both Ranged and Two-Hand (bundle)", () => {
    const assignment =
      createAssignment([
        { key: "addon:106191", rank: 30, name: "Field Research" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "inscription"
      );

    const slotKeys = claims
      .map((claim) => claim.slotKey)
      .sort();

    expect(slotKeys).toEqual([
      "RANGED",
      "TWO_HAND"
    ]);
  });

  it("prefers the specific Bows node over the Field Research bundle for Ranged", () => {
    const assignment =
      createAssignment([
        { key: "addon:106189", rank: 20, name: "Bows" },
        { key: "addon:106191", rank: 30, name: "Field Research" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "inscription"
      );

    const rangedClaim = claims.find(
      (claim) => claim.slotKey === "RANGED"
    );

    expect(rangedClaim).toEqual(
      expect.objectContaining({
        nodeName: "Bows",
        rank: 20
      })
    );
  });

  it("produces no claim for the Profession Tool quill nodes, a deliberate multi-specific-per-pair gap", () => {
    const assignment =
      createAssignment([
        { key: "addon:106184", rank: 30, name: "Chef's Rolling Pin" },
        { key: "addon:106185", rank: 30, name: "Alchemist's Mixing Rod" },
        { key: "addon:106186", rank: 30, name: "Scribe's Quill" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "inscription"
      )
    ).toEqual([]);
  });

  it("produces no claim for the Darkmoon Curiosity trinket tree, a deliberate multi-specific-per-pair gap", () => {
    const assignment =
      createAssignment([
        { key: "addon:106346", rank: 20, name: "Darkmoon Dominion: Rot" },
        { key: "addon:106347", rank: 20, name: "Darkmoon Sigil: Rot" },
        { key: "addon:106348", rank: 20, name: "Rot" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "inscription"
      )
    ).toEqual([]);
  });
});
