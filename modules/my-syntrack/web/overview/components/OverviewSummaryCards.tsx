import type { OverviewSummary } from "../types/overview.types";

export function OverviewSummaryCards({
  summary
}: {
  summary: OverviewSummary;
}) {
  return (
    <div className="overview-summary-grid">
      <div className="overview-summary-card">
        <span className="eyebrow">
          READY
        </span>

        <strong>
          {summary.readyCount}
        </strong>

        <small>
          {summary.readyCount === 1
            ? "character ready"
            : "characters ready"}
        </small>
      </div>

      <div className="overview-summary-card">
        <span className="eyebrow">
          NEED ATTENTION
        </span>

        <strong>
          {summary.attentionCount}
        </strong>

        <small>
          {summary.attentionCount ===
          1
            ? "character with an actionable issue"
            : "characters with actionable issues"}
        </small>
      </div>

      <div className="overview-summary-card">
        <span className="eyebrow">
          WEEKLY PROGRESS
        </span>

        <strong>
          {
            summary.weeklyProgress
              .completed
          }
          /
          {
            summary.weeklyProgress
              .total
          }
        </strong>

        <small>
          weekly tasks completed
        </small>
      </div>

      <div className="overview-summary-card">
        <span className="eyebrow">
          VAULT
        </span>

        <strong>
          {summary.vault.trackedCount}
        </strong>

        <small>
          tracked this week ·{" "}
          {
            summary.vault
              .fullyUnlockedCount
          }{" "}
          fully unlocked
        </small>
      </div>
    </div>
  );
}
