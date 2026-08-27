import type { TagView } from "../../tags/types/tag.types";

type CharacterRosterToolbarProps = {
  summaryText: string;
  searchTerm: string;
  onSearchTermChange: (
    value: string
  ) => void;
  classFilter: string;
  classOptions: string[];
  onClassFilterChange: (
    value: string
  ) => void;
  professionFilter: string;
  professionOptions: string[];
  onProfessionFilterChange: (
    value: string
  ) => void;
  tagFilter: string;
  tagOptions: TagView[];
  onTagFilterChange: (
    value: string
  ) => void;
};

/*
 * Compact single-row toolbar - replaces per-page ad hoc filter markup
 * with the same search/filter language the Overview matrix uses.
 */
export function CharacterRosterToolbar({
  summaryText,
  searchTerm,
  onSearchTermChange,
  classFilter,
  classOptions,
  onClassFilterChange,
  professionFilter,
  professionOptions,
  onProfessionFilterChange,
  tagFilter,
  tagOptions,
  onTagFilterChange
}: CharacterRosterToolbarProps) {
  return (
    <div className="matrix-toolbar">
      <span className="matrix-summary">
        {summaryText}
      </span>

      <input
        aria-label="Search characters"
        className="matrix-search"
        onChange={(event) =>
          onSearchTermChange(
            event.target.value
          )
        }
        placeholder="Search characters..."
        type="text"
        value={searchTerm}
      />

      <select
        aria-label="Filter by class"
        className="matrix-select"
        onChange={(event) =>
          onClassFilterChange(
            event.target.value
          )
        }
        value={classFilter}
      >
        <option value="">
          All classes
        </option>

        {classOptions.map(
          (className) => (
            <option
              key={className}
              value={className}
            >
              {className}
            </option>
          )
        )}
      </select>

      <select
        aria-label="Filter by profession"
        className="matrix-select"
        onChange={(event) =>
          onProfessionFilterChange(
            event.target.value
          )
        }
        value={professionFilter}
      >
        <option value="">
          All professions
        </option>

        {professionOptions.map(
          (name) => (
            <option
              key={name}
              value={name}
            >
              {name}
            </option>
          )
        )}
      </select>

      {tagOptions.length > 0 && (
        <select
          aria-label="Filter by tag"
          className="matrix-select"
          onChange={(event) =>
            onTagFilterChange(
              event.target.value
            )
          }
          value={tagFilter}
        >
          <option value="">
            All tags
          </option>

          {tagOptions.map((tag) => (
            <option
              key={tag.id}
              value={tag.id}
            >
              {tag.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
