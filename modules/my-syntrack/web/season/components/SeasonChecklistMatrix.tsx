import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import { weekliesSignalTone } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";
import {
  seasonActionDisplay,
  seasonStatusDetail,
  seasonStatusLabel
} from "../../../api/season-checklist/season-checklist.goals.js";
import type { SeasonChecklistCharacter } from "../../../api/season-checklist/season-checklist.types.js";
import type { WeekliesSignalState } from "../../../api/weekly-checklist/weeklies-gameplay-signals.types.js";
import type { SeasonGoalSignal } from "../../../api/season-checklist/season-checklist.types.js";

type SeasonChecklistMatrixProps = {
  characters: SeasonChecklistCharacter[];
};

function seasonToken(signal: SeasonGoalSignal) {
  return {
    symbol: signal.label,
    tone: weekliesSignalTone(
      signal.state as WeekliesSignalState
    ),
    title: signal.detail
  };
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
              <th className="season-col-portals">Portals</th>
              <th className="season-col-catalyst">Catalyst</th>
              <th className="season-col-cracked">Cracked</th>
              <th className="season-col-nemesis">Nemesis</th>
              <th className="season-col-raid">Raid</th>
              <th className="season-col-status">Status</th>
              <th className="season-col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((character) => {
              const actionDisplay = seasonActionDisplay(character);
              const statusDetail = seasonStatusDetail(character);

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
                    <StatusToken token={seasonToken(character.mythicPlus)} />
                  </td>
                  <td className="season-col-portals">
                    <StatusToken token={seasonToken(character.portals)} />
                  </td>
                  <td className="season-col-catalyst">
                    <StatusToken token={seasonToken(character.catalyst)} />
                  </td>
                  <td className="season-col-cracked">
                    <StatusToken token={seasonToken(character.cracked)} />
                  </td>
                  <td className="season-col-nemesis">
                    <StatusToken token={seasonToken(character.nemesis)} />
                  </td>
                  <td className="season-col-raid">
                    <StatusToken token={seasonToken(character.raid)} />
                  </td>
                  <td
                    className="season-col-status"
                    title={statusDetail ?? undefined}
                  >
                    {seasonStatusLabel(character)}
                  </td>
                  <td className="season-col-action">
                    {actionDisplay.kind === "action" ? (
                      <Link
                        className="overview-next-action"
                        to={`/characters/${character.id}`}
                      >
                        {actionDisplay.label}
                      </Link>
                    ) : actionDisplay.kind === "unknown" ? (
                      <span
                        className="overview-next-action unresolved"
                        title="Some Season goals are unresolved"
                      >
                        {actionDisplay.label}
                      </span>
                    ) : actionDisplay.kind === "complete" ? (
                      <span className="overview-next-action ready">
                        {actionDisplay.label}
                      </span>
                    ) : (
                      <span className="overview-next-action empty">
                        {actionDisplay.label}
                      </span>
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
