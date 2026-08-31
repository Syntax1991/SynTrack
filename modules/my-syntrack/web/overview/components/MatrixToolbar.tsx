import type { CharacterListView } from "../../../api/character-tracking/character-list-view.js";
import { CharacterListViewSwitcher } from "../../shared/components/CharacterListViewSwitcher";
import type {
  MatrixReadinessFilter,
  MatrixSortBy
} from "../hooks/useMatrixFilters";
import type { TagView } from "../types/overview.types";

const readinessFilters: {
  value: MatrixReadinessFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "attention", label: "Attention" },
  { value: "ready", label: "Ready" },
  { value: "not-tracked", label: "Not tracked" }
];

type MatrixToolbarProps = {
  summaryText: string;
  listView: CharacterListView;
  onListViewChange: (value: CharacterListView) => void;
  readinessFilter: MatrixReadinessFilter;
  onReadinessFilterChange: (value: MatrixReadinessFilter) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  sortBy: MatrixSortBy;
  onSortByChange: (value: MatrixSortBy) => void;
  tagFilter: string;
  tagOptions: TagView[];
  onTagFilterChange: (value: string) => void;
  onOpenTrackerManager: () => void;
};

export function MatrixToolbar({
  summaryText,
  listView,
  onListViewChange,
  readinessFilter,
  onReadinessFilterChange,
  searchTerm,
  onSearchTermChange,
  sortBy,
  onSortByChange,
  tagFilter,
  tagOptions,
  onTagFilterChange,
  onOpenTrackerManager
}: MatrixToolbarProps) {
  return (
    <div className="overview-matrix-toolbar">
      <span className="overview-matrix-summary">{summaryText}</span>

      <CharacterListViewSwitcher
        onChange={onListViewChange}
        value={listView}
      />

      <div className="overview-matrix-labeled-control">
        <span className="overview-matrix-control-label" id="overview-status-filter-label">
          Status
        </span>
        <div
          aria-labelledby="overview-status-filter-label"
          className="overview-matrix-filter-group"
          role="group"
        >
          {readinessFilters.map((filter) => (
            <button
              aria-pressed={readinessFilter === filter.value}
              className={
                readinessFilter === filter.value
                  ? "overview-matrix-filter active"
                  : "overview-matrix-filter"
              }
              key={filter.value}
              onClick={() => onReadinessFilterChange(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <input
        aria-label="Search characters"
        className="overview-matrix-search"
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Search characters..."
        type="text"
        value={searchTerm}
      />

      {tagOptions.length > 0 && (
        <select
          aria-label="Filter by tag"
          className="matrix-select"
          onChange={(event) => onTagFilterChange(event.target.value)}
          value={tagFilter}
        >
          <option value="">All tags</option>
          {tagOptions.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      )}

      <label className="overview-matrix-sort">
        <span>Sort</span>
        <select
          onChange={(event) =>
            onSortByChange(event.target.value as MatrixSortBy)
          }
          value={sortBy}
        >
          <option value="default">Needs attention first</option>
          <option value="name">Character name</option>
          <option value="item-level">Item level</option>
        </select>
      </label>

      <button
        className="overview-matrix-columns-button"
        onClick={onOpenTrackerManager}
        type="button"
      >
        Trackers / Columns
      </button>
    </div>
  );
}
