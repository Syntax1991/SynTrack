import type { TrackerDefinitionView } from "../types/tracker.types";

type TrackerDefinitionRowProps = {
  definition: TrackerDefinitionView;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTogglePinned: () => void;
  onToggleEnabled: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function TrackerDefinitionRow({
  definition,
  canMoveUp,
  canMoveDown,
  onTogglePinned,
  onToggleEnabled,
  onMoveUp,
  onMoveDown
}: TrackerDefinitionRowProps) {
  return (
    <div className="tracker-manager-row">
      <div className="tracker-manager-row-reorder">
        <button
          aria-label="Move up"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          type="button"
        >
          ↑
        </button>

        <button
          aria-label="Move down"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          type="button"
        >
          ↓
        </button>
      </div>

      <div className="tracker-manager-row-name">
        <strong>
          {definition.name}
        </strong>

        <small>
          {definition.valueType} ·{" "}
          {definition.resetBehavior}
        </small>
      </div>

      <label className="tracker-manager-row-toggle">
        <input
          checked={
            definition.isPinned
          }
          onChange={onTogglePinned}
          type="checkbox"
        />
        Pinned
      </label>

      <label className="tracker-manager-row-toggle">
        <input
          checked={definition.enabled}
          onChange={onToggleEnabled}
          type="checkbox"
        />
        Enabled
      </label>
    </div>
  );
}
