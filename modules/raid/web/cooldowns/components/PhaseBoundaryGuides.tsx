import type { CSSProperties } from "react";
import type { RaidBossPhaseMarker } from "../types/cooldown.types";
import { percentOf } from "../utils/timelineFormat";

type PhaseBoundaryGuidesProps = {
  phaseMarkers: RaidBossPhaseMarker[];
  planningDurationSeconds: number;
};

/**
 * A subtle, unlabeled vertical line at each REAL phase transition,
 * spanning the full encounter+plan surface so boss casts and
 * assignments visually align with the PhaseBar's boundaries below.
 * No label here — PhaseBar already owns phase labels, this is purely
 * an alignment guide. No line at 0 either: that's the timeline's own
 * start, not a transition, so there's nothing real to mark there.
 */
export function PhaseBoundaryGuides({
  phaseMarkers,
  planningDurationSeconds
}: PhaseBoundaryGuidesProps) {
  return (
    <>
      {phaseMarkers.map((marker) => (
        <div
          className="cooldown-timeline-phase-guide"
          key={marker.id}
          style={
            {
              left: `${percentOf(marker.startSeconds, planningDurationSeconds)}%`
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
