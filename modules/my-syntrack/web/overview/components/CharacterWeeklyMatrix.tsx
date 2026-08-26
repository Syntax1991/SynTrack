import type {
  CharacterWeeklyState,
  TrackerDefinitionView
} from "../types/overview.types";
import { useMatrixFilters } from "../hooks/useMatrixFilters";
import { CharacterMatrixRow } from "./CharacterMatrixRow";
import { MatrixToolbar } from "./MatrixToolbar";

type CharacterWeeklyMatrixProps = {
  characters: CharacterWeeklyState[];
  trackerColumns: TrackerDefinitionView[];
  summaryText: string;
  onTrackerChanged: () => void;
  onOpenTrackerManager: () => void;
};

/*
 * The matrix is the primary SynTrack workspace, not a table beneath a
 * dashboard - it starts immediately below the toolbar, with no KPI
 * cards or large attention panel competing for the first screen.
 */
export function CharacterWeeklyMatrix({
  characters,
  trackerColumns,
  summaryText,
  onTrackerChanged,
  onOpenTrackerManager
}: CharacterWeeklyMatrixProps) {
  const {
    readinessFilter,
    setReadinessFilter,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    visibleCharacters
  } = useMatrixFilters(characters);

  const columnCount =
    9 + trackerColumns.length;

  return (
    <section className="overview-matrix-panel">
      <MatrixToolbar
        onOpenTrackerManager={
          onOpenTrackerManager
        }
        onReadinessFilterChange={
          setReadinessFilter
        }
        onSearchTermChange={
          setSearchTerm
        }
        onSortByChange={setSortBy}
        readinessFilter={
          readinessFilter
        }
        searchTerm={searchTerm}
        sortBy={sortBy}
        summaryText={summaryText}
      />

      {characters.length === 0 ? (
        <div className="empty-state">
          Add a character to see
          weekly state here.
        </div>
      ) : (
        <div className="table-scroll overview-matrix-scroll">
          <table className="overview-matrix">
            <thead>
              <tr>
                <th>Character</th>
                <th className="overview-col-narrow">
                  iLvl
                </th>
                <th className="overview-col-narrow">
                  Set
                </th>
                <th className="overview-col-narrow">
                  Emb.
                </th>
                <th className="overview-col-narrow">
                  Weeklies
                </th>
                <th className="overview-col-narrow">
                  Vault
                </th>

                {trackerColumns.map(
                  (definition) => (
                    <th
                      className={
                        definition.valueType ===
                        "TEXT"
                          ? "overview-col-medium"
                          : "overview-col-narrow"
                      }
                      key={
                        definition.id
                      }
                      title={
                        definition.category ??
                        undefined
                      }
                    >
                      {definition.name}
                    </th>
                  )
                )}

                <th className="overview-col-narrow">
                  Prof.
                </th>
                <th className="overview-col-narrow">
                  Gear
                </th>
                <th className="overview-col-action">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleCharacters.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      columnCount
                    }
                  >
                    <div className="empty-state">
                      No characters
                      match this
                      filter.
                    </div>
                  </td>
                </tr>
              ) : (
                visibleCharacters.map(
                  (state) => (
                    <CharacterMatrixRow
                      key={
                        state
                          .character
                          .id
                      }
                      onTrackerChanged={
                        onTrackerChanged
                      }
                      state={state}
                      trackerColumns={
                        trackerColumns
                      }
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
