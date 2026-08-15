import {
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent
} from "react";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import type {
  RaidBossAbilityCast,
  RaidBossPhaseMarker,
  RaidCooldownAssignment,
  RaidCooldownAssignmentInput
} from "../types/cooldown.types";
import {
  formatSeconds,
  groupCastsByAbility,
  isAssignedMemberInLineup,
  percentOf,
  secondsFromClickX
} from "../utils/timelineFormat";
import { BossAbilityRow } from "./BossAbilityRow";
import { RaiderCooldownRow } from "./RaiderCooldownRow";
import { TimelineHoverPlayhead } from "./TimelineHoverPlayhead";

const tickCount = 10;

type TimelineGridProps = {
  fightDurationSeconds: number;
  phaseMarkers: RaidBossPhaseMarker[];
  bossAbilityCasts: RaidBossAbilityCast[];
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  pendingCreation: {
    memberId: string;
    seconds: number;
  } | null;
  onRaiderTrackClick: (
    memberId: string,
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
  onRemovePhaseMarker: (
    markerId: string
  ) => void;
};

export function TimelineGrid({
  fightDurationSeconds,
  phaseMarkers,
  bossAbilityCasts,
  assignments,
  rosterMembers,
  lineupMemberIds,
  pendingCreation,
  onRaiderTrackClick,
  onCreateAssignment,
  onCancelCreate,
  onRemoveAssignment,
  onRepositionAssignment,
  onRemovePhaseMarker
}: TimelineGridProps) {
  const abilityRows = groupCastsByAbility(
    bossAbilityCasts
  );

  const trackOverlayRef =
    useRef<HTMLDivElement>(null);

  const [hoverSeconds, setHoverSeconds] =
    useState<number | null>(null);

  const [dragSeconds, setDragSeconds] =
    useState<number | null>(null);

  const isDragActive =
    dragSeconds !== null;

  const playheadSeconds =
    dragSeconds ??
    pendingCreation?.seconds ??
    hoverSeconds;

  const handleRowsMouseMove = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    if (!trackOverlayRef.current) {
      return;
    }

    const trackRect =
      trackOverlayRef.current.getBoundingClientRect();

    if (
      event.clientX < trackRect.left ||
      event.clientX > trackRect.right
    ) {
      setHoverSeconds(null);
      return;
    }

    setHoverSeconds(
      secondsFromClickX(
        event.clientX,
        trackOverlayRef.current,
        fightDurationSeconds
      )
    );
  };

  const memberById = new Map(
    rosterMembers.map((member) => [
      member.id,
      member
    ])
  );

  const assignedMemberIds = Array.from(
    new Set(
      assignments.map(
        (assignment) =>
          assignment.memberId
      )
    )
  );

  const visibleMemberIds = new Set([
    ...assignedMemberIds,
    ...lineupMemberIds
  ]);

  const orderedVisibleMemberIds =
    rosterMembers
      .map((member) => member.id)
      .filter((id) =>
        visibleMemberIds.has(id)
      );

  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) =>
      Math.round(
        (fightDurationSeconds /
          tickCount) *
          index
      )
  );

  return (
    <div className="cooldown-timeline-grid">
      <div className="cooldown-timeline-ticks">
        {ticks.map((seconds) => (
          <span
            key={seconds}
            style={
              {
                left: `${percentOf(seconds, fightDurationSeconds)}%`
              } as CSSProperties
            }
          >
            {formatSeconds(seconds)}
          </span>
        ))}
      </div>

      <div
        className="cooldown-timeline-rows"
        onMouseLeave={() =>
          setHoverSeconds(null)
        }
        onMouseMove={
          handleRowsMouseMove
        }
      >
        <div
          className="cooldown-timeline-track-overlay"
          ref={trackOverlayRef}
        >
          {phaseMarkers.map(
            (marker) => (
              <div
                className="cooldown-timeline-phase"
                key={marker.id}
                style={
                  {
                    left: `${percentOf(marker.startSeconds, fightDurationSeconds)}%`
                  } as CSSProperties
                }
              >
                <span
                  onClick={() =>
                    onRemovePhaseMarker(
                      marker.id
                    )
                  }
                  title="Click to remove"
                >
                  {marker.label}
                </span>
              </div>
            )
          )}

          <TimelineHoverPlayhead
            fightDurationSeconds={
              fightDurationSeconds
            }
            isDragging={isDragActive}
            seconds={playheadSeconds}
          />
        </div>

        {abilityRows.map(
          (row) => (
            <BossAbilityRow
              abilityName={
                row.abilityName
              }
              casts={row.casts}
              fightDurationSeconds={
                fightDurationSeconds
              }
              isTooltipSuppressed={
                isDragActive
              }
              key={row.abilityName}
              phaseMarkers={
                phaseMarkers
              }
            />
          )
        )}

        {orderedVisibleMemberIds.length >
          0 && (
          <div className="cooldown-timeline-section-label">
            RAIDERS
          </div>
        )}

        {orderedVisibleMemberIds.map(
          (memberId) => {
            const member =
              memberById.get(
                memberId
              );

            if (!member) {
              return null;
            }

            return (
              <RaiderCooldownRow
                assignments={assignments.filter(
                  (assignment) =>
                    assignment.memberId ===
                    memberId
                )}
                fightDurationSeconds={
                  fightDurationSeconds
                }
                isInLineup={isAssignedMemberInLineup(
                  memberId,
                  lineupMemberIds
                )}
                isTooltipSuppressed={
                  isDragActive
                }
                key={memberId}
                member={member}
                onCancelCreate={
                  onCancelCreate
                }
                onCreateAssignment={
                  onCreateAssignment
                }
                onDragPreview={
                  setDragSeconds
                }
                onRemoveAssignment={
                  onRemoveAssignment
                }
                onRepositionAssignment={
                  onRepositionAssignment
                }
                onTrackClick={(
                  seconds
                ) =>
                  onRaiderTrackClick(
                    memberId,
                    seconds
                  )
                }
                pendingCreationSeconds={
                  pendingCreation?.memberId ===
                  memberId
                    ? pendingCreation.seconds
                    : null
                }
              />
            );
          }
        )}
      </div>
    </div>
  );
}
