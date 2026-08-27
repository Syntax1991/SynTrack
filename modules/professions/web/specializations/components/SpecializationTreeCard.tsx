import type { SpecializationTree } from "../types/specialization.types";
import { SpecializationNodeEditor } from "./SpecializationNodeEditor";

type SpecializationTreeCardProps = {
  tree: SpecializationTree;
  ranks: Record<string, number>;
  onRankChange: (
    nodeId: string,
    rank: number
  ) => void;
};

export function SpecializationTreeCard({
  tree,
  ranks,
  onRankChange
}: SpecializationTreeCardProps) {
  return (
    <article className="specialization-tree-card">
      <header>
        <h3 title={tree.description ?? undefined}>
          {tree.name}
        </h3>

        <span>{tree.expansion}</span>
      </header>

      <div className="specialization-node-list">
        <div className="specialization-node-column-header">
          <span>Node</span>
          <span>State / rank</span>
        </div>

        {tree.nodes.map(
          (node) => (
            <SpecializationNodeEditor
              childRanks={
                ranks
              }
              key={
                node.id
              }
              node={
                node
              }
              onRankChange={
                onRankChange
              }
              rank={
                ranks[
                  node.id
                ] ?? 0
              }
            />
          )
        )}
      </div>
    </article>
  );
}
