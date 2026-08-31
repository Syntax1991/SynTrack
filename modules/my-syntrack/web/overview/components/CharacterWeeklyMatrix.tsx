import { characterListViewEmptyMessage } from "../../../api/character-tracking/character-list-view.js";
import type {
  CharacterOverviewRow,
  TrackerDefinitionView
} from "../types/overview.types";
import { useMatrixFilters } from "../hooks/useMatrixFilters";
import {
  overviewColumnCount,
  overviewColumnsForView
} from "../utils/overviewMatrixColumns";
import { CharacterMatrixRow } from "./CharacterMatrixRow";
import { MatrixToolbar } from "./MatrixToolbar";

type CharacterWeeklyMatrixProps = {
  characters: CharacterOverviewRow[];
  trackerColumns: TrackerDefinitionView[];
  resetLabel: string;
  onTrackerChanged: () => void;
  onOpenTrackerManager: () => void;
};

/*
 * Default Overview triage matrix with All | Gameplay | Professions scope.
 * PROF. = permanent profession setup. Spark/Cata are roster resources.
 * No default GEAR / Quest / Treatise / Drops / Treasure columns.
 */
export function CharacterWeeklyMatrix({
  characters,
  trackerColumns,
  resetLabel,
  onTrackerChanged,
  onOpenTrackerManager
}: CharacterWeeklyMatrixProps) {
  const {
    listView,
    setListView,
    readinessFilter,
    setReadinessFilter,
    searchTerm,
    setSearchTerm,
    tagFilter,
    setTagFilter,
    tagOptions,
    sortBy,
    setSortBy,
    visibleCharacters,
    hasOtherFilters,
    scopeSummaryText
  } = useMatrixFilters(characters);

  const visibleColumns = overviewColumnsForView(listView);
  const columnCount = overviewColumnCount(
    visibleColumns,
    visibleColumns.includes("trackers") ? trackerColumns.length : 0
  );
  const emptyMessage = characterListViewEmptyMessage(
    listView,
    hasOtherFilters
  );
  const attentionCount = visibleCharacters.filter(
    (state) => state.readinessState === "attention"
  ).length;
  const readyCount = visibleCharacters.filter(
    (state) => state.readinessState === "ready"
  ).length;
  const summaryText = `${scopeSummaryText} · ${attentionCount} attention · ${readyCount} ready · ${resetLabel}`;

  return (
    <section className="overview-matrix-panel">
      <MatrixToolbar
        listView={listView}
        onListViewChange={setListView}
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
                {visibleColumns.includes("character") && <th>Character</th>}
                {visibleColumns.includes("ilvl") && (
                  <th className="overview-col-narrow">iLvl</th>
                )}
                {visibleColumns.includes("set") && (
                  <th className="overview-col-narrow">Set</th>
                )}
                {visibleColumns.includes("emb") && (
                  <th className="overview-col-narrow">Emb.</th>
                )}
                {visibleColumns.includes("weeklies") && (
                  <th
                    className="overview-col-narrow"
                    title="Recurring weekly work summary - details on Weeklies"
                  >
                    Weeklies
                  </th>
                )}
                {visibleColumns.includes("trackers") &&
                  trackerColumns.map((definition) => (
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
                {visibleColumns.includes("prof") && (
                  <th
                    className="overview-col-narrow"
                    title="Permanent profession setup - data health and Knowledge Treasures"
                  >
                    Prof.
                  </th>
                )}
                {visibleColumns.includes("spark") && (
                  <th
                    className="overview-col-narrow"
                    title="Tidal Spark Dust - season progress toward Sparks of Tides"
                  >
                    Spark
                  </th>
                )}
                {visibleColumns.includes("cata") && (
                  <th
                    className="overview-col-narrow"
                    title="Venomblight Manaflux - Creation Catalyst charges"
                  >
                    Cata
                  </th>
                )}
                {visibleColumns.includes("action") && (
                  <th className="overview-col-action">Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {visibleCharacters.length === 0 ? (
                <tr>
                  <td colSpan={columnCount}>
                    <div className="empty-state">{emptyMessage}</div>
                  </td>
                </tr>
              ) : (
                visibleCharacters.map((state) => (
                  <CharacterMatrixRow
                    key={state.character.id}
                    onTrackerChanged={onTrackerChanged}
                    state={state}
                    trackerColumns={
                      visibleColumns.includes("trackers")
                        ? trackerColumns
                        : []
                    }
                    visibleColumns={visibleColumns}
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
