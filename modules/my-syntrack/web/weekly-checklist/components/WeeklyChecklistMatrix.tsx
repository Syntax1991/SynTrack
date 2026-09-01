import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { WeeklyChecklistCharacter } from "../types/weeklyChecklist.types";
import {
  WEEKLIES_COLUMN_LABELS,
  weekliesColumns,
  type WeekliesMatrixColumn
} from "../utils/weekliesMatrixColumns";
import {
  gameplayDomainToken,
  gameplaySignalToken,
  professionSummaryToken,
  weeklyActionLabel
} from "./weeklyChecklistCells";

function cellForColumn(
  character: WeeklyChecklistCharacter,
  column: WeekliesMatrixColumn
) {
  if (column === "vault") {
    return gameplayDomainToken(character, "vault");
  }

  if (column === "mythicPlus") {
    return gameplayDomainToken(character, "mythicPlus");
  }

  if (column === "raid") {
    return gameplayDomainToken(character, "raid");
  }

  if (column === "delves") {
    return gameplayDomainToken(character, "delves");
  }

  if (column === "twoKRio") {
    return gameplaySignalToken(character.gameplaySignals.twoKRio);
  }

  if (column === "map") {
    return gameplaySignalToken(character.gameplaySignals.map);
  }

  if (column === "meta") {
    return gameplaySignalToken(character.gameplaySignals.meta);
  }

  if (column === "professions") {
    return professionSummaryToken(character);
  }

  throw new Error(`Unhandled Weeklies column: ${column}`);
}

type WeeklyChecklistMatrixProps = {
  characters: WeeklyChecklistCharacter[];
};

export function WeeklyChecklistMatrix({
  characters
}: WeeklyChecklistMatrixProps) {
  const columns = weekliesColumns();
  const summaryText = `${characters.length} gameplay character${
    characters.length === 1 ? "" : "s"
  } · Vault / M+ / Raid / Delves from this-week capture · 2K / MAP / META from trackers · Prof. links to /professions`;

  if (characters.length === 0) {
    return (
      <div className="empty-state">
        No gameplay-tracked characters.
      </div>
    );
  }

  return (
    <>
      <div className="matrix-toolbar">
        <span className="matrix-summary">{summaryText}</span>
      </div>

      <div className="table-scroll matrix-scroll">
        <table className="dense-matrix weeklies-matrix">
          <thead>
            <tr>
              {columns.map((column) => {
                if (column === "character") {
                  return <th key={column}>Character</th>;
                }

                if (column === "action") {
                  return (
                    <th className="matrix-col-action" key={column}>
                      Action
                    </th>
                  );
                }

                const meta = WEEKLIES_COLUMN_LABELS[column];
                const headerTitle =
                  column === "meta" &&
                  characters[0]?.gameplaySignals.sources.meta
                    .trackerName
                    ? characters[0].gameplaySignals.sources.meta
                        .trackerName
                    : column === "map" &&
                        characters[0]?.gameplaySignals.sources.map
                          .trackerName
                      ? characters[0].gameplaySignals.sources.map
                          .trackerName
                      : meta.title;

                return (
                  <th
                    className="matrix-col-narrow"
                    key={column}
                    title={headerTitle}
                  >
                    {meta.label}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {characters.map((character) => {
              const action = weeklyActionLabel(character);

              return (
                <tr key={character.id}>
                  {columns.map((column) => {
                    if (column === "character") {
                      return (
                        <td key={column}>
                          <div className="matrix-identity">
                            <Link
                              className="matrix-character-link"
                              style={{
                                color: getClassColor(
                                  character.className
                                )
                              }}
                              to={`/characters/${character.id}`}
                            >
                              {character.name}
                            </Link>
                            <span>
                              {character.className}
                              {" · "}
                              {character.realm}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (column === "action") {
                      return (
                        <td className="matrix-col-action" key={column}>
                          {action ? (
                            <Link
                              className="overview-next-action"
                              to={`/characters/${character.id}`}
                            >
                              {action}
                            </Link>
                          ) : (
                            <span className="overview-next-action ready">
                              ✓
                            </span>
                          )}
                        </td>
                      );
                    }

                    if (column === "professions") {
                      const token = cellForColumn(
                        character,
                        column
                      );

                      return (
                        <td className="matrix-col-narrow" key={column}>
                          <Link
                            className="weeklies-profession-link"
                            to={
                              character.professionWeeklySummary.path
                            }
                          >
                            <StatusToken token={token} />
                          </Link>
                        </td>
                      );
                    }

                    return (
                      <td className="matrix-col-narrow" key={column}>
                        <StatusToken
                          token={cellForColumn(character, column)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
