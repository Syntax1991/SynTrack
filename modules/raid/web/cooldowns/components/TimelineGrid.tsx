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
  derivePhaseSegments,
  formatSeconds,
  groupCastsByAbility,
  percentOf,
  secondsFromClickX
} from "../utils/timelineFormat";
import { BossAbilityRow } from "./BossAbilityRow";
import { CooldownPlanArea } from "./CooldownPlanArea";
import { PhaseBar } from "./PhaseBar";
import { PhaseBoundaryGuides } from "./PhaseBoundaryGuides";
import { TimelineHoverPlayhead } from "./TimelineHoverPlayhead";

const tickCount = 10;

type PendingCreation = {
  rowKey: string;
  seconds: number;
};

type TimelineGridProps = {
  planningDurationSeconds: number;
  phaseMarkers: RaidBossPhaseMarker[];
  bossAbilityCasts: RaidBossAbilityCast[];
  assignments: RaidCooldownAssignment[];
  rosterMembers: GuildMember[];
  lineupMemberIds: Set<string>;
  pendingCreation: PendingCreation | null;
  onRaiderTrackClick: (
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
  onRemovePhaseMarker: (
    markerId: string
  ) => void;
};

export function TimelineGrid({
  planningDurationSeconds,
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

  const phaseSegments =
    derivePhaseSegments(
      phaseMarkers,
      planningDurationSeconds
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
        planningDurationSeconds
      )
    );
  };

  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) =>
      Math.round(
        (planningDurationSeconds /
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
                left: `${percentOf(seconds, planningDurationSeconds)}%`
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
          <TimelineHoverPlayhead
            planningDurationSeconds={
              planningDurationSeconds
            }
            isDragging={isDragActive}
            seconds={playheadSeconds}
          />

          <PhaseBoundaryGuides
            phaseMarkers={
              phaseMarkers
            }
            planningDurationSeconds={
              planningDurationSeconds
            }
          />
        </div>

        <PhaseBar
          planningDurationSeconds={
            planningDurationSeconds
          }
          onRemovePhaseMarker={
            onRemovePhaseMarker
          }
          phaseMarkers={phaseMarkers}
          segments={phaseSegments}
        />

        {abilityRows.length > 0 && (
          <div className="cooldown-timeline-section-label">
            ENCOUNTER
          </div>
        )}

        {abilityRows.map(
          (row) => (
            <BossAbilityRow
              abilityName={
                row.abilityName
              }
              casts={row.casts}
              planningDurationSeconds={
                planningDurationSeconds
              }
              isTooltipSuppressed={
                isDragActive
              }
              key={row.abilityName}
              phaseSegments={
                phaseSegments
              }
            />
          )
        )}

        {rosterMembers.length > 0 && (
          <div className="cooldown-timeline-section-label">
            PLAN
          </div>
        )}

        <CooldownPlanArea
          assignments={assignments}
          isTooltipSuppressed={
            isDragActive
          }
          lineupMemberIds={
            lineupMemberIds
          }
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
          onRowClick={
            onRaiderTrackClick
          }
          pendingCreation={
            pendingCreation
          }
          planningDurationSeconds={
            planningDurationSeconds
          }
          rosterMembers={
            rosterMembers
          }
        />
      </div>
    </div>
  );
}
