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
  alwaysShowAssigned: boolean;
  onToggleAlwaysShowAssigned: () => void;
};

/**
 * The primary category interaction — a single-select filter, not one
 * permanently-visible block per category. "All" shows every category
 * that actually has real assignments; selecting one narrows to just
 * that category and reveals its compact creation control.
 *
 * "Always Show Assigned" is a filter-safety toggle, not another
 * category — it never changes what CAN be planned, only guarantees a
 * lane/player already carrying a real RaidCooldownAssignment never
 * disappears just because a category/visibility filter would
 * otherwise hide it (see isLaneVisible/isPlayerVisible in
 * cooldownPlannerFilters.ts).
 */
export function CooldownPlanFilterToolbar({
  categories,
  active,
  onChange,
  alwaysShowAssigned,
  onToggleAlwaysShowAssigned
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

      <button
        aria-pressed={alwaysShowAssigned}
        className={
          alwaysShowAssigned
            ? "cooldown-plan-filter-safety is-active"
            : "cooldown-plan-filter-safety"
        }
        onClick={onToggleAlwaysShowAssigned}
        title="Keep already-planned cooldowns visible even if a filter would otherwise hide them"
        type="button"
      >
        Always Show Assigned
      </button>
    </div>
  );
}
