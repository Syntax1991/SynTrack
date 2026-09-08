import { useEffect, useState } from "react";
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

const MAX_NUMERIC_TARGET = 99999;

function parseNumericDraft(
  draft: string,
  minNumericTarget: number
): number | null {
  const trimmed = draft.trim();

  if (trimmed === "") {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (
    !Number.isInteger(parsed) ||
    parsed < minNumericTarget ||
    parsed > MAX_NUMERIC_TARGET
  ) {
    return null;
  }

  return parsed;
}

/*
 * One configurable Season goal row: enable/disable, a numeric target with
 * presets (Score/Resi), or an enum target select (Raid).
 *
 * Checkboxes, chips, and the Raid select save immediately. The number
 * field keeps a local draft while focused so typing 2000 → 3150 does not
 * POST/reload on every digit (that remounted the input and made Score
 * uneditable). Commit is blur or Enter.
 */
export function SeasonGoalRow({
  definition,
  value,
  onChange,
  onReset,
  isOverridden
}: SeasonGoalRowProps) {
  const [numericDraft, setNumericDraft] = useState<string | null>(null);

  useEffect(() => {
    setNumericDraft(null);
  }, [value.numericTarget]);

  const minNumericTarget = definition.minNumericTarget ?? 1;
  const numericDisplay =
    numericDraft ??
    (value.numericTarget === null ? "" : String(value.numericTarget));

  function commitNumericDraft() {
    if (numericDraft === null) {
      return;
    }

    const parsed = parseNumericDraft(numericDraft, minNumericTarget);

    if (parsed === null || parsed === value.numericTarget) {
      setNumericDraft(null);
      return;
    }

    onChange({ ...value, numericTarget: parsed });
  }

  return (
    <div className="season-goal-row">
      <div className="season-goal-row-label">
        <div className="season-goal-row-copy">
          <span>{definition.label}</span>
          <p className="season-goal-row-detail">{definition.detail}</p>
        </div>
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
              aria-label={`Enable ${definition.label}`}
              checked={value.enabled}
              className="season-goal-checkbox"
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
                    ? "season-goal-chip season-goal-chip-active"
                    : "season-goal-chip"
                }
                key={preset}
                onClick={() => {
                  setNumericDraft(null);
                  onChange({ ...value, numericTarget: preset });
                }}
                type="button"
              >
                {preset}
              </button>
            ))}
            <input
              aria-label={`${definition.label} target`}
              autoComplete="off"
              className="season-goal-target-input"
              inputMode="numeric"
              onBlur={commitNumericDraft}
              onChange={(event) => {
                const next = event.target.value;

                if (next !== "" && !/^\d+$/.test(next)) {
                  return;
                }

                setNumericDraft(next);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              value={numericDisplay}
            />
          </span>
        )}

        {definition.targetType === "ENUM" && (
          <select
            aria-label={`${definition.label} target`}
            className="season-goal-select"
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
