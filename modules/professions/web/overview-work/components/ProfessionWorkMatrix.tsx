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
            <thead>
              <tr>
                <th>Character</th>
                <th>Profession</th>
                <th className="matrix-col-narrow">Skill</th>
                <th className="matrix-col-narrow">Weekly</th>
                <th className="matrix-col-narrow">Quest</th>
                <th className="matrix-col-narrow">Treat.</th>
                <th className="matrix-col-narrow">Drops</th>
                <th className="matrix-col-narrow">KP</th>
                <th className="matrix-col-narrow">Treas.</th>
                <th className="matrix-col-action">Action</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const rowKey = `${row.character.id}:${row.profession.key}`;

                return (
                  <tr
                    className={
                      row.sortRank >= 4 ? "is-complete" : undefined
                    }
                    key={rowKey}
                  >
                    <td>
                      <div className="matrix-identity">
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

                    <td>
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
                      title={
                        row.knowledgePoints.available === null
                          ? "Knowledge points unavailable"
                          : `${row.knowledgePoints.available} Knowledge Points available`
                      }
                    >
                      {row.knowledgePoints.display}
                    </td>

                    <td className="matrix-col-narrow">
                      <StatusToken
                        token={treasureToken(row.treasures)}
                      />
                    </td>

                    <td className="matrix-col-action">
                      {row.nextAction ? (
                        <Link
                          className="overview-next-action"
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
