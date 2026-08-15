import {
  useRef,
  type CSSProperties,
  type MouseEvent
} from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import { AssignmentMarker } from "./AssignmentMarker";
import { CooldownCreatePopover } from "./CooldownCreatePopover";
import type {
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import {
  percentOf,
  secondsFromClickX
} from "../utils/timelineFormat";

type RaiderCooldownRowProps = {
  member: GuildMember;
  fightDurationSeconds: number;
  assignments: RaidCooldownAssignment[];
  isInLineup: boolean;
  isTooltipSuppressed: boolean;
  pendingCreationSeconds: number | null;
  onTrackClick: (
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

export function RaiderCooldownRow({
  member,
  fightDurationSeconds,
  assignments,
  isInLineup,
  isTooltipSuppressed,
  pendingCreationSeconds,
  onTrackClick,
  onCreateAssignment,
  onCancelCreate,
  onRemoveAssignment,
  onRepositionAssignment,
  onDragPreview
}: RaiderCooldownRowProps) {
  const trackRef =
    useRef<HTMLDivElement>(null);

  const handleClick = (
    event: MouseEvent<HTMLDivElement>
  ) => {
    if (!trackRef.current) {
      return;
    }

    onTrackClick(
      secondsFromClickX(
        event.clientX,
        trackRef.current,
        fightDurationSeconds
      )
    );
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
        {member.name}

        {!isInLineup && (
          <span
            className="cooldown-timeline-row-warning"
            title="This raider is not in the current Setup lineup for this boss — their assignment is preserved but can't be changed until they're re-added."
          >
            Not in current setup
          </span>
        )}
      </div>

      <div
        className="cooldown-timeline-row-track"
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
              fightDurationSeconds={
                fightDurationSeconds
              }
              isInLineup={
                isInLineup
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

        {pendingCreationSeconds !==
          null && (
          <div
            className="cooldown-create-popover-anchor"
            style={
              {
                left: `${percentOf(pendingCreationSeconds, fightDurationSeconds)}%`
              } as CSSProperties
            }
          >
            <CooldownCreatePopover
              member={member}
              onCancel={
                onCancelCreate
              }
              onSelectFreeText={(
                name
              ) =>
                onCreateAssignment(
                  {
                    memberId:
                      member.id,
                    abilityName:
                      name,
                    spellId: null,
                    abilityIcon:
                      null,
                    phaseLabel:
                      null,
                    timestampSeconds:
                      pendingCreationSeconds,
                    sortOrder: 0
                  }
                )
              }
              onSelectSpell={(
                spell
              ) =>
                onCreateAssignment(
                  {
                    memberId:
                      member.id,
                    abilityName:
                      spell.name,
                    spellId:
                      spell.spellId,
                    abilityIcon:
                      spell.icon,
                    phaseLabel:
                      null,
                    timestampSeconds:
                      pendingCreationSeconds,
                    sortOrder: 0
                  }
                )
              }
              seconds={
                pendingCreationSeconds
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
