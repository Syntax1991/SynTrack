import { describe, expect, it } from "vitest";
import { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";
import { mapProfessionExplicitSlotNodeRanks } from "./profession-explicit-slot-node.mapper.js";
import { mapProfessionSlotSpecializationNodes } from "./profession-slot-specialization-nodes.mapper.js";
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
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        }
      })
    )
  } as Assignment;
}

const blacksmithingCatalog =
  buildSpecializationNodeCatalog([
    {
      nodes: [
        {
          key: "addon:104564",
          name: "Gauntlets",
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        },
        {
          key: "addon:104567",
          name: "Articulating Armor",
          maxRank: 31,
          knowledgeMaxRank: 30,
          iconUrl: null
        },
        {
          key: "addon:104572",
          name: "Shields",
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        }
      ]
    }
  ] as never);

describe("Blacksmithing specialization equipment mapping", () => {
  it("credits Gauntlets investment as Plate Hands specialization (exact ID resolution)", () => {
    const assignment =
      createAssignment([
        { key: "addon:104564", rank: 20, name: "Gauntlets" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        familyName: "Plate",
        slotKey: "HANDS",
        rank: 20,
        nodeName: "Gauntlets"
      })
    ]);
  });

  it("credits Shields investment as a Shield/OFF_HAND claim with no armor family", () => {
    const assignment =
      createAssignment([
        { key: "addon:104572", rank: 12, name: "Shields" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    expect(claims).toEqual([
      expect.objectContaining({
        familyName: "Shield",
        slotKey: "OFF_HAND",
        rank: 12,
        nodeName: "Shields"
      })
    ]);
  });

  it("prefers the specific Gauntlets node over the Articulating Armor bundle for Plate Hands", () => {
    const assignment =
      createAssignment([
        { key: "addon:104564", rank: 20, name: "Gauntlets" },
        { key: "addon:104567", rank: 30, name: "Articulating Armor" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    const handsClaim = claims.find(
      (claim) => claim.slotKey === "HANDS"
    );

    expect(handsClaim).toEqual(
      expect.objectContaining({
        nodeName: "Gauntlets",
        rank: 20
      })
    );
  });

  it("credits an Articulating Armor-only investment to Waist, Wrist, and Hands alike", () => {
    const assignment =
      createAssignment([
        { key: "addon:104567", rank: 30, name: "Articulating Armor" }
      ]);

    const claims =
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      );

    const slotKeys = claims
      .map((claim) => claim.slotKey)
      .sort();

    expect(slotKeys).toEqual([
      "HANDS",
      "WAIST",
      "WRIST"
    ]);
  });

  it("does not credit a Leatherworking node key under the Blacksmithing profession scope", () => {
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
        "blacksmithing"
      )
    ).toEqual([]);
  });

  it("does not credit Weaponstones, a consumable enhancement rather than equipment", () => {
    const assignment =
      createAssignment([
        {
          key: "addon:104626",
          rank: 25,
          name: "Weaponstones"
        }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      )
    ).toEqual([]);
  });

  it("does not credit zero-rank investment", () => {
    const assignment =
      createAssignment([
        { key: "addon:104564", rank: 0, name: "Gauntlets" }
      ]);

    expect(
      mapProfessionSpecializationEquipment(
        assignment,
        "blacksmithing"
      )
    ).toEqual([]);
  });

  it("scopes explicit slot node ranks to Blacksmithing's own Plate/Shield pairs only, never Leatherworking's Leather/Mail pairs", () => {
    const ranks =
      mapProfessionExplicitSlotNodeRanks(
        createAssignment([]),
        blacksmithingCatalog,
        "blacksmithing"
      );

    const families = new Set(
      ranks.map((entry) => entry.familyName)
    );

    expect(families.has("Leather")).toBe(false);
    expect(families.has("Mail")).toBe(false);
    expect(families.has("Plate")).toBe(true);
  });

  it("scopes slot specialization candidate nodes to Blacksmithing's own curated nodes only", () => {
    const nodes =
      mapProfessionSlotSpecializationNodes(
        createAssignment([]),
        blacksmithingCatalog,
        "blacksmithing"
      );

    const nodeKeys = new Set(
      nodes.map((entry) => entry.nodeKey)
    );

    expect(nodeKeys.has("addon:107884")).toBe(false);
    expect(nodeKeys.has("addon:104564")).toBe(true);
  });
});
