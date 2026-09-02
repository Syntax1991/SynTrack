import { Link } from "react-router-dom";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import {
  overviewHorizonLabel,
  overviewSourceLabel
} from "../../../api/overview/overview-decision.compose.js";
import type { OverviewDecisionResponse } from "../types/overviewDecision.types";

type OverviewActionTableProps = {
  overview: OverviewDecisionResponse;
};

export function OverviewActionTable({
  overview
}: OverviewActionTableProps) {
  if (overview.actions.length === 0) {
    const emptyLabel =
      overview.emptyState === "NO_KNOWN_ACTIONS_UNRESOLVED"
        ? `No known actions · ${overview.summaries.unresolved} unresolved`
        : "No open actions";

    return (
      <section className="panel overview-decision-panel">
        <p className="eyebrow">NEXT ACTIONS</p>
        <div className="empty-state">{emptyLabel}</div>
      </section>
    );
  }

  return (
    <section className="panel overview-decision-panel">
      <div className="matrix-toolbar">
        <span className="matrix-summary">
          {overview.actions.length} next action
          {overview.actions.length === 1 ? "" : "s"} · Weeklies before Season
          before Setup
        </span>
      </div>
      <p className="eyebrow">NEXT ACTIONS</p>
      <div className="table-scroll matrix-scroll">
        <table className="dense-matrix overview-decision-matrix">
          <thead>
            <tr>
              <th className="overview-col-when">When</th>
              <th className="overview-col-character">Character</th>
              <th className="overview-col-action">Action</th>
              <th className="overview-col-area">Area</th>
            </tr>
          </thead>
          <tbody>
            {overview.actions.map((row) => (
              <tr
                key={`${row.horizon}:${row.source}:${row.characterId}:${row.action}`}
              >
                <td className="overview-col-when">
                  {overviewHorizonLabel(row.horizon)}
                </td>
                <td className="overview-col-character">
                  <Link
                    className="matrix-character-link"
                    style={{ color: getClassColor(row.className) }}
                    to={`/characters/${row.characterId}`}
                  >
                    {row.characterName}
                  </Link>
                </td>
                <td className="overview-col-action">
                  <Link className="overview-next-action" to={row.path}>
                    {row.action}
                  </Link>
                </td>
                <td className="overview-col-area">
                  <Link className="overview-decision-area" to={row.path}>
                    {overviewSourceLabel(row.source)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
