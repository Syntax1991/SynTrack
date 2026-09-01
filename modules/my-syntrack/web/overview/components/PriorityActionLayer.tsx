import { Link } from "react-router-dom";
import type { OverviewPriorities } from "../types/overviewPriority.types";

type PriorityActionLayerProps = {
  priorities: OverviewPriorities;
};

export function PriorityActionLayer({
  priorities
}: PriorityActionLayerProps) {
  if (priorities.topActions.length === 0) {
    return (
      <section className="overview-priority-layer overview-priority-layer-clear">
        <p className="overview-priority-eyebrow">
          Worth doing next
        </p>
        <p className="overview-priority-empty">
          Nothing urgent on the account right now.
          {priorities.readyCharacterCount > 0
            ? ` ${priorities.readyCharacterCount} character${
                priorities.readyCharacterCount === 1
                  ? ""
                  : "s"
              } ready.`
            : ""}
        </p>
      </section>
    );
  }

  return (
    <section className="overview-priority-layer">
      <div className="overview-priority-header">
        <p className="overview-priority-eyebrow">
          Worth doing next
        </p>
        <p className="overview-priority-meta">
          {priorities.buckets.quickWins.length} quick win
          {priorities.buckets.quickWins.length === 1
            ? ""
            : "s"}
          {" · "}
          {priorities.buckets.thisWeek.length} this week
          {priorities.readyCharacterCount > 0
            ? ` · ${priorities.readyCharacterCount} ready`
            : ""}
        </p>
      </div>

      <ol className="overview-priority-list">
        {priorities.topActions.map((action) => (
          <li key={action.id}>
            <Link
              className="overview-priority-card"
              title={action.detail ?? undefined}
              to={action.path}
            >
              <span className="overview-priority-character">
                {action.characterName}
              </span>
              <span className="overview-priority-domain">
                {action.domainLabel}
              </span>
              <span className="overview-priority-label">
                {action.label}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
