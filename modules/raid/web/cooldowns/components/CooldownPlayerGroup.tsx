import type { CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import { getSpecById } from "../../../shared/catalog/raidSpecializationCatalog";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { PlayerPlanLane } from "../utils/cooldownPlannerFilters";
import { isAssignedMemberInLineup } from "../utils/timelineFormat";
import { RaiderCooldownRow } from "./RaiderCooldownRow";

type CooldownPlayerGroupProps = {
  member: GuildMember;
  specId: number | null;
  lanes: Array<
    PlayerPlanLane<RaidCooldownAssignment>
  >;
  lineupMemberIds: Set<string>;
  planningDurationSeconds: number;
  isTooltipSuppressed: boolean;
  onCreateAssignment: (
    input: RaidCooldownAssignmentInput
  ) => void;
  onRemoveAssignment: (
    assignmentId: string
  ) => void;
  onRepositionAssignment: (
    assignment: RaidCooldownAssignment,
    seconds: number
  ) => void;
  onDragPreview: (
    seconds: number | null
  ) => void;
};

/**
 * The player is the group; each visible lane (real class spell, or a
 * historical spell that predates the catalog) is a row inside it —
 * present whether or not it currently has any assignment. The group
 * header carries the player's identity once, so each lane's own
 * label only needs the spell (icon + name).
 */
export function CooldownPlayerGroup({
  member,
  specId,
  lanes,
  lineupMemberIds,
  planningDurationSeconds,
  isTooltipSuppressed,
  onCreateAssignment,
  onRemoveAssignment,
  onRepositionAssignment,
  onDragPreview
}: CooldownPlayerGroupProps) {
  const isInLineup = isAssignedMemberInLineup(
    member.id,
    lineupMemberIds
  );

  const spec = getSpecById(specId);

  return (
    <div className="cooldown-player-group">
      <div
        className="cooldown-player-group-header"
        style={
          {
            "--marker-color":
              resolveClassColor(
                member.className
              )
          } as CSSProperties
        }
      >
        {spec && (
          <img
            alt=""
            className="cooldown-player-group-spec-icon"
            src={spec.icon}
          />
        )}

        {member.name}

        {spec && (
          <span className="cooldown-player-group-spec-name">
            {spec.name}
          </span>
        )}

        {!isInLineup && (
          <span
            className="cooldown-timeline-row-warning"
            title="This raider is not in the current Setup lineup for this boss — their assignments are preserved but can't be changed until they're re-added."
          >
            Not in current setup
          </span>
        )}
      </div>

      {lanes.map((lane) => (
        <RaiderCooldownRow
          abilityIcon={
            lane.abilityIcon
          }
          abilityName={
            lane.abilityName
          }
          assignments={
            lane.assignments
          }
          isInLineup={isInLineup}
          isIncompatibleWithSpec={
            lane.isIncompatibleWithSpec
          }
          isTooltipSuppressed={
            isTooltipSuppressed
          }
          key={lane.key}
          member={member}
          onCreateAssignment={
            onCreateAssignment
          }
          onDragPreview={onDragPreview}
          onRemoveAssignment={
            onRemoveAssignment
          }
          onRepositionAssignment={
            onRepositionAssignment
          }
          planningDurationSeconds={
            planningDurationSeconds
          }
          spellId={lane.spellId}
        />
      ))}
    </div>
  );
}
