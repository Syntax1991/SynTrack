import type { BonusRoll, BonusRollResultInput } from "../types/bonusRoll.types";
import { BonusRollResultEditor } from "./BonusRollResultEditor";
import { ItemIcon } from "./ItemIcon";

type BonusRollRowProps = {
  roll: BonusRoll;
  isEditing: boolean;
  onEdit: () => void;
  onCloseEditor: () => void;
  onRecordResult: (input: BonusRollResultInput) => Promise<void>;
  onClearResult: () => void;
  onDelete: () => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function StatusBadge({ roll }: { roll: BonusRoll }) {
  if (roll.status === "PLANNED") {
    return <span className="bonus-roll-badge bonus-roll-badge-planned">Planned</span>;
  }

  if (roll.outcome === "ITEM" && roll.receivedItem) {
    return roll.gotTarget
      ? <span className="bonus-roll-badge bonus-roll-badge-target">Target received</span>
      : <span className="bonus-roll-badge bonus-roll-badge-item">Other item</span>;
  }

  return <span className="bonus-roll-badge bonus-roll-badge-gold">Gold only</span>;
}

/*
 * One planned or used roll: the item it is about, the boss, and its
 * state. Recording a result expands an editor directly below the row.
 */
export function BonusRollRow({
  roll,
  isEditing,
  onEdit,
  onCloseEditor,
  onRecordResult,
  onClearResult,
  onDelete
}: BonusRollRowProps) {
  const shownItem = roll.receivedItem ?? roll.targetItem;
  const otherItem = roll.status === "ROLLED" && roll.receivedItem && !roll.gotTarget ? roll.receivedItem : null;

  return (
    <li aria-label={`${roll.character.name} – ${roll.encounter.name}`} className="bonus-roll-row">
      <div className="bonus-roll-row-main">
        <ItemIcon iconUrl={shownItem?.iconUrl} size="md" />

        <div className="bonus-roll-row-text">
          <strong>{roll.targetItem ? roll.targetItem.name : "Any item"}</strong>
          <span className="bonus-roll-row-meta">
            {roll.encounter.name}
            <span aria-hidden="true"> · </span>
            {roll.instance.name}
          </span>
          {otherItem && <span className="bonus-roll-row-received">Got {otherItem.name}</span>}
          {roll.note && <span className="bonus-roll-row-note">{roll.note}</span>}
        </div>

        <div className="bonus-roll-row-status">
          <StatusBadge roll={roll} />
          {roll.rolledAt && <span className="bonus-roll-row-date">{formatDate(roll.rolledAt)}</span>}
        </div>

        <div className="bonus-roll-row-actions">
          {!isEditing && (
            <button
              className={roll.status === "PLANNED" ? "button button-secondary button-compact" : "text-button"}
              onClick={onEdit}
              type="button"
            >
              {roll.status === "PLANNED" ? "Enter result" : "Edit result"}
            </button>
          )}
          {roll.status === "ROLLED" && !isEditing && (
            <button className="text-button" onClick={onClearResult} type="button">
              Back to planned
            </button>
          )}
          <button
            aria-label="Delete"
            className="bonus-roll-icon-button"
            onClick={onDelete}
            title="Delete roll"
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </div>

      {isEditing && (
        <BonusRollResultEditor
          onCancel={onCloseEditor}
          onSave={async (input) => {
            await onRecordResult(input);
            onCloseEditor();
          }}
          roll={roll}
        />
      )}
    </li>
  );
}
