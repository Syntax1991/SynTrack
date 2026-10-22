import { useState } from "react";
import { useJournalLoot } from "../hooks/useJournalCatalog";
import type {
  BonusRoll,
  BonusRollOutcome,
  BonusRollResultInput
} from "../types/bonusRoll.types";
import { LootItemSelect } from "./LootItemSelect";

type BonusRollResultEditorProps = {
  roll: BonusRoll;
  onSave: (input: BonusRollResultInput) => Promise<void>;
  onCancel: () => void;
};

/*
 * "What did the character get?" - an item from this boss's loot table
 * (pre-selected with the planned target) or gold only.
 */
export function BonusRollResultEditor({ roll, onSave, onCancel }: BonusRollResultEditorProps) {
  const [outcome, setOutcome] = useState<BonusRollOutcome>("ITEM");
  const [itemId, setItemId] = useState<number | null>(roll.receivedItem?.id ?? roll.targetItem?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const loot = useJournalLoot(roll.instance.id, roll.encounter.id);

  const canSave = !isSaving && (outcome === "NO_ITEM" || itemId !== null);

  const save = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      await onSave({ outcome, receivedItemId: outcome === "ITEM" ? itemId : null });
    } catch {
      // The page shows the API error; keep the editor open.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bonus-roll-result-editor">
      <label className="bonus-roll-field">
        <span>Result</span>
        <select
          aria-label="Result"
          onChange={(event) => setOutcome(event.target.value as BonusRollOutcome)}
          value={outcome}
        >
          <option value="ITEM">Item received</option>
          <option value="NO_ITEM">No item (gold)</option>
        </select>
      </label>

      {outcome === "ITEM" && (
        <LootItemSelect
          isLoading={loot.isLoading}
          items={loot.items}
          label="Received item"
          onChange={setItemId}
          value={itemId}
        />
      )}

      {loot.error && <p className="bonus-roll-catalog-error">{loot.error}</p>}

      <div className="bonus-roll-editor-actions">
        <button className="button button-primary" disabled={!canSave} onClick={() => void save()} type="button">
          {isSaving ? "Saving…" : "Save result"}
        </button>
        <button className="text-button" onClick={onCancel} type="button">Cancel</button>
      </div>
    </div>
  );
}
