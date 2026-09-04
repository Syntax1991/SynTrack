import { Link } from "react-router-dom";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { OverviewProfessionWorkRow } from "../types/overviewDecision.types";

type OverviewProfessionWorkProps = {
  rows: OverviewProfessionWorkRow[];
};

export function OverviewProfessionWork({
  rows
}: OverviewProfessionWorkProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="panel overview-decision-panel">
      <div className="overview-decision-section-head">
        <p className="panel-title">PROFESSION WORK</p>
        <Link className="overview-decision-section-link" to="/professions">
          Open Professions
        </Link>
      </div>
      <table className="dense-matrix overview-decision-matrix overview-decision-matrix-compact">
        <thead>
          <tr>
            <th className="overview-col-character">Character</th>
            <th className="overview-col-next">Next profession action</th>
            <th className="overview-col-more">More</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.characterId}>
              <td className="overview-col-character">
                <Link
                  className="matrix-character-link"
                  style={{ color: getClassColor(row.className) }}
                  to={`/characters/${row.characterId}`}
                >
                  {row.characterName}
                </Link>
              </td>
              <td className="overview-col-next">
                <Link className="overview-next-action" to={row.next.path}>
                  {row.next.action}
                </Link>
              </td>
              <td className="overview-col-more">
                {row.additionalActionCount > 0 ? (
                  <Link
                    className="overview-decision-more"
                    to="/professions"
                  >
                    +{row.additionalActionCount} more
                  </Link>
                ) : (
                  <span className="overview-decision-empty">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
