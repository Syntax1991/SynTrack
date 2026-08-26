import { describe, expect, it } from "vitest";
import { mapProfessionSlotSpecializationNodes } from "./profession-slot-specialization-nodes.mapper.js";
import {
  catalog,
  createAssignment
} from "./profession-explicit-slot-node.mapper.fixtures.js";

describe("mapProfessionSlotSpecializationNodes", () => {
  it("Mail Hands acceptance case: shows both the specific and bundle node with their own real ranks, never collapsed to one value", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107987",
          rank: 30
        }
      ]);

    const nodes =
      mapProfessionSlotSpecializationNodes(
        assignment,
        catalog,
        "leatherworking"
      );

    const handsNodes = nodes.filter(
      (entry) =>
        entry.familyName ===
          "Mail" &&
        entry.slotKey === "HANDS"
    );

    expect(
      handsNodes
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeName:
            "Advanced Armor",
          rank: 30,
          maxRank: 30
        }),
        expect.objectContaining({
          nodeName: "Cutting Claws",
          rank: 0,
          maxRank: 20
        })
      ])
    );

    expect(
      handsNodes
    ).toHaveLength(2);
  });

  it("Mail Wrist acceptance case: a real specific-node investment is never shown without its node name", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107988",
          rank: 15
        }
      ]);

    const nodes =
      mapProfessionSlotSpecializationNodes(
        assignment,
        catalog,
        "leatherworking"
      );

    const wristNodes = nodes.filter(
      (entry) =>
        entry.familyName ===
          "Mail" &&
        entry.slotKey === "WRIST"
    );

    const balancedBracers =
      wristNodes.find(
        (entry) =>
          entry.nodeKey ===
          "addon:107988"
      );

    expect(
      balancedBracers
    ).toEqual(
      expect.objectContaining({
        nodeName: "Balanced Bracers",
        rank: 15,
        maxRank: 20
      })
    );
  });

  it("shows both a specific node and a bundle node when the character is invested in both for the same slot", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107988",
          rank: 15
        },
        {
          key: "addon:107992",
          rank: 30
        }
      ]);

    const nodes =
      mapProfessionSlotSpecializationNodes(
        assignment,
        catalog,
        "leatherworking"
      );

    const wristNodes = nodes.filter(
      (entry) =>
        entry.familyName ===
          "Mail" &&
        entry.slotKey === "WRIST"
    );

    expect(
      wristNodes
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeName:
            "Balanced Bracers",
          rank: 15,
          maxRank: 20
        }),
        expect.objectContaining({
          nodeName:
            "Bolstered Bulwarks",
          rank: 30,
          maxRank: 30
        })
      ])
    );
  });

  it("never omits the zero-rank node just because another node covering the same slot is invested", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:107987",
          rank: 30
        }
      ]);

    const nodes =
      mapProfessionSlotSpecializationNodes(
        assignment,
        catalog,
        "leatherworking"
      );

    const cuttingClaws = nodes.find(
      (entry) =>
        entry.nodeKey ===
        "addon:107985"
    );

    expect(
      cuttingClaws
    ).toBeDefined();

    expect(
      cuttingClaws?.rank
    ).toBe(0);
  });
});
