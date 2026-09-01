import type { ProfessionOverviewWorkSummary } from "../types/professionOverviewWork.types";

type ProfessionWorkSummaryProps = {
  summary: ProfessionOverviewWorkSummary;
};

export function ProfessionWorkSummary({
  summary
}: ProfessionWorkSummaryProps) {
  return (
    <div className="profession-work-summary">
      <div className="profession-work-summary-item">
        <span>Profession characters</span>
        <strong>{summary.professionCharacterCount}</strong>
      </div>

      <div className="profession-work-summary-item">
        <span>Weekly attention</span>
        <strong>{summary.weeklyAttentionCount}</strong>
      </div>

      <div className="profession-work-summary-item">
        <span>Permanent attention</span>
        <strong>{summary.permanentAttentionCount}</strong>
      </div>

      <div className="profession-work-summary-item">
        <span>Craft coverage</span>
        <strong>
          {summary.craftingCoverage.covered} /{" "}
          {summary.craftingCoverage.total}
        </strong>
      </div>
    </div>
  );
}
