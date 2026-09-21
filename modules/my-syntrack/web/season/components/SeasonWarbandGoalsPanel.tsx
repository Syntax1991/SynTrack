import type { SeasonWarbandGoalView } from "../../../api/season-checklist/season-checklist.types.js";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { weekliesSignalTone } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type { WeekliesSignalState } from "../../../api/weekly-checklist/weeklies-gameplay-signals.types.js";

type SeasonWarbandGoalsPanelProps = {
  warbandGoals: SeasonWarbandGoalView[];
};

/**
 * Visible only when at least one warband goal has live trackable evidence.
 * Capture-gap catalog entries must never appear as fake incomplete rows.
 */
export function SeasonWarbandGoalsPanel({
  warbandGoals
}: SeasonWarbandGoalsPanelProps) {
  if (warbandGoals.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <p className="eyebrow">WARBAND SEASON PROGRESS</p>
      <h2>Warband seasonal progress</h2>
      <p className="matrix-summary">
        Warband goals are listed separately so they are never marked incomplete
        on every Character.
      </p>

      <div className="warband-goal-grid">
        {warbandGoals.map((goal) => (
          <div className="warband-goal-item" key={goal.key}>
            <div className="warband-goal-heading">
              <span className="warband-goal-title">{goal.title}</span>
              <StatusToken
                token={{
                  symbol: goal.label,
                  tone: weekliesSignalTone(goal.state as WeekliesSignalState),
                  title: goal.detail
                }}
              />
            </div>
            <p className="warband-goal-detail">{goal.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
