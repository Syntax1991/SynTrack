import type { SpecializationNode } from "../types/specialization.types";

type SpecializationNodeEditorProps = {
  node: SpecializationNode;
  rank: number;
  depth?: number;
  childRanks:
    Record<string, number>;
  onRankChange: (
    nodeId: string,
    rank: number
  ) => void;
};

export function SpecializationNodeEditor({
  node,
  rank,
  depth = 0,
  childRanks,
  onRankChange
}: SpecializationNodeEditorProps) {
  const selected =
    rank > 0;

  const maximumRank =
    node.maxRank ?? 1000;

  const toggleSelected = () => {
    onRankChange(
      node.id,
      selected ? 0 : 1
    );
  };

  return (
    <div
      className="specialization-node-group"
      title={node.description ?? undefined}
    >
      <div
        className={
          selected
            ? "specialization-node selected"
            : "specialization-node"
        }
        style={{
          marginLeft:
            `${depth * 24}px`
        }}
      >
        <label className="specialization-node-toggle">
          <input
            checked={selected}
            onChange={
              toggleSelected
            }
            type="checkbox"
          />

          <span>
            {node.name}
          </span>
        </label>

        <div className="specialization-node-meta">
          {node.source && (
            <span className="specialization-source">
              {node.source}
            </span>
          )}

          <label className="specialization-rank">
            <span>Rank</span>

            <input
              disabled={!selected}
              max={maximumRank}
              min={0}
              onChange={(event) =>
                onRankChange(
                  node.id,
                  Number(
                    event.target.value
                  )
                )
              }
              type="number"
              value={rank}
            />

            {node.maxRank !== null && (
              <small>
                / {node.maxRank}
              </small>
            )}
          </label>
        </div>
      </div>

      {node.children.map(
        (child) => (
          <SpecializationNodeEditor
            childRanks={
              childRanks
            }
            depth={
              depth + 1
            }
            key={
              child.id
            }
            node={
              child
            }
            onRankChange={
              onRankChange
            }
            rank={
              childRanks[
                child.id
              ] ?? 0
            }
          />
        )
      )}
    </div>
  );
}
