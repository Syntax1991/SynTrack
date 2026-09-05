import type { SpecializationRepository } from "./specialization.repository.js";
import type {
  SpecializationNodeView,
  SpecializationTreeView
} from "./specialization.types.js";

/*
 * Split out of specialization.service.ts to stay under the 350-line
 * architecture cap - pure tree/node-view construction, no data access.
 */
export function createTreeView(
  tree: Awaited<
    ReturnType<SpecializationRepository["findTreesByProfessionIds"]>
  >[number],
  progressByNodeId: Map<
    string,
    { rank: number; source: string; lastSyncedAt: Date | null }
  >
): SpecializationTreeView {
  const nodeViews = new Map<string, SpecializationNodeView>();

  for (const node of tree.nodes) {
    const progress = progressByNodeId.get(node.id);

    nodeViews.set(node.id, {
      id: node.id,
      key: node.key,
      name: node.name,
      description: node.description,
      maxRank: node.maxRank,
      sortOrder: node.sortOrder,
      parentNodeId: node.parentNodeId,
      rank: progress?.rank ?? 0,
      source: progress?.source ?? null,
      lastSyncedAt: progress?.lastSyncedAt?.toISOString() ?? null,
      children: []
    });
  }

  const rootNodes: SpecializationNodeView[] = [];

  for (const node of nodeViews.values()) {
    if (node.parentNodeId && nodeViews.has(node.parentNodeId)) {
      nodeViews.get(node.parentNodeId)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  sortNodes(rootNodes);

  return {
    id: tree.id,
    key: tree.key,
    name: tree.name,
    description: tree.description,
    expansion: tree.expansion,
    sortOrder: tree.sortOrder,
    nodes: rootNodes
  };
}

function sortNodes(nodes: SpecializationNodeView[]): void {
  nodes.sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.name.localeCompare(right.name, "de")
  );

  for (const node of nodes) {
    sortNodes(node.children);
  }
}
