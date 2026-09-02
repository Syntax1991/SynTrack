import type { SeasonWarbandGoalView } from "../../../api/season-checklist/season-checklist.types.js";
import type { SeasonGoalCatalogEntry } from "../../../api/season-checklist/season-goal-catalog.js";

type SeasonWarbandGoalsPanelProps = {
  warbandGoals: SeasonWarbandGoalView[];
  blockedCharacterGoals: SeasonGoalCatalogEntry[];
};

export function SeasonWarbandGoalsPanel({
  warbandGoals,
  blockedCharacterGoals
}: SeasonWarbandGoalsPanelProps) {
  return (
    <section className="panel">
      <p className="eyebrow">WARBAND SEASON GOALS</p>
      <h2>Account-wide seasonal progress</h2>
      <p className="matrix-summary">
        Warband goals are listed separately so they are never marked incomplete
        on every Character. Capture is not available yet for these facts.
      </p>

      <div className="table-scroll matrix-scroll">
        <table className="dense-matrix">
          <thead>
            <tr>
              <th>Goal</th>
              <th className="matrix-col-narrow">State</th>
              <th>Capture gap</th>
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

      {blockedCharacterGoals.length > 0 ? (
        <>
          <p className="eyebrow" style={{ marginTop: "1.25rem" }}>
            CHARACTER GOALS — CAPTURE PENDING
          </p>
          <ul className="matrix-summary">
            {blockedCharacterGoals.map((goal) => (
              <li key={goal.key}>
                {goal.title}
                {" — "}
                {goal.captureGap}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
