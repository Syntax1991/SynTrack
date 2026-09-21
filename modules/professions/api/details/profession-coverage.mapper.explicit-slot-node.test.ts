import { describe, expect, it } from "vitest";
import { mapProfessionCharacterCoverage } from "./profession-coverage.mapper.js";
import { createAssignment } from "./profession-coverage.mapper.fixtures.js";

describe("mapProfessionCharacterCoverage - explicitSlotNodeRanks", () => {
  it("shows 0/max for an uninvested slot node, never a vague absence", () => {
    const assignment =
      createAssignment({});

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

    const nodeCatalog = new Map([
      [
        "addon:107884",
        {
          name: "Wonderful Wristguards",
          maxRank: 20,
          iconUrl: null
        }
      ],
      [
        "addon:107886",
        {
          name: "Capable Caps",
          maxRank: 20,
          iconUrl: null
        }
      ]
    ]);

    const coverage =
      mapProfessionCharacterCoverage(
        assignment,
        true,
        true,
        true,
        true,
        nodeCatalog,
        "leatherworking",
        assignment.skill,
        assignment.character.className
      );

    const wrist =
      coverage.explicitSlotNodeRanks.find(
        (entry) =>
          entry.slotKey === "WRIST" &&
          entry.familyName === "Leather"
      );

    expect(wrist).toEqual(
      expect.objectContaining({
        nodeName:
          "Wonderful Wristguards",
        rank: 15,
        maxRank: 20
      })
    );

    const head =
      coverage.explicitSlotNodeRanks.find(
        (entry) =>
          entry.slotKey === "HEAD" &&
          entry.familyName === "Leather"
      );

    expect(head).toEqual(
      expect.objectContaining({
        nodeName: "Capable Caps",
        rank: 0,
        maxRank: 20
      })
    );
  });

  it("is empty when specialization mapping is unavailable for this profession", () => {
    const assignment =
      createAssignment({});

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
      coverage.explicitSlotNodeRanks
    ).toEqual([]);
  });
});
