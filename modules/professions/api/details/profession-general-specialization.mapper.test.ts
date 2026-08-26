import { describe, expect, it } from "vitest";
import { mapProfessionGeneralSpecialization } from "./profession-general-specialization.mapper.js";

type Assignment =
  Parameters<
    typeof mapProfessionGeneralSpecialization
  >[0];

type NodeProgress =
  Assignment["nodeProgress"][number];

function createProgress(
  overrides: {
    rank?: number;
    knowledgeRank?: number;
    node: {
      key: string;
      name?: string;
      parentNodeId: string | null;
      maxRank?: number | null;
      knowledgeMaxRank?: number | null;
      iconUrl?: string | null;
    };
  }
): NodeProgress {
  return {
    rank: 1,
    knowledgeRank: 1,
    ...overrides,

    node: {
      name: "Unnamed Node",
      maxRank: 31,
      knowledgeMaxRank: 30,
      iconUrl: null,
      ...overrides.node
    }
  } as NodeProgress;
}

function createAssignment(
  nodeProgress: NodeProgress[]
): Assignment {
  return {
    nodeProgress
  } as Assignment;
}

describe("mapProfessionGeneralSpecialization", () => {
  it("the Synbomb acceptance case: two root-tree investments, no equipment specialization", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 31,
          knowledgeRank: 30,

          node: {
            key: "addon:107817",
            name: "Flawless Fortes",
            parentNodeId: null,
            maxRank: 31,
            knowledgeMaxRank: 30
          }
        }),
        createProgress({
          rank: 9,
          knowledgeRank: 8,

          node: {
            key: "addon:107921",
            name: "Learned Leatherworker",
            parentNodeId: null,
            maxRank: 31,
            knowledgeMaxRank: 30
          }
        })
      ]);

    const entries =
      mapProfessionGeneralSpecialization(
        assignment,
        "leatherworking"
      );

    expect(entries).toEqual([
      expect.objectContaining({
        nodeName: "Flawless Fortes",
        rank: 30,
        maxRank: 30
      }),
      expect.objectContaining({
        nodeName: "Learned Leatherworker",
        rank: 8,
        maxRank: 30
      })
    ]);
  });

  it("a curated equipment node (e.g. 'Wonderful Wristguards') must NOT appear here - it already surfaces via specializationEquipment, never duplicated", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 21,
          knowledgeRank: 20,

          node: {
            key: "addon:107884",
            name: "Wonderful Wristguards",
            parentNodeId: "addon:107889",
            maxRank: 21,
            knowledgeMaxRank: 20
          }
        })
      ]);

    expect(
      mapProfessionGeneralSpecialization(
        assignment,
        "leatherworking"
      )
    ).toEqual([]);
  });

  it("an invested non-root node with NO curated claim anywhere is still shown, not silently dropped (e.g. a general crafting-bonus perk under a non-curated tree)", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 4,
          knowledgeRank: 3,

          node: {
            key: "addon:104290",
            name: "Resourceful Smith",
            parentNodeId: "addon:104292",
            maxRank: 21,
            knowledgeMaxRank: 20
          }
        })
      ]);

    const entries =
      mapProfessionGeneralSpecialization(
        assignment,
        "blacksmithing"
      );

    expect(entries).toEqual([
      expect.objectContaining({
        nodeName: "Resourceful Smith",
        rank: 3,
        maxRank: 20
      })
    ]);
  });

  it("carries the node's resolved iconUrl through untouched, real icon or null", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 31,
          knowledgeRank: 30,

          node: {
            key: "addon:107817",
            name: "Flawless Fortes",
            parentNodeId: null,
            iconUrl:
              "https://render.worldofwarcraft.com/icons/56/inv_flawless_fortes.jpg"
          }
        }),
        createProgress({
          rank: 9,
          knowledgeRank: 8,

          node: {
            key: "addon:107921",
            name: "Learned Leatherworker",
            parentNodeId: null,
            iconUrl: null
          }
        })
      ]);

    const entries =
      mapProfessionGeneralSpecialization(
        assignment,
        "leatherworking"
      );

    expect(entries).toEqual([
      expect.objectContaining({
        nodeName: "Flawless Fortes",
        nodeIconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_flawless_fortes.jpg"
      }),
      expect.objectContaining({
        nodeName: "Learned Leatherworker",
        nodeIconUrl: null
      })
    ]);
  });

  it("excludes a root node with zero investment", () => {
    const assignment =
      createAssignment([
        createProgress({
          rank: 1,
          knowledgeRank: 0,

          node: {
            key: "addon:107993",
            name: "Safeguarding Scales",
            parentNodeId: null
          }
        })
      ]);

    expect(
      mapProfessionGeneralSpecialization(
        assignment,
        "leatherworking"
      )
    ).toEqual([]);
  });

  it("returns an empty list for a character with no specialization progress at all", () => {
    expect(
      mapProfessionGeneralSpecialization(
        createAssignment([]),
        "leatherworking"
      )
    ).toEqual([]);
  });
});
