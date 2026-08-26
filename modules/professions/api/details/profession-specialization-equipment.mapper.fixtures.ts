import type { mapProfessionSpecializationEquipment } from "./profession-specialization-equipment.mapper.js";

export type Assignment =
  Parameters<
    typeof mapProfessionSpecializationEquipment
  >[0];

export type NodeProgress =
  Assignment["nodeProgress"][number];

export type ProgressOverrides = {
  rank?: number;
  knowledgeRank?: number;
  node: {
    key: string;
    name?: string;
    maxRank?: number | null;
    knowledgeMaxRank?: number | null;
    iconUrl?: string | null;
  };
};

export function createProgress(
  overrides: ProgressOverrides
): NodeProgress {
  return {
    rank: 1,
    knowledgeRank: 1,
    ...overrides,

    node: {
      name: "Unnamed Node",
      maxRank: 21,
      knowledgeMaxRank: 20,
      iconUrl: null,
      ...overrides.node
    }
  } as NodeProgress;
}

export function createAssignment(
  nodeProgress: NodeProgress[]
): Assignment {
  return {
    nodeProgress
  } as Assignment;
}
