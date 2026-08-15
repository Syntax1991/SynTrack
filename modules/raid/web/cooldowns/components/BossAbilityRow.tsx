import type { CSSProperties } from "react";
import { Tooltip } from "../../../../../apps/web/src/shared/components/Tooltip";
import type { RaidBossAbilityCast } from "../types/cooldown.types";
import type { DerivedPhaseSegment } from "../utils/timelineFormat";
import {
  formatSeconds,
  getWowIconUrl,
  percentOf,
  resolveActivePhase
} from "../utils/timelineFormat";

type BossAbilityRowProps = {
  abilityName: string;
  fightDurationSeconds: number;
  casts: RaidBossAbilityCast[];
  phaseSegments: DerivedPhaseSegment[];
  isTooltipSuppressed: boolean;
};

export function BossAbilityRow({
  abilityName,
  fightDurationSeconds,
  casts,
  phaseSegments,
  isTooltipSuppressed
}: BossAbilityRowProps) {
  const rowIcon = casts.find(
    (cast) => cast.abilityIcon
  )?.abilityIcon;

  return (
    <div className="cooldown-timeline-row cooldown-timeline-row-boss">
      <div
        className="cooldown-timeline-row-label"
        title={abilityName}
      >
        {rowIcon && (
          <img
            alt=""
            className="cooldown-timeline-row-icon"
            src={getWowIconUrl(
              rowIcon
            )}
          />
        )}

        <span>{abilityName}</span>
      </div>

      <div className="cooldown-timeline-row-track cooldown-timeline-row-track-readonly">
        {casts.map((cast, index) => {
          const activePhase =
            resolveActivePhase(
              cast.timestampSeconds,
              phaseSegments
            );

          const previousCast =
            index > 0
              ? casts[index - 1]
              : null;

          const secondsSincePrevious =
            previousCast
              ? cast.timestampSeconds -
                previousCast.timestampSeconds
              : null;

          const elapsedIntoPhase =
            activePhase
              ? cast.timestampSeconds -
                activePhase.startSeconds
              : null;

          const tooltipContent = (
            <>
              <span className="tooltip-timestamp">
                {formatSeconds(
                  cast.timestampSeconds
                )}
              </span>

              {activePhase &&
                elapsedIntoPhase !== null && (
                  <span className="tooltip-phase-elapsed">
                    {formatSeconds(
                      elapsedIntoPhase
                    )}{" "}
                    into {activePhase.label}
                  </span>
                )}

              {/*
                Classification (Raid AOE / Event / Phase Change) and
                Cast time / Duration lines belong here, above the
                ability name — omitted for now because
                RaidBossAbilityCast carries no authoritative source
                for any of them yet. Add them as their own tooltip-*
                lines in this slot once real data exists; don't infer
                from the name or icon.
              */}

              <span className="tooltip-ability-row">
                {cast.abilityIcon && (
                  <img
                    alt=""
                    src={getWowIconUrl(
                      cast.abilityIcon
                    )}
                  />
                )}
                {abilityName}
              </span>

              {secondsSincePrevious !==
                null && (
                <span className="tooltip-meta">
                  Time since last:{" "}
                  {formatSeconds(
                    secondsSincePrevious
                  )}
                </span>
              )}
            </>
          );

          const markerStyle = {
            left: `${percentOf(cast.timestampSeconds, fightDurationSeconds)}%`
          } as CSSProperties;

          return (
            <Tooltip
              anchorClassName={
                cast.abilityIcon
                  ? "cooldown-timeline-marker cooldown-timeline-boss-marker-icon"
                  : "cooldown-timeline-marker cooldown-timeline-boss-marker"
              }
              anchorStyle={
                markerStyle
              }
              content={
                tooltipContent
              }
              disabled={
                isTooltipSuppressed
              }
              key={cast.id}
            >
              {cast.abilityIcon && (
                <img
                  alt={abilityName}
                  src={getWowIconUrl(
                    cast.abilityIcon
                  )}
                />
              )}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
