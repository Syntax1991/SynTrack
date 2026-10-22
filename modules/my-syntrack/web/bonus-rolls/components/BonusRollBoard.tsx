import { useState } from "react";
import { CharacterNameWithIcon } from "../../../../../apps/web/src/shared/components/CharacterNameWithIcon";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { BonusRoll, BonusRollResultInput } from "../types/bonusRoll.types";
import { BonusRollRow } from "./BonusRollRow";

type Filter = "ALL" | "PLANNED" | "ROLLED";

type BonusRollBoardProps = {
  rolls: BonusRoll[];
  onRecordResult: (id: string, input: BonusRollResultInput) => Promise<void>;
  onClearResult: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type CharacterGroup = {
  character: BonusRoll["character"];
  rolls: BonusRoll[];
};

/* Planned first (still to do), then the newest results. */
function byWorkOrder(left: BonusRoll, right: BonusRoll): number {
  if (left.status !== right.status) return left.status === "PLANNED" ? -1 : 1;
  return (right.rolledAt ?? right.createdAt).localeCompare(left.rolledAt ?? left.createdAt);
}

function groupByCharacter(rolls: BonusRoll[]): CharacterGroup[] {
  const groups = new Map<string, CharacterGroup>();

  for (const roll of rolls) {
    const group = groups.get(roll.character.id) ?? { character: roll.character, rolls: [] };
    group.rolls.push(roll);
    groups.set(roll.character.id, group);
  }

  return [...groups.values()]
    .map((group) => ({ ...group, rolls: [...group.rolls].sort(byWorkOrder) }))
    .sort((left, right) => left.character.name.localeCompare(right.character.name));
}

export function BonusRollBoard({ rolls, onRecordResult, onClearResult, onDelete }: BonusRollBoardProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);

  const counts = {
    ALL: rolls.length,
    PLANNED: rolls.filter((roll) => roll.status === "PLANNED").length,
    ROLLED: rolls.filter((roll) => roll.status === "ROLLED").length
  };
  const visible = filter === "ALL" ? rolls : rolls.filter((roll) => roll.status === filter);
  const groups = groupByCharacter(visible);

  if (rolls.length === 0) {
    return (
      <section className="panel bonus-roll-empty">
        <h2>No bonus rolls yet</h2>
        <p>Plan the first one with the planner – pick a character, a boss and the item they are after.</p>
      </section>
    );
  }

  return (
    <section aria-label="Bonus rolls" className="bonus-roll-board">
      <div className="bonus-roll-board-toolbar">
        <div aria-label="Filter rolls" className="bonus-roll-segmented" role="radiogroup">
          {(["ALL", "PLANNED", "ROLLED"] as const).map((value) => (
            <button
              aria-checked={filter === value}
              className={filter === value ? "active" : undefined}
              key={value}
              onClick={() => setFilter(value)}
              role="radio"
              type="button"
            >
              {value === "ALL" ? "All" : value === "PLANNED" ? "Planned" : "Rolled"}
              <span className="bonus-roll-count">{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && <p className="bonus-roll-filter-empty">Nothing here for this filter.</p>}

      {groups.map((group) => {
        const planned = group.rolls.filter((roll) => roll.status === "PLANNED").length;

        return (
          <article className="panel bonus-roll-group" key={group.character.id}>
            <header className="bonus-roll-group-header">
              <CharacterNameWithIcon size="md" wowClassName={group.character.className}>
                <span className="bonus-roll-group-name">
                  <strong style={{ color: getClassColor(group.character.className) }}>{group.character.name}</strong>
                  <span>{group.character.realm}</span>
                </span>
              </CharacterNameWithIcon>
              <span className="bonus-roll-group-count">
                {planned} planned · {group.rolls.length - planned} rolled
              </span>
            </header>

            <ul className="bonus-roll-rows">
              {group.rolls.map((roll) => (
                <BonusRollRow
                  isEditing={editingId === roll.id}
                  key={roll.id}
                  onClearResult={() => void onClearResult(roll.id).catch(() => undefined)}
                  onCloseEditor={() => setEditingId(null)}
                  onDelete={() => {
                    if (window.confirm(`Delete the bonus roll on ${roll.encounter.name} for ${roll.character.name}?`)) {
                      void onDelete(roll.id).catch(() => undefined);
                    }
                  }}
                  onEdit={() => setEditingId(roll.id)}
                  onRecordResult={(input) => onRecordResult(roll.id, input)}
                  roll={roll}
                />
              ))}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
