import { FamilyIcon } from "../../shared/components/ProfessionIcons";
import type { BrowseGroupOption } from "./professionFindCraftBrowse.helpers";

type ProfessionFindCraftGroupPickerProps = {
  options: BrowseGroupOption[];
  selected: string | null;
  onSelect: (name: string) => void;
};

export function ProfessionFindCraftGroupPicker({
  options,
  selected,
  onSelect
}: ProfessionFindCraftGroupPickerProps) {
  if (options.length === 0) {
    return (
      <div className="empty-state">
        No known recipes yet.
      </div>
    );
  }

  return (
    <div className="profession-find-craft-picker-grid">
      {options.map(
        (option) => (
          <button
            className={
              option.name ===
              selected
                ? "active"
                : ""
            }
            key={option.name}
            onClick={
              () =>
                onSelect(
                  option.name
                )
            }
            type="button"
          >
            <FamilyIcon
              familyName={
                option.name
              }
            />

            <span>
              {option.name}
            </span>

            <small>
              {option.recipeCount}
            </small>
          </button>
        )
      )}
    </div>
  );
}
