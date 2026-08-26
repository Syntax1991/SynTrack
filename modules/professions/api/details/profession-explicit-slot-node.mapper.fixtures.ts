import { buildSpecializationNodeCatalog } from "./profession-specialization-node-catalog.helpers.js";
import type { DetailAssignment } from "./profession-specialization-node-catalog.helpers.js";

export type Assignment = DetailAssignment;

export function createAssignment(
  nodeProgress: {
    key: string;
    rank: number;
  }[]
): Assignment {
  return {
    nodeProgress: nodeProgress.map(
      (entry) => ({
        rank: entry.rank,
        knowledgeRank: entry.rank,

        node: {
          key: entry.key
        }
      })
    )
  } as Assignment;
}

export const catalog =
  buildSpecializationNodeCatalog([
    {
      nodes: [
        {
          key: "addon:107884",
          name: "Wonderful Wristguards",
          maxRank: 21,
          knowledgeMaxRank: 20,
          iconUrl: null
        },
        {
          key: "addon:107886",
          name: "Capable Caps",
          maxRank: 21,
          knowledgeMaxRank: 20,
          iconUrl: null
        },
        {
          key: "addon:107888",
          name: "Securely Shaped",
          maxRank: 31,
          knowledgeMaxRank: 30,
          iconUrl: null
        },
        {
          key: "addon:107985",
          name: "Cutting Claws",
          maxRank: 21,
          knowledgeMaxRank: 20,
          iconUrl: null
        },
        {
          key: "addon:107987",
          name: "Advanced Armor",
          maxRank: 31,
          knowledgeMaxRank: 30,
          iconUrl: null
        },
        {
          key: "addon:107988",
          name: "Balanced Bracers",
          maxRank: 21,
          knowledgeMaxRank: 20,
          iconUrl: null
        },
        {
          key: "addon:107992",
          name: "Bolstered Bulwarks",
          maxRank: 31,
          knowledgeMaxRank: 30,
          iconUrl: null
        }
      ]
    }
  ] as never);
