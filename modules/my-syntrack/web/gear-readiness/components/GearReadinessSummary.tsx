import type { GearReadinessOverview } from "../types/gearReadiness.types";

type GearReadinessSummaryProps = {
  overview: GearReadinessOverview;
};

export function GearReadinessSummary({
  overview
}: GearReadinessSummaryProps) {
  return (
    <section className="gear-summary-grid">
      <article className="gear-summary-card">
        <span>Tracked gear</span>
        <strong>
          {overview.summary.trackedItemCount}
        </strong>
        <small>equipped items recorded</small>
      </article>

      <article className="gear-summary-card gear-summary-level">
        <span>Average item level</span>
        <strong>
          {overview.summary.averageItemLevel ??
            "--"}
        </strong>
        <small>across recorded items</small>
      </article>

      <article className="gear-summary-card gear-summary-gems">
        <span>Empty sockets</span>
        <strong>
          {overview.summary.emptySocketCount}
        </strong>
        <small>
          {overview.summary.readyCharacterCount}
          {" characters issue-free"}
        </small>
      </article>
    </section>
  );
}
