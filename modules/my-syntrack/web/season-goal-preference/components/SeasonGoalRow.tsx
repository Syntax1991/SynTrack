import type {
  SeasonGoalDefinition,
  SeasonGoalPreferenceValue
} from "../types/seasonGoalPreference.types.js";

type SeasonGoalRowProps = {
  definition: SeasonGoalDefinition;
  value: SeasonGoalPreferenceValue;
  onChange: (next: SeasonGoalPreferenceValue) => void;
  onReset: () => void;
  isOverridden: boolean;
};

/*
 * One configurable Season goal row: enable/disable, a numeric target with
 * presets (Score/Resi), or an enum target select (Raid). Saves happen
 * immediately via onChange — there is no separate "Save" step, matching the
 * rest of SynTrack's compact settings surfaces.
 */
export function SeasonGoalRow({
  definition,
  value,
  onChange,
  onReset,
  isOverridden
}: SeasonGoalRowProps) {
  return (
    <div className="season-goal-row">
      <div className="season-goal-row-label">
        <span>{definition.label}</span>
        {isOverridden && (
          <button
            className="text-button season-goal-reset"
            onClick={onReset}
            type="button"
          >
            Reset to default
          </button>
        )}
      </div>

      <div className="season-goal-row-controls">
        {definition.targetType !== "ENUM" && (
          <label className="season-goal-enabled">
            <input
              checked={value.enabled}
              onChange={(event) =>
                onChange({ ...value, enabled: event.target.checked })
              }
              type="checkbox"
            />
            Enabled
          </label>
        )}

        {definition.targetType === "NUMBER" && value.enabled && (
          <span className="season-goal-target">
            {definition.numericPresets?.map((preset) => (
              <button
                className={
                  value.numericTarget === preset
                    ? "chip chip-active"
                    : "chip"
                }
                key={preset}
                onClick={() =>
                  onChange({ ...value, numericTarget: preset })
                }
                type="button"
              >
                {preset}
              </button>
            ))}
            <input
              className="season-goal-target-input"
              min={definition.minNumericTarget ?? undefined}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                onChange({
                  ...value,
                  numericTarget: Number.isFinite(parsed) ? parsed : null
                });
              }}
              type="number"
              value={value.numericTarget ?? ""}
            />
          </span>
        )}

        {definition.targetType === "ENUM" && (
          <select
            onChange={(event) =>
              onChange({
                ...value,
                enabled: event.target.value !== "OFF",
                enumTarget: event.target.value
              })
            }
            value={value.enumTarget ?? definition.defaultEnumTarget ?? ""}
          >
            {definition.enumOptions?.map((option) => (
              <option key={option} value={option}>
                {option === "OFF" ? "Off" : option}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
