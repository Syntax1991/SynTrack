import type {
  CSSProperties,
  RefObject
} from "react";
import { Tooltip } from "../../../../../apps/web/src/shared/components/Tooltip";
import type { GuildMember } from "../../../../guild/web/roster/types/roster.types";
import { resolveClassColor } from "../../../../guild/web/roster/utils/classColors";
import { getSpellById } from "../../../shared/catalog/raidCooldownSpellCatalog";
import { useMarkerDrag } from "../hooks/useMarkerDrag";
import type { RaidCooldownAssignment } from "../types/cooldown.types";
import {
  formatSeconds,
  percentOf
} from "../utils/timelineFormat";

type AssignmentMarkerProps = {
  assignment: RaidCooldownAssignment;
  member: GuildMember | undefined;
  planningDurationSeconds: number;
  trackRef: RefObject<HTMLDivElement | null>;
  isInLineup: boolean;
  isIncompatibleWithSpec: boolean;
  isTooltipSuppressed: boolean;
  onRemove: () => void;
  onReposition: (
    seconds: number
  ) => void;
  onDragPreview: (
    seconds: number | null
  ) => void;
};

export function AssignmentMarker({
  assignment,
  member,
  planningDurationSeconds,
  trackRef,
  isInLineup,
  isIncompatibleWithSpec,
  isTooltipSuppressed,
  onRemove,
  onReposition,
  onDragPreview
}: AssignmentMarkerProps) {
  const { onMouseDown, isDragging, previewSeconds } =
    useMarkerDrag({
      trackRef,
      planningDurationSeconds,
      onDrop: onReposition,
      onClick: onRemove,
      onDragPreview
    });

  const originalSeconds =
    assignment.timestampSeconds ?? 0;

  const displaySeconds =
    previewSeconds ?? originalSeconds;

  const markerClassName = [
    "cooldown-timeline-marker",
    assignment.abilityIcon
      ? "cooldown-timeline-marker-icon"
      : "",
    isDragging ? "is-dragging" : "",
    isIncompatibleWithSpec
      ? "is-incompatible-with-spec"
      : ""
  ]
    .filter(Boolean)
    .join(" ");

  const category = assignment.spellId
    ? getSpellById(assignment.spellId)
        ?.category
    : null;

  const tooltipContent = (
    <>
      <span className="tooltip-title">
        {assignment.abilityIcon && (
          <img
            alt=""
            src={
              assignment.abilityIcon
            }
          />
        )}
        {assignment.abilityName}
      </span>

      <span className="tooltip-meta">
        {member?.name ?? "Unknown"}
        {member?.className
          ? ` — ${member.className}`
          : ""}
      </span>

      <span className="tooltip-time">
        {formatSeconds(
          originalSeconds
        )}
      </span>

      {category && (
        <span className="tooltip-meta">
          {category}
        </span>
      )}

      {!isInLineup && (
        <span className="tooltip-warning">
          Not in current setup
        </span>
      )}

      {isInLineup && isIncompatibleWithSpec && (
        <span className="tooltip-warning">
          Not available for spec
        </span>
      )}
    </>
  );

  return (
    <>
      {isDragging && (
        <span
          className="cooldown-timeline-marker cooldown-timeline-marker-ghost"
          style={
            {
              left: `${percentOf(originalSeconds, planningDurationSeconds)}%`
            } as CSSProperties
          }
        />
      )}

      <Tooltip
        anchorClassName={
          markerClassName
        }
        anchorStyle={
          {
            left: `${percentOf(displaySeconds, planningDurationSeconds)}%`,
            "--marker-color":
              resolveClassColor(
                member?.className ??
                  ""
              )
          } as CSSProperties
        }
        content={tooltipContent}
        disabled={
          isTooltipSuppressed
        }
      >
        <button
          aria-label={`${member?.name ?? "Unknown"} — ${assignment.abilityName} at ${formatSeconds(displaySeconds)} — click to remove, drag to move`}
          className="cooldown-timeline-marker-button"
          onMouseDown={onMouseDown}
          type="button"
        >
          {isDragging && (
            <span className="cooldown-timeline-drag-label">
              {formatSeconds(
                displaySeconds
              )}
            </span>
          )}

          {assignment.abilityIcon ? (
            <img
              alt=""
              src={
                assignment.abilityIcon
              }
            />
          ) : (
            (member?.name ?? "?")
              .slice(0, 2)
              .toUpperCase()
          )}
        </button>
      </Tooltip>
    </>
  );
}
