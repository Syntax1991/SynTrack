import type {
  CharacterOverviewRow,
  TrackerDefinitionView
} from "../types/overview.types";
import { useMatrixFilters } from "../hooks/useMatrixFilters";
import { CharacterMatrixRow } from "./CharacterMatrixRow";
import { MatrixToolbar } from "./MatrixToolbar";

type CharacterWeeklyMatrixProps = {
  characters: CharacterOverviewRow[];
  trackerColumns: TrackerDefinitionView[];
  summaryText: string;
  onTrackerChanged: () => void;
  onOpenTrackerManager: () => void;
};

/*
 * Default Overview triage matrix:
 * Character · iLvl · Set · Emb · Weeklies · [Trackers] · Prof · Gear · Res · Action
 * Weekly sub-detail (Vault/Quest/Treat/Drops/Spark/Cata) is not default.
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
    tagFilter,
    setTagFilter,
    tagOptions,
    sortBy,
    setSortBy,
    visibleCharacters
  } = useMatrixFilters(characters);

  const columnCount = 9 + trackerColumns.length;

  return (
    <section className="overview-matrix-panel">
      <MatrixToolbar
        onOpenTrackerManager={onOpenTrackerManager}
        onReadinessFilterChange={setReadinessFilter}
        onSearchTermChange={setSearchTerm}
        onSortByChange={setSortBy}
        readinessFilter={readinessFilter}
        searchTerm={searchTerm}
        sortBy={sortBy}
        summaryText={summaryText}
        tagFilter={tagFilter}
        tagOptions={tagOptions}
        onTagFilterChange={setTagFilter}
      />

      {characters.length === 0 ? (
        <div className="empty-state">
          Add a character to see weekly state here.
        </div>
      ) : (
        <div className="table-scroll overview-matrix-scroll">
          <table className="overview-matrix">
            <thead>
              <tr>
                <th>Character</th>
                <th className="overview-col-narrow">iLvl</th>
                <th className="overview-col-narrow">Set</th>
                <th className="overview-col-narrow">Emb.</th>
                <th
                  className="overview-col-narrow"
                  title="Recurring weekly work summary - details on Weeklies"
                >
                  Weeklies
                </th>

                {trackerColumns.map((definition) => (
                  <th
                    className={
                      definition.valueType === "TEXT"
                        ? "overview-col-medium"
                        : "overview-col-narrow"
                    }
                    key={definition.id}
                    title={definition.category ?? undefined}
                  >
                    {definition.name}
                  </th>
                ))}

                <th
                  className="overview-col-narrow"
                  title="Permanent profession setup - data health and Knowledge Treasures (not weekly Quest/Treatise/Drops)"
                >
                  Prof.
                </th>
                <th className="overview-col-narrow">Gear</th>
                <th
                  className="overview-col-narrow"
                  title="Resources attention"
                >
                  Res.
                </th>
                <th className="overview-col-action">Action</th>
              </tr>
            </thead>

            <tbody>
              {visibleCharacters.length === 0 ? (
                <tr>
                  <td colSpan={columnCount}>
                    <div className="empty-state">
                      No characters match this filter.
                    </div>
                  </td>
                </tr>
              ) : (
                visibleCharacters.map((state) => (
                  <CharacterMatrixRow
                    key={state.character.id}
                    onTrackerChanged={onTrackerChanged}
                    state={state}
                    trackerColumns={trackerColumns}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
