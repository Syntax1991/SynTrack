import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import { weekliesSignalTone } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type { SeasonChecklistCharacter } from "../../../api/season-checklist/season-checklist.types.js";
import type { WeekliesSignalState } from "../../../api/weekly-checklist/weeklies-gameplay-signals.types.js";

type SeasonChecklistMatrixProps = {
  characters: SeasonChecklistCharacter[];
};

function mythicPlusToken(character: SeasonChecklistCharacter) {
  return {
    symbol: character.mythicPlus.label,
    tone: weekliesSignalTone(
      character.mythicPlus.state as WeekliesSignalState
    ),
    title: character.mythicPlus.detail
  };
}

function statusLabel(character: SeasonChecklistCharacter) {
  if (character.goalsOpen > 0) {
    return `${character.goalsOpen} open`;
  }

  if (character.goalsUnknown > 0) {
    return `${character.goalsUnknown}?`;
  }

  if (character.goalsComplete > 0) {
    return "✓";
  }

  return "—";
}

export function SeasonChecklistMatrix({
  characters
}: SeasonChecklistMatrixProps) {
  const summaryText = `${characters.length} gameplay character${
    characters.length === 1 ? "" : "s"
  } · Character seasonal goals only · Weeklies keep reset work`;

  if (characters.length === 0) {
    return (
      <div className="empty-state">No gameplay-tracked characters.</div>
    );
  }

  return (
    <>
      <div className="matrix-toolbar">
        <span className="matrix-summary">{summaryText}</span>
      </div>

      <div className="table-scroll matrix-scroll">
        <table className="dense-matrix season-matrix">
          <thead>
            <tr>
              <th className="season-col-character">Character</th>
              <th
                className="season-col-mplus"
                title="Current-season Mythic+ rating toward Keystone Master (2,000)"
              >
                M+
              </th>
              <th className="season-col-open">Open</th>
              <th className="season-col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((character) => {
              const action = character.action;

              return (
                <tr key={character.id}>
                  <td className="season-col-character">
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
                  <td className="season-col-mplus">
                    <StatusToken token={mythicPlusToken(character)} />
                  </td>
                  <td className="season-col-open">{statusLabel(character)}</td>
                  <td className="season-col-action">
                    {action ? (
                      <Link
                        className="overview-next-action"
                        to={`/characters/${character.id}`}
                      >
                        {action}
                      </Link>
                    ) : (
                      <span className="overview-next-action ready">✓</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
