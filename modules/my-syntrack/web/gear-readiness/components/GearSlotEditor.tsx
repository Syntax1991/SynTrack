import {
  useState,
  type FormEvent
} from "react";
import type {
  EnchantStatus,
  GearSlot,
  GearSlotInput
} from "../types/gearReadiness.types";

type GearSlotEditorProps = {
  slot: GearSlot;
  isSaving: boolean;
  onCancel: () => void;
  onClear: () => Promise<boolean>;
  onSave: (
    input: GearSlotInput
  ) => Promise<boolean>;
};

export function GearSlotEditor({
  slot,
  isSaving,
  onCancel,
  onClear,
  onSave
}: GearSlotEditorProps) {
  const [itemName, setItemName] =
    useState(slot.item?.itemName ?? "");
  const [itemLevel, setItemLevel] =
    useState(
      slot.item?.itemLevel?.toString() ?? ""
    );
  const [enchantStatus, setEnchantStatus] =
    useState<EnchantStatus>(
      slot.item?.enchantStatus ??
        (slot.supportsEnchant
          ? "MISSING"
          : "NOT_APPLICABLE")
    );
  const [enchantName, setEnchantName] =
    useState(slot.item?.enchantName ?? "");
  const [socketCount, setSocketCount] =
    useState(
      slot.item?.socketCount?.toString() ?? "0"
    );
  const [gemCount, setGemCount] = useState(
    slot.item?.gemCount.toString() ?? "0"
  );
  const [notes, setNotes] = useState(
    slot.item?.notes ?? ""
  );
  const [validationError, setValidationError] =
    useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedSocketCount =
      Number(socketCount);
    const normalizedGemCount =
      Number(gemCount);

    if (
      normalizedGemCount >
      normalizedSocketCount
    ) {
      setValidationError(
        "Gem count cannot exceed the number of sockets."
      );
      return;
    }

    setValidationError(null);

    const input: GearSlotInput = {
      itemName: itemName.trim(),
      enchantStatus,
      socketCount: normalizedSocketCount,
      gemCount: normalizedGemCount
    };

    if (itemLevel) {
      input.itemLevel = Number(itemLevel);
    }

    if (
      slot.supportsEnchant &&
      enchantName.trim()
    ) {
      input.enchantName =
        enchantName.trim();
    }

    if (notes.trim()) {
      input.notes = notes.trim();
    }

    if (await onSave(input)) {
      onCancel();
    }
  };

  return (
    <section className="panel gear-slot-editor">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            {slot.item
              ? "EDIT EQUIPMENT"
              : "TRACK EQUIPMENT"}
          </p>

          <h2>{slot.label}</h2>
        </div>

        <button
          className="gear-editor-close"
          onClick={onCancel}
          type="button"
        >
          Close
        </button>
      </div>

      <form
        className="gear-editor-form"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <label className="gear-editor-item-field">
          <span>Item name</span>
          <input
            autoFocus
            maxLength={120}
            onChange={(event) =>
              setItemName(event.target.value)
            }
            placeholder="Equipped item"
            required
            value={itemName}
          />
        </label>

        <label>
          <span>Item level</span>
          <input
            inputMode="numeric"
            max={1500}
            min={1}
            onChange={(event) =>
              setItemLevel(event.target.value)
            }
            placeholder="Optional"
            type="number"
            value={itemLevel}
          />
        </label>

        {slot.supportsEnchant ? (
          <>
            <label>
              <span>Enchant status</span>
              <select
                onChange={(event) =>
                  setEnchantStatus(
                    event.target
                      .value as EnchantStatus
                  )
                }
                value={enchantStatus}
              >
                <option value="MISSING">
                  Missing
                </option>
                <option value="READY">
                  Enchanted
                </option>
              </select>
            </label>

            <label>
              <span>Enchant</span>
              <input
                maxLength={120}
                onChange={(event) =>
                  setEnchantName(
                    event.target.value
                  )
                }
                placeholder="Optional name"
                value={enchantName}
              />
            </label>
          </>
        ) : (
          <div className="gear-editor-enchant-note">
            <span>Enchant</span>
            <strong>Not applicable</strong>
            <small>
              This slot is not evaluated for
              an enchant.
            </small>
          </div>
        )}

        <label>
          <span>Sockets</span>
          <input
            inputMode="numeric"
            max={6}
            min={0}
            onChange={(event) =>
              setSocketCount(
                event.target.value
              )
            }
            required
            type="number"
            value={socketCount}
          />
        </label>

        <label>
          <span>Gems inserted</span>
          <input
            inputMode="numeric"
            max={6}
            min={0}
            onChange={(event) =>
              setGemCount(event.target.value)
            }
            required
            type="number"
            value={gemCount}
          />
        </label>

        <label className="gear-editor-notes-field">
          <span>Notes</span>
          <textarea
            maxLength={300}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Upgrade target or preparation note"
            rows={3}
            value={notes}
          />
        </label>

        {validationError && (
          <p className="gear-editor-error">
            {validationError}
          </p>
        )}

        <div className="gear-editor-actions">
          {slot.item && (
            <button
              className="gear-editor-clear"
              disabled={isSaving}
              onClick={() => {
                void onClear().then(
                  (cleared) => {
                    if (cleared) {
                      onCancel();
                    }
                  }
                );
              }}
              type="button"
            >
              Clear slot
            </button>
          )}

          <button
            className="button button-secondary"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>

          <button
            className="button button-primary"
            disabled={isSaving}
            type="submit"
          >
            {isSaving
              ? "Saving..."
              : "Save equipment"}
          </button>
        </div>
      </form>
    </section>
  );
}
