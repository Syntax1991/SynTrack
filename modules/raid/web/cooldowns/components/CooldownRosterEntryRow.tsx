import type { CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import type { RaidSpecialization } from "../../../shared/catalog/raidSpecializationCatalog";
import {
  EyeIcon,
  EyeOffIcon,
  SpellSettingsIcon
} from "./CooldownRosterIcons";

type CooldownRosterEntryRowProps = {
  member: GuildMember;
  spec: RaidSpecialization | null;
  isHidden: boolean;
  isSelected: boolean;
  isPlanMember: boolean;
  hasAssignments: boolean;
  onSelectToggle: (memberId: string) => void;
  onToggleHidden: (memberId: string) => void;
  onAddPlanMember: (memberId: string) => void;
  onRemovePlanMember: (memberId: string) => void;
};

/**
 * One roster row in Timeline Controls — extracted from
 * CooldownRosterPanel purely to stay under the architecture line
 * limit. Behavior is unchanged: name/gear both toggle selection, the
 * eye is a local display-only hide, and +/✓ is the only control that
 * writes anything (RaidCooldownPlanMember).
 */
export function CooldownRosterEntryRow({
  member,
  spec,
  isHidden,
  isSelected,
  isPlanMember,
  hasAssignments,
  onSelectToggle,
  onToggleHidden,
  onAddPlanMember,
  onRemovePlanMember
}: CooldownRosterEntryRowProps) {
  const rowClassName = [
    "cooldown-roster-entry",
    isHidden ? "is-hidden" : null,
    isSelected ? "is-selected" : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rowClassName}
      style={
        {
          "--marker-color":
            resolveClassColor(
              member.className
            )
        } as CSSProperties
      }
    >
      <button
        className={
          isSelected
            ? "cooldown-roster-entry-name is-selected"
            : "cooldown-roster-entry-name"
        }
        onClick={() =>
          onSelectToggle(member.id)
        }
        title={
          spec
            ? `${spec.name} ${member.className} · ${spec.role}`
            : undefined
        }
        type="button"
      >
        {spec && (
          <img
            alt=""
            className="cooldown-roster-entry-spec-icon"
            src={spec.icon}
          />
        )}

        <span className="cooldown-roster-entry-name-text">
          {member.name}
        </span>
      </button>

      <button
        aria-label={
          isHidden
            ? `Show ${member.name} in PLAN`
            : `Hide ${member.name} from PLAN`
        }
        className="cooldown-roster-entry-visibility"
        onClick={() =>
          onToggleHidden(member.id)
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

      <button
        aria-label={`Open ${member.name}'s spell controls`}
        className={
          isSelected
            ? "cooldown-roster-entry-visibility is-selected"
            : "cooldown-roster-entry-visibility"
        }
        onClick={() =>
          onSelectToggle(member.id)
        }
        title="Spell visibility for this player"
        type="button"
      >
        <SpellSettingsIcon />
      </button>

      {isPlanMember ? (
        <button
          aria-label={`Remove ${member.name} from the Cooldown Plan`}
          className="cooldown-roster-entry-plan-toggle is-in-plan"
          disabled={hasAssignments}
          onClick={() =>
            onRemovePlanMember(member.id)
          }
          title={
            hasAssignments
              ? "In this Cooldown Plan — remove assignments before removing this player from the timeline."
              : "In this Cooldown Plan — click to remove from Timeline"
          }
          type="button"
        >
          ×
        </button>
      ) : (
        <button
          aria-label={`Add ${member.name} to the Cooldown Plan`}
          className="cooldown-roster-entry-plan-toggle"
          onClick={() =>
            onAddPlanMember(member.id)
          }
          title="Not in this Cooldown Plan — click to add to Timeline"
          type="button"
        >
          +
        </button>
      )}
    </div>
  );
}
