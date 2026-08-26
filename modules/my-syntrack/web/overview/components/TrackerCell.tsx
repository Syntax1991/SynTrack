import { useState } from "react";
import {
  clearTrackerValue,
  setTrackerValue
} from "../../trackers/api/trackerApi";
import type {
  CharacterTrackerState,
  TrackerDefinitionView
} from "../types/overview.types";
import { formatTrackerToken } from "../utils/trackerCellFormatting";
import { StatusToken } from "./StatusToken";

type TrackerCellProps = {
  definition: TrackerDefinitionView;
  trackerState: CharacterTrackerState | undefined;
  characterId: string;
  onChanged: () => void;
};

/*
 * BOOLEAN preserves all three real product states: UNKNOWN (no row) ->
 * FALSE (explicitly incomplete) -> TRUE (explicitly complete) -> back
 * to UNKNOWN via an explicit clear, never collapsing UNKNOWN and false.
 */
function BooleanTrackerCell({
  definition,
  trackerState,
  characterId,
  onChanged
}: TrackerCellProps) {
  const [isSaving, setIsSaving] =
    useState(false);

  const currentBoolean =
    trackerState?.value?.valueType ===
    "BOOLEAN"
      ? trackerState.value.boolean
      : null;

  async function cycle() {
    setIsSaving(true);

    try {
      if (currentBoolean === null) {
        await setTrackerValue(
          definition.id,
          characterId,
          {
            valueType: "BOOLEAN",
            boolean: false
          }
        );
      }
      else if (
        currentBoolean === false
      ) {
        await setTrackerValue(
          definition.id,
          characterId,
          {
            valueType: "BOOLEAN",
            boolean: true
          }
        );
      }
      else {
        await clearTrackerValue(
          definition.id,
          characterId
        );
      }

      onChanged();
    }
    finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      className="overview-tracker-cell-button"
      disabled={isSaving}
      onClick={() => {
        void cycle();
      }}
      title={`${definition.name} - click to change (? unknown -> ○ incomplete -> ✓ complete)`}
      type="button"
    >
      <StatusToken
        token={formatTrackerToken(
          trackerState
        )}
      />
    </button>
  );
}

function parseEditableValue(
  definition: TrackerDefinitionView,
  draft: {
    current: string;
    total: string;
    number: string;
    text: string;
  }
) {
  if (definition.valueType === "PROGRESS") {
    return {
      valueType: "PROGRESS" as const,
      current:
        Number.parseInt(
          draft.current,
          10
        ) || 0,
      total:
        Number.parseInt(
          draft.total,
          10
        ) || 0
    };
  }

  if (definition.valueType === "NUMBER") {
    return {
      valueType: "NUMBER" as const,
      number:
        Number.parseInt(
          draft.number,
          10
        ) || 0
    };
  }

  return {
    valueType: "TEXT" as const,
    text: draft.text
  };
}

/*
 * Shared low-friction inline editor for PROGRESS/NUMBER/TEXT - the
 * whole point is checking/updating a tracker without leaving the
 * matrix, matching the workbook's low-friction editing.
 */
function EditableTrackerCell({
  definition,
  trackerState,
  characterId,
  onChanged
}: TrackerCellProps) {
  const [isEditing, setIsEditing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const value = trackerState?.value;

  const [draft, setDraft] = useState(
    () => ({
      current:
        value?.valueType === "PROGRESS"
          ? String(value.current)
          : "0",
      total:
        value?.valueType === "PROGRESS"
          ? String(value.total)
          : "1",
      number:
        value?.valueType === "NUMBER"
          ? String(value.number)
          : "0",
      text:
        value?.valueType === "TEXT"
          ? value.text
          : ""
    })
  );

  if (!isEditing) {
    return (
      <button
        className="overview-tracker-cell-button"
        onClick={() =>
          setIsEditing(true)
        }
        title={`${definition.name} - click to edit`}
        type="button"
      >
        <StatusToken
          token={formatTrackerToken(
            trackerState
          )}
        />
      </button>
    );
  }

  async function save() {
    setIsSaving(true);

    try {
      await setTrackerValue(
        definition.id,
        characterId,
        parseEditableValue(
          definition,
          draft
        )
      );

      setIsEditing(false);
      onChanged();
    }
    finally {
      setIsSaving(false);
    }
  }

  async function clear() {
    setIsSaving(true);

    try {
      await clearTrackerValue(
        definition.id,
        characterId
      );

      setIsEditing(false);
      onChanged();
    }
    finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="overview-tracker-edit-popover">
      {definition.valueType ===
        "PROGRESS" && (
        <>
          <input
            aria-label="Current"
            className="overview-tracker-edit-input overview-tracker-edit-input-narrow"
            onChange={(event) =>
              setDraft({
                ...draft,
                current:
                  event.target.value
              })
            }
            type="number"
            value={draft.current}
          />
          <span>/</span>
          <input
            aria-label="Total"
            className="overview-tracker-edit-input overview-tracker-edit-input-narrow"
            onChange={(event) =>
              setDraft({
                ...draft,
                total:
                  event.target.value
              })
            }
            type="number"
            value={draft.total}
          />
        </>
      )}

      {definition.valueType ===
        "NUMBER" && (
        <input
          aria-label={definition.name}
          className="overview-tracker-edit-input"
          onChange={(event) =>
            setDraft({
              ...draft,
              number:
                event.target.value
            })
          }
          type="number"
          value={draft.number}
        />
      )}

      {definition.valueType ===
        "TEXT" && (
        <input
          aria-label={definition.name}
          className="overview-tracker-edit-input"
          onChange={(event) =>
            setDraft({
              ...draft,
              text: event.target
                .value
            })
          }
          type="text"
          value={draft.text}
        />
      )}

      <button
        aria-label="Save"
        className="overview-tracker-edit-action"
        disabled={isSaving}
        onClick={() => {
          void save();
        }}
        type="button"
      >
        ✓
      </button>

      <button
        aria-label="Clear"
        className="overview-tracker-edit-action"
        disabled={isSaving}
        onClick={() => {
          void clear();
        }}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export function TrackerCell(
  props: TrackerCellProps
) {
  if (
    props.definition.valueType ===
    "BOOLEAN"
  ) {
    return (
      <BooleanTrackerCell {...props} />
    );
  }

  return (
    <EditableTrackerCell {...props} />
  );
}
