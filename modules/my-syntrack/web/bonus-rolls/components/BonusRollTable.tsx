import { useState } from "react";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { BonusRoll, BonusRollResultInput } from "../types/bonusRoll.types";
import { BonusRollResultEditor } from "./BonusRollResultEditor";

type BonusRollTableProps = {
  rolls: BonusRoll[];
  onRecordResult: (id: string, input: BonusRollResultInput) => Promise<void>;
  onClearResult: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ResultCell({ roll }: { roll: BonusRoll }) {
  if (roll.status === "PLANNED") {
    return <span className="bonus-roll-badge bonus-roll-badge-planned">Planned</span>;
  }

  return (
    <div className="bonus-roll-result">
      {roll.outcome === "ITEM" && roll.receivedItem ? (
        <span className={roll.gotTarget ? "bonus-roll-badge bonus-roll-badge-target" : "bonus-roll-badge bonus-roll-badge-item"}>
          {roll.gotTarget ? "Target received: " : "Received: "}
          {roll.receivedItem.name}
        </span>
      ) : (
        <span className="bonus-roll-badge bonus-roll-badge-gold">No item (gold)</span>
      )}
      {roll.rolledAt && <span className="muted-text">{formatDate(roll.rolledAt)}</span>}
    </div>
  );
}

export function BonusRollTable({ rolls, onRecordResult, onClearResult, onDelete }: BonusRollTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (rolls.length === 0) {
    return (
      <p className="bonus-roll-empty">
        No bonus rolls planned yet. Pick a character, a boss and the item you want above.
      </p>
    );
  }

  return (
    <div className="table-scroll">
      <table className="bonus-roll-table">
        <thead>
          <tr>
            <th>Character</th>
            <th>Boss</th>
            <th>Target</th>
            <th>Result</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rolls.map((roll) => (
            <tr key={roll.id}>
              <td>
                <strong style={{ color: getClassColor(roll.character.className) }}>{roll.character.name}</strong>
                <span className="bonus-roll-subline">{roll.character.realm}</span>
              </td>
              <td>
                <strong>{roll.encounter.name}</strong>
                <span className="bonus-roll-subline">{roll.instance.name}</span>
              </td>
              <td>
                {roll.targetItem ? roll.targetItem.name : <span className="muted-text">No specific target</span>}
                {roll.note && <span className="bonus-roll-subline">{roll.note}</span>}
              </td>
              <td>
                {editingId === roll.id ? (
                  <BonusRollResultEditor
                    onCancel={() => setEditingId(null)}
                    onSave={async (input) => {
                      await onRecordResult(roll.id, input);
                      setEditingId(null);
                    }}
                    roll={roll}
                  />
                ) : (
                  <ResultCell roll={roll} />
                )}
              </td>
              <td>
                <div className="table-actions">
                  {editingId !== roll.id && (
                    <button className="text-button" onClick={() => setEditingId(roll.id)} type="button">
                      {roll.status === "PLANNED" ? "Enter result" : "Edit result"}
                    </button>
                  )}
                  {roll.status === "ROLLED" && editingId !== roll.id && (
                    <button className="text-button" onClick={() => void onClearResult(roll.id).catch(() => undefined)} type="button">
                      Back to planned
                    </button>
                  )}
                  <button
                    className="text-button danger"
                    onClick={() => {
                      if (window.confirm(`Delete the bonus roll on ${roll.encounter.name} for ${roll.character.name}?`)) {
                        void onDelete(roll.id).catch(() => undefined);
                      }
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
