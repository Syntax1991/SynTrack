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
    <div
      className="overview-matrix-filter-group"
      role="group"
      aria-label="Character roster scope"
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
  );
}
