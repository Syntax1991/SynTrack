import { useActiveTrackerScope } from "../../season/hooks/useActiveTrackerScope";
import { useTrackerDefinitions } from "../hooks/useTrackerDefinitions";
import { AddTrackerForm } from "./AddTrackerForm";
import { TrackerDefinitionRow } from "./TrackerDefinitionRow";

type TrackerManagerDrawerProps = {
  onClose: () => void;
  onDefinitionsChanged: () => void;
};

/*
 * A compact management surface, not a separate admin product - list +
 * add form + pin/enable/reorder, all backed by the existing tracker
 * definition API. Scope is fixed to the currently active season
 * (see modules/my-syntrack/web/season) rather than user-selectable
 * here - switching the active season itself happens in Settings.
 */
export function TrackerManagerDrawer({
  onClose,
  onDefinitionsChanged
}: TrackerManagerDrawerProps) {
  const { activeScope } =
    useActiveTrackerScope();

  const {
    definitions,
    isLoading,
    error,
    create,
    updateMetadata
  } = useTrackerDefinitions(
    activeScope?.key ?? ""
  );

  async function handleCreate(
    input: Parameters<
      typeof create
    >[0]
  ) {
    await create(input);
    onDefinitionsChanged();
  }

  async function swapSortOrder(
    index: number,
    otherIndex: number
  ) {
    const current = definitions[index];
    const other =
      definitions[otherIndex];

    if (!current || !other) {
      return;
    }

    await updateMetadata(current.id, {
      sortOrder: other.sortOrder
    });

    await updateMetadata(other.id, {
      sortOrder: current.sortOrder
    });

    onDefinitionsChanged();
  }

  async function togglePinned(
    id: string,
    isPinned: boolean
  ) {
    await updateMetadata(id, {
      isPinned: !isPinned
    });

    onDefinitionsChanged();
  }

  async function toggleEnabled(
    id: string,
    enabled: boolean
  ) {
    await updateMetadata(id, {
      enabled: !enabled
    });

    onDefinitionsChanged();
  }

  return (
    <div
      className="tracker-manager-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="tracker-manager-drawer"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="tracker-manager-header">
          <h2>
            Trackers ·{" "}
            {activeScope?.name ??
              activeScope?.key ??
              "…"}
          </h2>

          <button
            aria-label="Close"
            className="text-button"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <AddTrackerForm
          onCreate={handleCreate}
        />

        {error && (
          <p className="tracker-manager-error">
            {error}
          </p>
        )}

        {isLoading ? (
          <p>Loading trackers…</p>
        ) : definitions.length ===
          0 ? (
          <p className="tracker-manager-empty">
            No trackers yet for this
            scope.
          </p>
        ) : (
          <div className="tracker-manager-list">
            {definitions.map(
              (definition, index) => (
                <TrackerDefinitionRow
                  canMoveDown={
                    index <
                    definitions.length -
                      1
                  }
                  canMoveUp={
                    index > 0
                  }
                  definition={
                    definition
                  }
                  key={definition.id}
                  onMoveDown={() => {
                    void swapSortOrder(
                      index,
                      index + 1
                    );
                  }}
                  onMoveUp={() => {
                    void swapSortOrder(
                      index,
                      index - 1
                    );
                  }}
                  onToggleEnabled={() => {
                    void toggleEnabled(
                      definition.id,
                      definition.enabled
                    );
                  }}
                  onTogglePinned={() => {
                    void togglePinned(
                      definition.id,
                      definition.isPinned
                    );
                  }}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
