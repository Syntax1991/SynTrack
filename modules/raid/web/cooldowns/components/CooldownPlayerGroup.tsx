import type { CSSProperties } from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import type { PlayerSpellRow } from "../utils/cooldownCategories";
import { resolveAssignmentCategory } from "../utils/cooldownCategories";
import { isAssignedMemberInLineup } from "../utils/timelineFormat";
import { RaiderCooldownRow } from "./RaiderCooldownRow";

type PendingCreation = {
  rowKey: string;
  seconds: number;
};

type CooldownPlayerGroupProps = {
  member: GuildMember;
  spellRows: Array<
    PlayerSpellRow<RaidCooldownAssignment>
  >;
  lineupMemberIds: Set<string>;
  planningDurationSeconds: number;
  isTooltipSuppressed: boolean;
  pendingCreation: PendingCreation | null;
  onRowClick: (
    rowKey: string,
    seconds: number
  ) => void;
  onCreateAssignment: (
    input: RaidCooldownAssignmentInput
  ) => void;
  onCancelCreate: () => void;
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
 * The player is the group; each real spell they hold is one lane
 * inside it — never a lane per class-eligible spell they merely
 * could hold. The group header carries the player's identity once,
 * so each lane's own label only needs the spell (icon + name).
 */
export function CooldownPlayerGroup({
  member,
  spellRows,
  lineupMemberIds,
  planningDurationSeconds,
  isTooltipSuppressed,
  pendingCreation,
  onRowClick,
  onCreateAssignment,
  onCancelCreate,
  onRemoveAssignment,
  onRepositionAssignment,
  onDragPreview
}: CooldownPlayerGroupProps) {
  const isInLineup = isAssignedMemberInLineup(
    member.id,
    lineupMemberIds
  );

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
        {member.name}

        {!isInLineup && (
          <span
            className="cooldown-timeline-row-warning"
            title="This raider is not in the current Setup lineup for this boss — their assignments are preserved but can't be changed until they're re-added."
          >
            Not in current setup
          </span>
        )}
      </div>

      {spellRows.map((row) => {
        const rowCategory =
          row.spellId !== null
            ? resolveAssignmentCategory({
                spellId: row.spellId
              })
            : "Other";

        return (
        <RaiderCooldownRow
          assignments={row.assignments}
          categoryFilter={
            rowCategory !== "Other"
              ? rowCategory
              : undefined
          }
          isInLineup={isInLineup}
          isTooltipSuppressed={
            isTooltipSuppressed
          }
          key={row.key}
          label={
            <span className="cooldown-spell-row-label">
              {row.abilityIcon && (
                <img
                  alt=""
                  className="cooldown-spell-row-icon"
                  src={row.abilityIcon}
                />
              )}

              <span className="cooldown-spell-row-spell">
                {row.abilityName}
              </span>
            </span>
          }
          member={member}
          onCancelCreate={
            onCancelCreate
          }
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
          onTrackClick={(seconds) =>
            onRowClick(row.key, seconds)
          }
          pendingCreationSeconds={
            pendingCreation?.rowKey ===
            row.key
              ? pendingCreation.seconds
              : null
          }
          planningDurationSeconds={
            planningDurationSeconds
          }
        />
        );
      })}
    </div>
  );
}
