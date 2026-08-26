import type { BrowseSlotOption } from "./professionFindCraftBrowse.helpers";

type ProfessionFindCraftSlotPickerProps = {
  options: BrowseSlotOption[];
  selected: string | null;
  onSelect: (slotKey: string) => void;
};

export function ProfessionFindCraftSlotPicker({
  options,
  selected,
  onSelect
}: ProfessionFindCraftSlotPickerProps) {
  if (options.length === 0) {
    return (
      <div className="empty-state">
        No known recipes for any
        slot in this category yet.
      </div>
    );
  }

  return (
    <div className="profession-find-craft-picker-grid slot">
      {options.map(
        (option) => (
          <button
            className={
              option.slotKey ===
              selected
                ? "active"
                : ""
            }
            key={option.slotKey}
            onClick={
              () =>
                onSelect(
                  option.slotKey
                )
            }
            type="button"
          >
            <span>
              {option.slotName}
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
