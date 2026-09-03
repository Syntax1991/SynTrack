import { Link } from "react-router-dom";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { OverviewSetupAttentionRow } from "../types/overviewDecision.types";

type OverviewSetupAttentionProps = {
  rows: OverviewSetupAttentionRow[];
};

export function OverviewSetupAttention({
  rows
}: OverviewSetupAttentionProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="panel overview-decision-panel">
      <p className="eyebrow">SETUP ATTENTION</p>
      <table className="dense-matrix overview-decision-matrix">
        <thead>
          <tr>
            <th className="overview-col-character">Character</th>
            <th className="overview-col-next">Setup</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
