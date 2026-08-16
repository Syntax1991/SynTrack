import type { CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import { getSpellsForClass } from "../../../shared/catalog/raidCooldownSpellCatalog";
import { cooldownCategoryLabels } from "../utils/cooldownCategories";
import { EyeIcon, EyeOffIcon } from "./CooldownRosterIcons";

type CooldownRosterSpellPanelProps = {
  member: GuildMember;
  hiddenSpellIds: Set<number>;
  onToggleSpell: (spellId: number) => void;
};

/**
 * The selected player's real, catalogued class spells — never a
 * fabricated or free-text list. This is a planning-context control,
 * not a second timeline: hiding a spell here only ever affects
 * PLAN's display/creation filtering (see cooldownPlannerFilters.ts),
 * it never touches RaidCooldownAssignment. Rendering this for a
 * player with zero assignments is exactly what turns "I selected
 * Brightwow" into "I can now plan Brightwow" instead of a dead page.
 */
export function CooldownRosterSpellPanel({
  member,
  hiddenSpellIds,
  onToggleSpell
}: CooldownRosterSpellPanelProps) {
  const spells = getSpellsForClass(
    member.className
  );

  return (
    <div
      className="cooldown-roster-spell-panel"
      style={
        {
          "--marker-color":
            resolveClassColor(
              member.className
            )
        } as CSSProperties
      }
    >
      <div className="cooldown-roster-spell-panel-header">
        {member.name}
      </div>

      <span className="cooldown-roster-panel-label">
        Spells
      </span>

      {spells.length === 0 ? (
        <p className="cooldown-roster-spell-panel-empty">
          No catalogued cooldowns for{" "}
          {member.className}.
        </p>
      ) : (
        <div className="cooldown-roster-spell-panel-list">
          {spells.map((spell) => {
            const isHidden =
              hiddenSpellIds.has(
                spell.spellId
              );

            return (
              <div
                className={
                  isHidden
                    ? "cooldown-roster-spell-row is-hidden"
                    : "cooldown-roster-spell-row"
                }
                key={spell.spellId}
              >
                <button
                  aria-label={
                    isHidden
                      ? `Show ${spell.name} for ${member.name}`
                      : `Hide ${spell.name} for ${member.name}`
                  }
                  className="cooldown-roster-entry-visibility"
                  onClick={() =>
                    onToggleSpell(
                      spell.spellId
                    )
                  }
                  title={
                    isHidden
                      ? "Hidden from PLAN — click to show"
                      : "Visible in PLAN — click to hide"
                  }
                  type="button"
                >
                  {isHidden ? (
                    <EyeOffIcon />
                  ) : (
                    <EyeIcon />
                  )}
                </button>

                <img
                  alt=""
                  className="cooldown-roster-spell-row-icon"
                  src={spell.icon}
                />

                <span className="cooldown-roster-spell-row-name">
                  {spell.name}
                </span>

                <span className="cooldown-roster-spell-row-category">
                  {
                    cooldownCategoryLabels[
                      spell.category
                    ]
                  }
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
