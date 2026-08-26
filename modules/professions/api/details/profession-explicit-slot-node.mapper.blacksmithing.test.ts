import { describe, expect, it } from "vitest";
import { mapProfessionExplicitSlotNodeRanks } from "./profession-explicit-slot-node.mapper.js";
import { buildSpecializationNodeCatalog } from "./profession-specialization-node-catalog.helpers.js";
import type { DetailAssignment } from "./profession-specialization-node-catalog.helpers.js";

/*
 * P0 regression: this exercises the REAL curated Blacksmithing registry
 * (professionKey: "blacksmithing", the actual production definitions
 * file) through the actual mapProfessionExplicitSlotNodeRanks resolver -
 * not a helper that merely reproduces the desired output. Synbeam's real
 * imported data is exactly this shape: Large Plate Armor (bundle) 30/30
 * invested, Chestplates and Greaves (its specific children) both at 0.
 */

type Assignment = DetailAssignment;

function createSynbeamAssignment(): Assignment {
  return {
    nodeProgress: [
      {
        rank: 1,
        knowledgeRank: 0,
        node: {
          key: "addon:104574",
          name: "Chestplates",
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        }
      },
      {
        rank: 1,
        knowledgeRank: 0,
        node: {
          key: "addon:104573",
          name: "Greaves",
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        }
      },
      {
        rank: 31,
        knowledgeRank: 30,
        node: {
          key: "addon:104575",
          name: "Large Plate Armor",
          maxRank: 31,
          knowledgeMaxRank: 30,
          iconUrl: null
        }
      },
      {
        rank: 17,
        knowledgeRank: 16,
        node: {
          key: "addon:104572",
          name: "Shields",
          maxRank: 26,
          knowledgeMaxRank: 25,
          iconUrl: null
        }
      }
    ]
  } as Assignment;
}

const catalog = buildSpecializationNodeCatalog([
  {
    nodes: [
      {
        key: "addon:104574",
        name: "Chestplates",
        maxRank: 26,
        knowledgeMaxRank: 25,
        iconUrl: null
      },
      {
        key: "addon:104573",
        name: "Greaves",
        maxRank: 26,
        knowledgeMaxRank: 25,
        iconUrl: null
      },
      {
        key: "addon:104575",
        name: "Large Plate Armor",
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

describe("mapProfessionExplicitSlotNodeRanks - P0 Blacksmithing regression: bundle must never impersonate a specific slot's rank", () => {
  it("Synbeam acceptance case: Chest resolves to Chestplates 0/25, never Large Plate Armor", () => {
    const ranks = mapProfessionExplicitSlotNodeRanks(
      createSynbeamAssignment(),
      catalog,
      "blacksmithing"
    );

    const chest = ranks.find(
      (entry) => entry.slotKey === "CHEST"
    );

    expect(chest).toEqual(
      expect.objectContaining({
        nodeName: "Chestplates",
        rank: 0,
        maxRank: 25,
        hasProvenInvestment: true
      })
    );

    expect(chest?.nodeName).not.toBe(
      "Large Plate Armor"
    );
  });

  it("Synbeam acceptance case: Legs resolves to Greaves 0/25, never Large Plate Armor", () => {
    const ranks = mapProfessionExplicitSlotNodeRanks(
      createSynbeamAssignment(),
      catalog,
      "blacksmithing"
    );

    const legs = ranks.find(
      (entry) => entry.slotKey === "LEGS"
    );

    expect(legs).toEqual(
      expect.objectContaining({
        nodeName: "Greaves",
        rank: 0,
        maxRank: 25,
        hasProvenInvestment: true
      })
    );

    expect(legs?.nodeName).not.toBe(
      "Large Plate Armor"
    );
  });

  it("Synbeam acceptance case: Shield resolves to Shields 16/25 (its own real specific investment, unaffected by the bundle fix)", () => {
    const ranks = mapProfessionExplicitSlotNodeRanks(
      createSynbeamAssignment(),
      catalog,
      "blacksmithing"
    );

    const shield = ranks.find(
      (entry) => entry.slotKey === "OFF_HAND"
    );

    expect(shield).toEqual(
      expect.objectContaining({
        nodeName: "Shields",
        rank: 16,
        maxRank: 25,
        hasProvenInvestment: true
      })
    );
  });

  it("no row anywhere in the result resolves its nodeName to the bundle 'Large Plate Armor'", () => {
    const ranks = mapProfessionExplicitSlotNodeRanks(
      createSynbeamAssignment(),
      catalog,
      "blacksmithing"
    );

    expect(
      ranks.some(
        (entry) =>
          entry.nodeName === "Large Plate Armor"
      )
    ).toBe(false);
  });
});
