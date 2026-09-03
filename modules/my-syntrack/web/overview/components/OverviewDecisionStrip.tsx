import type { OverviewDecisionSummaries } from "../types/overviewDecision.types";

type OverviewDecisionStripProps = {
  summaries: OverviewDecisionSummaries;
};

export function OverviewDecisionStrip({
  summaries
}: OverviewDecisionStripProps) {
  return (
    <div className="overview-decision-strip">
      <div className="overview-decision-metric">
        <span className="overview-decision-metric-label">Weekly</span>
        <strong>
          {summaries.weekly.charactersWithWork} gameplay Character
          {summaries.weekly.charactersWithWork === 1 ? "" : "s"}
        </strong>
      </div>
      <div className="overview-decision-metric">
        <span className="overview-decision-metric-label">Season</span>
        <strong>
          {summaries.season.open} open · {summaries.season.unknown} unknown
        </strong>
        {summaries.unresolved > 0 ? (
          <span className="overview-decision-unresolved">
            {summaries.unresolved} unresolved
          </span>
        ) : null}
      </div>
      <div className="overview-decision-metric">
        <span className="overview-decision-metric-label">Professions</span>
        <strong>
          {summaries.professions.charactersWithWork} Character
          {summaries.professions.charactersWithWork === 1 ? "" : "s"} ·{" "}
          {summaries.professions.weeklyActions} weekly
        </strong>
      </div>
    </div>
  );
}
