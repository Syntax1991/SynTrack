import { useState } from "react";
import type {
  TrackerDefinitionCreateInput,
  TrackerResetBehavior,
  TrackerValueType
} from "../types/tracker.types";

type AddTrackerFormProps = {
  onCreate: (
    input: Omit<
      TrackerDefinitionCreateInput,
      "scopeKey"
    >
  ) => Promise<void>;
};

export function AddTrackerForm({
  onCreate
}: AddTrackerFormProps) {
  const [name, setName] = useState("");

  const [valueType, setValueType] =
    useState<TrackerValueType>(
      "BOOLEAN"
    );

  const [
    resetBehavior,
    setResetBehavior
  ] = useState<TrackerResetBehavior>(
    "WEEKLY"
  );

  const [isSaving, setIsSaving] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (name.trim().length === 0) {
      return;
    }

    setIsSaving(true);

    try {
      await onCreate({
        key: name,
        name: name.trim(),
        valueType,
        resetBehavior
      });

      setName("");
    }
    finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="tracker-manager-add-form"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <input
        aria-label="New tracker name"
        onChange={(event) =>
          setName(event.target.value)
        }
        placeholder="New tracker (e.g. World Tour)"
        type="text"
        value={name}
      />

      <select
        aria-label="Value type"
        onChange={(event) =>
          setValueType(
            event.target
              .value as TrackerValueType
          )
        }
        value={valueType}
      >
        <option value="BOOLEAN">
          Boolean
        </option>
        <option value="PROGRESS">
          Progress
        </option>
        <option value="NUMBER">
          Number
        </option>
        <option value="TEXT">
          Text
        </option>
      </select>

      <select
        aria-label="Reset behavior"
        onChange={(event) =>
          setResetBehavior(
            event.target
              .value as TrackerResetBehavior
          )
        }
        value={resetBehavior}
      >
        <option value="WEEKLY">
          Weekly
        </option>
        <option value="SEASONAL">
          Seasonal
        </option>
        <option value="PERMANENT">
          Permanent
        </option>
      </select>

      <button
        disabled={isSaving}
        type="submit"
      >
        Add
      </button>
    </form>
  );
}
