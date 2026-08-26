import { Link } from "react-router-dom";
import type { CharacterWeeklyState } from "../types/overview.types";
import { useMatrixFilters } from "../hooks/useMatrixFilters";
import {
  formatEmbellishmentsCell,
  formatGearCell,
  formatItemLevelCell,
  formatProfessionCell,
  formatTierCell,
  formatVaultCell,
  formatWeeklyCell
} from "../utils/overviewCellFormatting";
import { MatrixToolbar } from "./MatrixToolbar";
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

function CharacterMatrixRow({
  state
}: {
  state: CharacterWeeklyState;
}) {
  const weekly = formatWeeklyCell(
    state.weekly
  );

  const vault = formatVaultCell(
    state.vault
  );

  const professions =
    formatProfessionCell(
      state.professions
    );

  const gear = formatGearCell(
    state.gear
  );

  const itemLevel =
    formatItemLevelCell(state.gear);

  const tier = formatTierCell(
    state.tier
  );

  const embellishments =
    formatEmbellishmentsCell(
      state.embellishments
    );

  return (
    <tr>
      <td>
        <div className="overview-character-identity">
          <strong>
            {state.character.name}
          </strong>

          <span>
            {
              state.character
                .className
            }
          </span>
        </div>
      </td>

      <td>
        <OverviewStatusBadge
          detail={itemLevel.detail}
          state={itemLevel.state}
        />
      </td>

      <td>
        <OverviewStatusBadge
          state={tier.state}
        />
      </td>

      <td>
        <OverviewStatusBadge
          state={
            embellishments.state
          }
        />
      </td>

      <td>
        <OverviewStatusBadge
          detail={weekly.detail}
          state={weekly.state}
        />
      </td>

      <td>
        <OverviewStatusBadge
          detail={vault.detail}
          state={vault.state}
        />
      </td>

      <td>
        <OverviewStatusBadge
          detail={professions.detail}
          state={professions.state}
        />
      </td>

      <td>
        <OverviewStatusBadge
          detail={gear.detail}
          state={gear.state}
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

export function CharacterWeeklyMatrix({
  characters
}: {
  characters: CharacterWeeklyState[];
}) {
  const {
    readinessFilter,
    setReadinessFilter,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    visibleCharacters
  } = useMatrixFilters(characters);

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
          {visibleCharacters.length}
          {visibleCharacters.length !==
            characters.length &&
            ` / ${characters.length}`}
        </span>
      </div>

      <MatrixToolbar
        onReadinessFilterChange={
          setReadinessFilter
        }
        onSearchTermChange={
          setSearchTerm
        }
        onSortByChange={setSortBy}
        readinessFilter={
          readinessFilter
        }
        searchTerm={searchTerm}
        sortBy={sortBy}
      />

      <div className="table-scroll">
        <table className="overview-matrix">
          <thead>
            <tr>
              <th>Character</th>
              <th>iLvl</th>
              <th>Set</th>
              <th>Embellish</th>
              <th>Weeklies</th>
              <th>Vault</th>
              <th>Professions</th>
              <th>Gear</th>
              <th>Next action</th>
            </tr>
          </thead>

          <tbody>
            {visibleCharacters.length ===
            0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    No characters
                    match this filter.
                  </div>
                </td>
              </tr>
            ) : (
              visibleCharacters.map(
                (state) => (
                  <CharacterMatrixRow
                    key={
                      state.character
                        .id
                    }
                    state={state}
                  />
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
