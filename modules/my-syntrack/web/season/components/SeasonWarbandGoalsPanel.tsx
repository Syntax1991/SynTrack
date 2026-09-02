import type { SeasonWarbandGoalView } from "../../../api/season-checklist/season-checklist.types.js";

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
      <p className="eyebrow">WARBAND SEASON GOALS</p>
      <h2>Account-wide seasonal progress</h2>
      <p className="matrix-summary">
        Warband goals are listed separately so they are never marked incomplete
        on every Character.
      </p>

      <div className="table-scroll matrix-scroll">
        <table className="dense-matrix">
          <thead>
            <tr>
              <th>Goal</th>
              <th className="matrix-col-narrow">State</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {warbandGoals.map((goal) => (
              <tr key={goal.key}>
                <td>{goal.title}</td>
                <td className="matrix-col-narrow">{goal.label}</td>
                <td>{goal.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
