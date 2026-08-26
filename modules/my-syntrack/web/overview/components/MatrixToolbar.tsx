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
};

export function MatrixToolbar({
  readinessFilter,
  onReadinessFilterChange,
  searchTerm,
  onSearchTermChange,
  sortBy,
  onSortByChange
}: MatrixToolbarProps) {
  return (
    <div className="overview-matrix-toolbar">
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
    </div>
  );
}
