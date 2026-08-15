import type { CSSProperties } from "react";
import type { DerivedPhaseSegment } from "../utils/timelineFormat";
import {
  formatSeconds,
  percentOf
} from "../utils/timelineFormat";

type PhaseBarProps = {
  segments: DerivedPhaseSegment[];
  fightDurationSeconds: number;
};

/**
 * A WoWUtils-style phase bar — real derived segments only, reusing
 * the exact same .cooldown-timeline-row-track box (148px label +
 * flex:1 track) and percentOf() basis every other row/marker/playhead
 * already uses, so phase boundaries line up pixel-perfectly with
 * boss casts and cooldown assignments. Renders nothing for an
 * unphased fight (no real phase markers) rather than fabricating one.
 */
export function PhaseBar({
  segments,
  fightDurationSeconds
}: PhaseBarProps) {
  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="cooldown-timeline-row cooldown-timeline-row-phases">
      <div className="cooldown-timeline-row-label">
        Phases
      </div>

      <div className="cooldown-timeline-row-track cooldown-timeline-row-track-readonly cooldown-timeline-phase-bar-track">
        {segments.map((segment) => {
          const startPercent =
            percentOf(
              segment.startSeconds,
              fightDurationSeconds
            );

          const endPercent =
            percentOf(
              segment.endSeconds,
              fightDurationSeconds
            );

          return (
            <div
              className="cooldown-timeline-phase-bar-segment"
              key={segment.label}
              style={
                {
                  left: `${startPercent}%`,
                  width: `${Math.max(0, endPercent - startPercent)}%`
                } as CSSProperties
              }
              title={`${segment.label}: ${formatSeconds(segment.startSeconds)} – ${formatSeconds(segment.endSeconds)} (${formatSeconds(segment.durationSeconds)})`}
            >
              <span>
                {segment.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
