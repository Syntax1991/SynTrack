import type { CSSProperties } from "react";
import {
  formatSeconds,
  percentOf
} from "../utils/timelineFormat";

type TimelineTicksProps = {
  planningDurationSeconds: number;
};

const tickCount = 10;

export function TimelineTicks({
  planningDurationSeconds
}: TimelineTicksProps) {
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
  );
}
