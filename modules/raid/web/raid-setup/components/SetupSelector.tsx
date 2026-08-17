import { useState } from "react";
import type { RaidSetup } from "../types/raidSetup.types";

type SetupSelectorProps = {
  setups: RaidSetup[];
  selectedSetupId: string | null;
  onSelect: (setupId: string) => void;
  isSubmitting: boolean;
  /**
   * Omit to render selection-only — used by the Cooldown Planner,
   * which consumes the selected Setup but must never become a second
   * place Setups are created (that stays exclusively on the Setup/
   * BossRoster surface).
   */
  onCreate?: (name: string) => Promise<void>;
};

/**
 * The one shared Setup-selection control, reused as-is (not
 * reimplemented) everywhere a Setup needs picking — currently the
 * Setup/BossRoster panel (with creation) and the Cooldown Planner
 * workspace header (selection only). Creation is a compact toggle-
 * revealed name input, matching this app's existing inline-form
 * convention (e.g. BossForm) rather than a modal.
 */
export function SetupSelector({
  setups,
  selectedSetupId,
  onSelect,
  isSubmitting,
  onCreate
}: SetupSelectorProps) {
  const [isCreating, setIsCreating] =
    useState(false);

  const [newSetupName, setNewSetupName] =
    useState("");

  const handleCreate = async () => {
    if (!onCreate || !newSetupName.trim()) {
      return;
    }

    await onCreate(newSetupName.trim());

    setNewSetupName("");
    setIsCreating(false);
  };

  return (
    <div className="setup-selector">
      <select
        aria-label="Switch Setup"
        className="setup-selector-select"
        disabled={isSubmitting}
        onChange={(event) =>
          onSelect(event.target.value)
        }
        value={selectedSetupId ?? ""}
      >
        {setups.map((setup) => (
          <option
            key={setup.id}
            value={setup.id}
          >
            {setup.name}
          </option>
        ))}
      </select>

      {onCreate && (
        isCreating ? (
          <span className="setup-selector-create-form">
            <input
              autoFocus
              onChange={(event) =>
                setNewSetupName(
                  event.target.value
                )
              }
              placeholder="e.g. Thursday Mythic"
              type="text"
              value={newSetupName}
            />

            <button
              className="button button-secondary"
              disabled={
                isSubmitting ||
                !newSetupName.trim()
              }
              onClick={() =>
                void handleCreate()
              }
              type="button"
            >
              Create
            </button>

            <button
              className="text-button"
              onClick={() => {
                setIsCreating(false);
                setNewSetupName("");
              }}
              type="button"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            className="setup-selector-new-button"
            onClick={() =>
              setIsCreating(true)
            }
            title="Create a new Setup for this event"
            type="button"
          >
            + New Setup
          </button>
        )
      )}
    </div>
  );
}
