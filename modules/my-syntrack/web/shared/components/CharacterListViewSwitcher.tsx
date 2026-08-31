import {
  CHARACTER_LIST_VIEW_OPTIONS,
  type CharacterListView
} from "../../../api/character-tracking/character-list-view.js";

type CharacterListViewSwitcherProps = {
  value: CharacterListView;
  onChange: (value: CharacterListView) => void;
};

export function CharacterListViewSwitcher({
  value,
  onChange
}: CharacterListViewSwitcherProps) {
  return (
    <div className="overview-matrix-labeled-control">
      <span className="overview-matrix-control-label" id="character-roster-scope-label">
        Characters
      </span>
      <div
        aria-labelledby="character-roster-scope-label"
        className="overview-matrix-filter-group"
        role="group"
      >
        {CHARACTER_LIST_VIEW_OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={
              value === option.value
                ? "overview-matrix-filter active"
                : "overview-matrix-filter"
            }
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
