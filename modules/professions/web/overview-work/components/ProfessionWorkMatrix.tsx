import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import { FamilyIcon } from "../../shared/components/ProfessionIcons";
import type {
  ProfessionOverviewWorkRow,
  ProfessionWorkFilter
} from "../types/professionOverviewWork.types";
import {
  professionWorkNeedsAttention,
  treasureToken,
  weeklySourceToken,
  weeklySummaryToken
} from "../utils/professionWorkCells";

type ProfessionWorkMatrixProps = {
  rows: ProfessionOverviewWorkRow[];
};

const FILTER_OPTIONS: {
  value: ProfessionWorkFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "attention", label: "Attention" }
];

export function ProfessionWorkMatrix({
  rows
}: ProfessionWorkMatrixProps) {
  const [filter, setFilter] =
    useState<ProfessionWorkFilter>("all");

  const visibleRows = useMemo(() => {
    if (filter === "attention") {
      return rows.filter(professionWorkNeedsAttention);
    }

    return rows;
  }, [filter, rows]);

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        No profession data has been captured yet.
      </div>
    );
  }

  return (
    <>
      <div className="matrix-toolbar">
        <span className="matrix-summary">
          {visibleRows.length} profession row
          {visibleRows.length === 1 ? "" : "s"}
          {filter === "attention" ? " needing attention" : ""}
        </span>

        <div
          aria-label="Profession work filters"
          className="overview-matrix-filter-group"
          role="group"
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              aria-pressed={filter === option.value}
              className={
                filter === option.value
                  ? "overview-matrix-filter active"
                  : "overview-matrix-filter"
              }
              key={option.value}
              onClick={() => setFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-state">
          No profession rows need attention.
        </div>
      ) : (
        <div className="table-scroll matrix-scroll">
          <table className="dense-matrix profession-work-matrix">
            <colgroup>
              <col className="profession-work-col-character" />
              <col className="profession-work-col-profession" />
              <col className="profession-work-col-compact" />
              <col className="profession-work-col-compact" />
              <col className="profession-work-col-compact" />
              <col className="profession-work-col-compact" />
              <col className="profession-work-col-compact" />
              <col className="profession-work-col-compact" />
              <col className="profession-work-col-compact" />
              <col className="profession-work-col-action" />
            </colgroup>

            <thead>
              <tr>
                <th>Character</th>
                <th>Profession</th>
                <th className="matrix-col-narrow">Skill</th>
                <th className="matrix-col-narrow">Weekly</th>
                <th className="matrix-col-narrow">Quest</th>
                <th className="matrix-col-narrow">Treat.</th>
                <th className="matrix-col-narrow">Drops</th>
                <th
                  className="matrix-col-narrow"
                  title="Knowledge invested in specialization (not unspent)"
                >
                  Invest.
                </th>
                <th className="matrix-col-narrow">Treas.</th>
                <th className="profession-work-action-header">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const rowKey = `${row.character.id}:${row.profession.key}`;

                return (
                  <tr
                    className={
                      row.sortRank >= 3 ? "is-complete" : undefined
                    }
                    key={rowKey}
                  >
                    <td className="profession-work-character-cell">
                      <div className="matrix-identity profession-work-identity">
                        <Link
                          className="matrix-character-link"
                          style={{
                            color: getClassColor(
                              row.character.className
                            )
                          }}
                          to={`/characters/${row.character.id}`}
                        >
                          {row.character.name}
                        </Link>

                        <span>
                          {row.character.className}
                          {" · "}
                          {row.character.realm}
                        </span>
                      </div>
                    </td>

                    <td className="profession-work-profession-cell">
                      <Link
                        className="profession-work-profession-link"
                        to={`/professions/${row.profession.id}`}
                      >
                        <FamilyIcon
                          familyName={row.profession.name}
                        />
                        <span>{row.profession.name}</span>
                      </Link>
                    </td>

                    <td
                      className="matrix-col-narrow"
                      title={
                        row.skill.current === null
                          ? "Skill unresolved"
                          : `${row.skill.current} skill`
                      }
                    >
                      {row.skill.display}
                    </td>

                    <td className="matrix-col-narrow">
                      <StatusToken
                        token={weeklySummaryToken(row)}
                      />
                    </td>

                    <td className="matrix-col-narrow">
                      <StatusToken
                        token={weeklySourceToken(row.quest)}
                      />
                    </td>

                    <td className="matrix-col-narrow">
                      <StatusToken
                        token={weeklySourceToken(row.treatise)}
                      />
                    </td>

                    <td className="matrix-col-narrow">
                      <StatusToken
                        token={weeklySourceToken(row.drops)}
                      />
                    </td>

                    <td
                      className="matrix-col-narrow"
                      title={`${row.investedKnowledge.invested} Knowledge invested`}
                    >
                      {row.investedKnowledge.display}
                    </td>

                    <td className="matrix-col-narrow">
                      <StatusToken
                        token={treasureToken(row.treasures)}
                      />
                    </td>

                    <td className="profession-work-action-cell">
                      {row.nextAction ? (
                        <Link
                          className="overview-next-action profession-work-action-link"
                          to={`/characters/${row.character.id}`}
                        >
                          {row.nextAction}
                        </Link>
                      ) : (
                        <span className="overview-next-action ready">
                          ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
