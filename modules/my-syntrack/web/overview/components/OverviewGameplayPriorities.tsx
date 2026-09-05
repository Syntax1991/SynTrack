import { Link } from "react-router-dom";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { OverviewGameplayPriorityRow } from "../types/overviewDecision.types";

type OverviewGameplayPrioritiesProps = {
  rows: OverviewGameplayPriorityRow[];
};

function ActionCell({
  action,
  path,
  emptyLabel
}: {
  action: string | null | undefined;
  path?: string;
  emptyLabel: string;
}) {
  if (!action) {
    return <span className="overview-decision-empty">{emptyLabel}</span>;
  }

  if (action === "?") {
    return (
      <Link className="overview-next-action overview-decision-unknown" to={path ?? "/season"}>
        ?
      </Link>
    );
  }

  return (
    <Link className="overview-next-action" to={path ?? "/"}>
      {action}
    </Link>
  );
}

export function OverviewGameplayPriorities({
  rows
}: OverviewGameplayPrioritiesProps) {
  return (
    <section className="panel overview-decision-panel">
      <p className="panel-title">GAMEPLAY PRIORITIES</p>
      <table className="dense-matrix overview-decision-matrix">
        <thead>
          <tr>
            <th className="overview-col-character">Character</th>
            <th className="overview-col-next">Next</th>
            <th className="overview-col-after">After</th>
            <th className="overview-col-status">Status</th>
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
                <ActionCell
                  action={row.next?.action}
                  emptyLabel="—"
                  path={row.next?.path}
                />
              </td>
              <td className="overview-col-after">
                <ActionCell
                  action={row.after?.action}
                  emptyLabel="—"
                  path={row.after?.path}
                />
              </td>
              <td className="overview-col-status">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
