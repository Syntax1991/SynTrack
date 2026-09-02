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
          {summaries.weekly.charactersWithWork} character
          {summaries.weekly.charactersWithWork === 1 ? "" : "s"} with work
        </strong>
      </div>
      <div className="overview-decision-metric">
        <span className="overview-decision-metric-label">Season</span>
        <strong>
          {summaries.season.open} open · {summaries.season.unknown} unknown
        </strong>
      </div>
      <div className="overview-decision-metric">
        <span className="overview-decision-metric-label">Professions</span>
        <strong>
          {summaries.professions.weeklyActions} weekly ·{" "}
          {summaries.professions.permanentAttention} setup
        </strong>
      </div>
      <div className="overview-decision-metric">
        <span className="overview-decision-metric-label">Unresolved</span>
        <strong>{summaries.unresolved}</strong>
      </div>
    </div>
  );
}
