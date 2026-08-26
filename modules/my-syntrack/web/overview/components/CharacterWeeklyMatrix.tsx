import { Link } from "react-router-dom";
import type { CharacterWeeklyState } from "../types/overview.types";
import {
  formatGearCell,
  formatProfessionCell,
  formatVaultCell,
  formatWeeklyCell
} from "../utils/overviewCellFormatting";
import { OverviewStatusBadge } from "./OverviewStatusBadge";

function NextActionCell({
  state
}: {
  state: CharacterWeeklyState;
}) {
  if (state.nextAction) {
    return (
      <Link
        className="overview-next-action"
        to={state.nextAction.path}
      >
        {state.nextAction.label}
      </Link>
    );
  }

  if (
    state.readinessState ===
    "unknown"
  ) {
    return (
      <span className="overview-next-action muted">
        Tracking incomplete
      </span>
    );
  }

  return (
    <span className="overview-next-action ready">
      Ready
    </span>
  );
}

export function CharacterWeeklyMatrix({
  characters
}: {
  characters: CharacterWeeklyState[];
}) {
  if (characters.length === 0) {
    return (
      <section className="panel overview-matrix-panel">
        <div className="empty-state">
          Add a character to see
          weekly state here.
        </div>
      </section>
    );
  }

  return (
    <section className="panel overview-matrix-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            EVERY TRACKED CHARACTER
          </p>

          <h2>Characters</h2>
        </div>

        <span className="overview-matrix-count">
          {characters.length}
        </span>
      </div>

      <div className="table-scroll">
        <table className="overview-matrix">
          <thead>
            <tr>
              <th>Character</th>
              <th>Weeklies</th>
              <th>Vault</th>
              <th>Professions</th>
              <th>Gear</th>
              <th>Next action</th>
            </tr>
          </thead>

          <tbody>
            {characters.map(
              (state) => {
                const weekly =
                  formatWeeklyCell(
                    state.weekly
                  );

                const vault =
                  formatVaultCell(
                    state.vault
                  );

                const professions =
                  formatProfessionCell(
                    state.professions
                  );

                const gear =
                  formatGearCell(
                    state.gear
                  );

                return (
                  <tr
                    key={
                      state.character
                        .id
                    }
                  >
                    <td>
                      <div className="overview-character-identity">
                        <strong>
                          {
                            state
                              .character
                              .name
                          }
                        </strong>

                        <span>
                          {
                            state
                              .character
                              .className
                          }
                        </span>
                      </div>
                    </td>

                    <td>
                      <OverviewStatusBadge
                        detail={
                          weekly.detail
                        }
                        state={
                          weekly.state
                        }
                      />
                    </td>

                    <td>
                      <OverviewStatusBadge
                        detail={
                          vault.detail
                        }
                        state={
                          vault.state
                        }
                      />
                    </td>

                    <td>
                      <OverviewStatusBadge
                        detail={
                          professions.detail
                        }
                        state={
                          professions.state
                        }
                      />
                    </td>

                    <td>
                      <OverviewStatusBadge
                        detail={
                          gear.detail
                        }
                        state={
                          gear.state
                        }
                      />
                    </td>

                    <td>
                      <NextActionCell
                        state={state}
                      />
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
