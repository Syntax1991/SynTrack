import {
  useState,
  type FormEvent,
  type MouseEvent
} from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import {
  getSpellsForClass,
  type RaidCooldownSpell
} from "../../../shared/catalog/raidCooldownSpellCatalog";
import { formatSeconds } from "../utils/timelineFormat";

type CooldownCreatePopoverProps = {
  member: GuildMember;
  seconds: number;
  onSelectSpell: (
    spell: RaidCooldownSpell
  ) => void;
  onSelectFreeText: (
    name: string
  ) => void;
  onCancel: () => void;
};

/**
 * Player and timestamp are already known from where the row was
 * clicked — this only ever asks for the one thing still missing: the
 * spell. No player selector, no timestamp input.
 */
export function CooldownCreatePopover({
  member,
  seconds,
  onSelectSpell,
  onSelectFreeText,
  onCancel
}: CooldownCreatePopoverProps) {
  const [useFreeText, setUseFreeText] =
    useState(false);

  const [freeTextValue, setFreeTextValue] =
    useState("");

  const spells = getSpellsForClass(
    member.className
  );

  const byCategory = new Map<
    string,
    RaidCooldownSpell[]
  >();

  for (const spell of spells) {
    const group =
      byCategory.get(
        spell.category
      ) ?? [];

    group.push(spell);
    byCategory.set(
      spell.category,
      group
    );
  }

  const stopBubble = (
    event: MouseEvent
  ) => {
    event.stopPropagation();
  };

  const handleFreeTextSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmed =
      freeTextValue.trim();

    if (trimmed) {
      onSelectFreeText(trimmed);
    }
  };

  return (
    <div
      className="cooldown-create-popover"
      onClick={stopBubble}
      onMouseDown={stopBubble}
    >
      <div className="cooldown-create-popover-header">
        {member.name} ·{" "}
        {formatSeconds(seconds)}
      </div>

      {useFreeText ? (
        <form
          className="cooldown-create-popover-freetext"
          onSubmit={
            handleFreeTextSubmit
          }
        >
          <input
            autoFocus
            maxLength={80}
            onChange={(event) =>
              setFreeTextValue(
                event.target.value
              )
            }
            placeholder="Ability name"
            value={freeTextValue}
          />

          <button
            className="button button-primary"
            disabled={
              !freeTextValue.trim()
            }
            type="submit"
          >
            Add
          </button>
        </form>
      ) : (
        <div className="cooldown-create-popover-spells">
          {spells.length === 0 ? (
            <p className="muted-text">
              No catalogued spells
              for {member.className}.
            </p>
          ) : (
            Array.from(
              byCategory.entries()
            ).map(
              ([
                category,
                group
              ]) => (
                <div
                  className="cooldown-create-popover-category"
                  key={category}
                >
                  <span className="cooldown-create-popover-category-label">
                    {category}
                  </span>

                  {group.map(
                    (spell) => (
                      <button
                        className="cooldown-create-popover-spell"
                        key={
                          spell.spellId
                        }
                        onClick={() =>
                          onSelectSpell(
                            spell
                          )
                        }
                        type="button"
                      >
                        <img
                          alt=""
                          src={
                            spell.icon
                          }
                        />

                        <span>
                          {spell.name}
                        </span>
                      </button>
                    )
                  )}
                </div>
              )
            )
          )}
        </div>
      )}

      <div className="cooldown-create-popover-footer">
        <button
          className="text-button"
          onClick={() =>
            setUseFreeText(
              (current) => !current
            )
          }
          type="button"
        >
          {useFreeText
            ? "Use spell picker instead"
            : "Can't find it? Type a name instead"}
        </button>

        <button
          className="text-button"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
