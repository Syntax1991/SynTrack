import {
  useRef,
  type CSSProperties,
  type MouseEvent
} from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import { AssignmentMarker } from "./AssignmentMarker";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import { secondsFromClickX } from "../utils/timelineFormat";

type RaiderCooldownRowProps = {
  member: GuildMember;
  abilityName: string;
  spellId: number | null;
  abilityIcon: string | null;
  planningDurationSeconds: number;
  assignments: RaidCooldownAssignment[];
  isInLineup: boolean;
  isIncompatibleWithSpec: boolean;
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
 * This lane's spell identity (spellId/abilityName/abilityIcon) is
 * always fully known up front — it comes from a real class spell
 * (getSpellsForClass) or a historical assignment, never a picker —
 * so a click on empty track directly creates the assignment for
 * THIS spell at the clicked timestamp. No popover, no re-asking
 * "which spell": Player Group -> Spell Lane -> click timestamp ->
 * assignment created. Disabled for a player no longer in the current
 * boss lineup, matching the "can't be changed until re-added" rule
 * already shown by the warning badge.
 */
export function RaiderCooldownRow({
  member,
  abilityName,
  spellId,
  abilityIcon,
  planningDurationSeconds,
  assignments,
  isInLineup,
  isIncompatibleWithSpec,
  isTooltipSuppressed,
  onCreateAssignment,
  onRemoveAssignment,
  onRepositionAssignment,
  onDragPreview
}: RaiderCooldownRowProps) {
  const trackRef =
    useRef<HTMLDivElement>(null);

  const canCreate =
    isInLineup && !isIncompatibleWithSpec;

  const handleClick = (
    event: MouseEvent<HTMLDivElement>
  ) => {
    if (!trackRef.current || !canCreate) {
      return;
    }

    const seconds = secondsFromClickX(
      event.clientX,
      trackRef.current,
      planningDurationSeconds
    );

    onCreateAssignment({
      memberId: member.id,
      abilityName,
      spellId,
      abilityIcon,
      phaseLabel: null,
      timestampSeconds: seconds,
      sortOrder: 0
    });
  };

  return (
    <div
      className={
        isInLineup
          ? "cooldown-timeline-row"
          : "cooldown-timeline-row is-not-in-lineup"
      }
    >
      <div
        className="cooldown-timeline-row-label"
        style={
          {
            "--marker-color":
              resolveClassColor(
                member.className
              )
          } as CSSProperties
        }
      >
        <span className="cooldown-spell-row-label">
          {abilityIcon && (
            <img
              alt=""
              className="cooldown-spell-row-icon"
              src={abilityIcon}
            />
          )}

          <span className="cooldown-spell-row-spell">
            {abilityName}
          </span>
        </span>

        {!isInLineup && (
          <span
            className="cooldown-timeline-row-warning"
            title="This raider is not in the current Setup lineup for this boss — their assignment is preserved but can't be changed until they're re-added."
          >
            Not in current setup
          </span>
        )}

        {isInLineup && isIncompatibleWithSpec && (
          <span
            className="cooldown-timeline-row-warning"
            title={`${abilityName} is not available for this raider's currently selected specialization — the existing assignment is preserved and becomes available again if the spec changes back.`}
          >
            Not available for spec
          </span>
        )}
      </div>

      <div
        className={
          canCreate
            ? "cooldown-timeline-row-track"
            : "cooldown-timeline-row-track cooldown-timeline-row-track-readonly"
        }
        onClick={handleClick}
        ref={trackRef}
        role="button"
        tabIndex={0}
      >
        {assignments
          .filter(
            (assignment) =>
              assignment.timestampSeconds !==
              null
          )
          .map((assignment) => (
            <AssignmentMarker
              assignment={
                assignment
              }
              planningDurationSeconds={
                planningDurationSeconds
              }
              isInLineup={
                isInLineup
              }
              isIncompatibleWithSpec={
                isIncompatibleWithSpec
              }
              isTooltipSuppressed={
                isTooltipSuppressed
              }
              key={assignment.id}
              member={member}
              onDragPreview={
                onDragPreview
              }
              onRemove={() =>
                onRemoveAssignment(
                  assignment.id
                )
              }
              onReposition={(
                seconds
              ) =>
                onRepositionAssignment(
                  assignment,
                  seconds
                )
              }
              trackRef={trackRef}
            />
          ))}
      </div>
    </div>
  );
}
