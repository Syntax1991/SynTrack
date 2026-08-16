import type { CooldownDisplayCategory } from "../utils/cooldownCategories";

type CooldownPlanFilterValue =
  | "all"
  | CooldownDisplayCategory;

type CooldownPlanFilterToolbarProps = {
  categories: Array<{
    category: CooldownDisplayCategory;
    label: string;
  }>;
  active: CooldownPlanFilterValue;
  onChange: (
    value: CooldownPlanFilterValue
  ) => void;
};

/**
 * The primary category interaction — a single-select filter, not one
 * permanently-visible block per category. "All" shows every category
 * that actually has real assignments; selecting one narrows to just
 * that category and reveals its compact creation control.
 */
export function CooldownPlanFilterToolbar({
  categories,
  active,
  onChange
}: CooldownPlanFilterToolbarProps) {
  return (
    <div className="cooldown-plan-filter-toolbar">
      <button
        className={
          active === "all"
            ? "cooldown-plan-filter-button is-active"
            : "cooldown-plan-filter-button"
        }
        onClick={() => onChange("all")}
        type="button"
      >
        All
      </button>

      {categories.map(
        ({ category, label }) => (
          <button
            className={
              active === category
                ? "cooldown-plan-filter-button is-active"
                : "cooldown-plan-filter-button"
            }
            key={category}
            onClick={() =>
              onChange(category)
            }
            type="button"
          >
            {label}
          </button>
        )
      )}
    </div>
  );
}
