import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  characterListViewEmptyMessage,
  formatCharacterListViewCount,
  matchesCharacterListView,
  resolveCharacterListViewFlags,
  type CharacterListView
} from "../../../api/character-tracking/character-list-view.js";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import { CharacterListViewSwitcher } from "../../shared/components/CharacterListViewSwitcher";
import type { WeeklyChecklistCharacter } from "../types/weeklyChecklist.types";
import {
  WEEKLIES_COLUMN_LABELS,
  weekliesColumnsForView,
  type WeekliesMatrixColumn
} from "../utils/weekliesMatrixColumns";
import {
  aggregateToken,
  gameplayDomainToken,
  progressToken,
  weeklyActionLabel
} from "./weeklyChecklistCells";

function weekliesFlags(character: WeeklyChecklistCharacter) {
  return resolveCharacterListViewFlags({
    trackingProfile: character.trackingProfile,
    professions: {
      weeklyProfessionCount: character.professionWeekly.professions.length,
      weeklyQuestApplicable: character.professionWeekly.quest.applicableTotal,
      weeklyTreatiseApplicable:
        character.professionWeekly.treatise.applicableTotal,
      weeklyDropsApplicable: character.professionWeekly.drops.applicableTotal,
      setupState:
        character.professionWeekly.state === "NOT_TRACKED"
          ? "NOT_TRACKED"
          : character.professionWeekly.state
    }
  });
}

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

  if (column === "quest") {
    return aggregateToken(character.professionWeekly.quest, "Weekly Quest");
  }

  if (column === "treatise") {
    return aggregateToken(character.professionWeekly.treatise, "Treatise");
  }

  if (column === "drops") {
    return aggregateToken(
      character.professionWeekly.drops,
      "Knowledge Drops"
    );
  }

  return progressToken(character);
}

type WeeklyChecklistMatrixProps = {
  characters: WeeklyChecklistCharacter[];
};

export function WeeklyChecklistMatrix({
  characters
}: WeeklyChecklistMatrixProps) {
  const [listView, setListView] = useState<CharacterListView>("all");

  const scopeCounts = useMemo(() => {
    let gameplayCount = 0;
    let professionCount = 0;

    for (const character of characters) {
      const flags = weekliesFlags(character);

      if (flags.hasGameplayTracking) {
        gameplayCount += 1;
      }

      if (flags.hasProfessionTracking) {
        professionCount += 1;
      }
    }

    return { gameplayCount, professionCount };
  }, [characters]);

  const visibleCharacters = useMemo(
    () =>
      characters.filter((character) =>
        matchesCharacterListView(listView, weekliesFlags(character))
      ),
    [characters, listView]
  );

  const columns = weekliesColumnsForView(listView);
  const emptyMessage = characterListViewEmptyMessage(listView, false);
  const summaryText = `${formatCharacterListViewCount(
    listView,
    visibleCharacters.length,
    characters.length,
    scopeCounts.gameplayCount,
    scopeCounts.professionCount
  )} · Quest / Treatise / Drops automatic · Vault / M+ / Raid / Delves from this-week capture`;

  if (characters.length === 0) {
    return (
      <div className="empty-state">No characters match this filter.</div>
    );
  }

  return (
    <>
      <div className="matrix-toolbar">
        <span className="matrix-summary">{summaryText}</span>
        <CharacterListViewSwitcher
          onChange={setListView}
          value={listView}
        />
      </div>

      {visibleCharacters.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="table-scroll matrix-scroll">
          <table className="dense-matrix">
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
                  return (
                    <th
                      className="matrix-col-narrow"
                      key={column}
                      title={meta.title}
                    >
                      {meta.label}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {visibleCharacters.map((character) => {
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
                                  color: getClassColor(character.className)
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
      )}
    </>
  );
}
