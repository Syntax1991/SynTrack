import type {
  MatrixReadinessFilter,
  MatrixSortBy
} from "../hooks/useMatrixFilters";

const readinessFilters: {
  value: MatrixReadinessFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  {
    value: "attention",
    label: "Attention"
  },
  { value: "ready", label: "Ready" },
  {
    value: "not-tracked",
    label: "Not tracked"
  }
];

type MatrixToolbarProps = {
  summaryText: string;
  readinessFilter: MatrixReadinessFilter;
  onReadinessFilterChange: (
    value: MatrixReadinessFilter
  ) => void;
  searchTerm: string;
  onSearchTermChange: (
    value: string
  ) => void;
  sortBy: MatrixSortBy;
  onSortByChange: (
    value: MatrixSortBy
  ) => void;
  onOpenTrackerManager: () => void;
};

/*
 * The compact toolbar replaces the old four-KPI-card row entirely - the
 * account-level summary is a single text line here, not a dedicated
 * row of the viewport.
 */
export function MatrixToolbar({
  summaryText,
  readinessFilter,
  onReadinessFilterChange,
  searchTerm,
  onSearchTermChange,
  sortBy,
  onSortByChange,
  onOpenTrackerManager
}: MatrixToolbarProps) {
  return (
    <div className="overview-matrix-toolbar">
      <span className="overview-matrix-summary">
        {summaryText}
      </span>

      <div
        className="overview-matrix-filter-group"
        role="group"
        aria-label="Filter characters"
      >
        {readinessFilters.map(
          (filter) => (
            <button
              aria-pressed={
                readinessFilter ===
                filter.value
              }
              className={
                readinessFilter ===
                filter.value
                  ? "overview-matrix-filter active"
                  : "overview-matrix-filter"
              }
              key={filter.value}
              onClick={() =>
                onReadinessFilterChange(
                  filter.value
                )
              }
              type="button"
            >
              {filter.label}
            </button>
          )
        )}
      </div>

      <input
        aria-label="Search characters"
        className="overview-matrix-search"
        onChange={(event) =>
          onSearchTermChange(
            event.target.value
          )
        }
        placeholder="Search characters..."
        type="text"
        value={searchTerm}
      />

      <label className="overview-matrix-sort">
        <span>Sort</span>

        <select
          onChange={(event) =>
            onSortByChange(
              event.target
                .value as MatrixSortBy
            )
          }
          value={sortBy}
        >
          <option value="default">
            Needs attention first
          </option>
          <option value="name">
            Character name
          </option>
          <option value="item-level">
            Item level
          </option>
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
