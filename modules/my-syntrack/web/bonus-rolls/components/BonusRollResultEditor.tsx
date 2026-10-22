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

const outcomes: { value: BonusRollOutcome; label: string }[] = [
  { value: "ITEM", label: "Item received" },
  { value: "NO_ITEM", label: "Gold only" }
];

/*
 * "What did the character get?" - an item from this boss's loot table
 * (pre-selected with the planned target) or gold only.
 */
export function BonusRollResultEditor({ roll, onSave, onCancel }: BonusRollResultEditorProps) {
  const [outcome, setOutcome] = useState<BonusRollOutcome>(roll.outcome ?? "ITEM");
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
      <div aria-label="Result" className="bonus-roll-segmented" role="radiogroup">
        {outcomes.map((entry) => (
          <button
            aria-checked={outcome === entry.value}
            className={outcome === entry.value ? "active" : undefined}
            key={entry.value}
            onClick={() => setOutcome(entry.value)}
            role="radio"
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>

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
        <button className="button button-ghost" onClick={onCancel} type="button">Cancel</button>
      </div>
    </div>
  );
}
