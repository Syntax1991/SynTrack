import { Link } from "react-router-dom";
import type {
  CharacterOverviewRow,
  TrackerDefinitionView
} from "../types/overview.types";
import { getClassColor } from "../utils/classColors";
import {
  formatEmbellishmentToken,
  formatGearToken,
  formatItemLevelToken,
  formatTierToken
} from "../utils/overviewCellFormatting";
import {
  formatProfessionSetupToken,
  formatResourcesToken,
  formatWeeklySummaryToken
} from "../utils/overviewTriageFormatting";
import { StatusToken } from "./StatusToken";
import { TrackerCell } from "./TrackerCell";

function NextActionCell({
  state
}: {
  state: CharacterOverviewRow;
}) {
  if (state.nextAction) {
    return (
      <Link
        className="overview-next-action"
        title={state.nextAction.detail ?? undefined}
        to={state.nextAction.path}
      >
        {state.nextAction.label}
      </Link>
    );
  }

  if (state.readinessState === "unknown") {
    return (
      <span className="overview-next-action muted">
        Tracking incomplete
      </span>
    );
  }

  return <span className="overview-next-action ready">✓</span>;
}

function professionSetupTitle(
  state: CharacterOverviewRow
): string {
  const lines = state.professionSetup.professions.map(
    (profession) => {
      const treasure =
        profession.treasures.applicableTotal === 0
          ? "—"
          : `${profession.treasures.completeCount}/${profession.treasures.applicableTotal}`;
      const dataOk =
        profession.dataStatus === "TRACKED" ? "✓" : "!";
      const treasureOk =
        profession.treasures.incompleteCount > 0
          ? "!"
          : profession.treasures.unknownCount > 0
            ? "?"
            : profession.treasures.applicableTotal > 0
              ? "✓"
              : "—";
      return `${profession.name}\n  Data ${dataOk}\n  Treasures ${treasure} ${treasureOk}`;
    }
  );

  return lines.length > 0
    ? `Profession setup\n\n${lines.join("\n\n")}`
    : "Profession setup";
}

export function CharacterMatrixRow({
  state,
  trackerColumns,
  onTrackerChanged
}: {
  state: CharacterOverviewRow;
  trackerColumns: TrackerDefinitionView[];
  onTrackerChanged: () => void;
}) {
  const trackerStateById = new Map(
    state.trackers.map((entry) => [
      entry.trackerDefinitionId,
      entry
    ])
  );

  const weeklyToken = formatWeeklySummaryToken(state.weeklySummary);
  const professionToken = formatProfessionSetupToken(
    state.professionSetup
  );

  return (
    <tr>
      <td>
        <div className="overview-character-identity">
          <Link
            className="matrix-character-link"
            style={{
              color: getClassColor(state.character.className)
            }}
            to={`/characters/${state.character.id}`}
          >
            {state.character.name}
          </Link>

          <span>
            {state.character.className}
            {state.tags.length > 0 &&
              ` · ${state.tags.map((tag) => tag.name).join(", ")}`}
          </span>
        </div>
      </td>

      <td className="overview-col-narrow">
        <StatusToken token={formatItemLevelToken(state.gear)} />
      </td>

      <td className="overview-col-narrow">
        <StatusToken token={formatTierToken(state.tier)} />
      </td>

      <td className="overview-col-narrow">
        <StatusToken
          token={formatEmbellishmentToken(state.embellishments)}
        />
      </td>

      <td className="overview-col-narrow">
        <Link
          className="overview-token-link"
          title={weeklyToken.title}
          to="/weekly-checklist"
        >
          <StatusToken token={weeklyToken} />
        </Link>
      </td>

      {trackerColumns.map((definition) => (
        <td
          className={
            definition.valueType === "TEXT"
              ? "overview-col-medium"
              : "overview-col-narrow"
          }
          key={definition.id}
        >
          <TrackerCell
            characterId={state.character.id}
            definition={definition}
            onChanged={onTrackerChanged}
            trackerState={trackerStateById.get(definition.id)}
          />
        </td>
      ))}

      <td className="overview-col-narrow">
        <Link
          className="overview-token-link"
          title={professionSetupTitle(state)}
          to={`/characters/${state.character.id}`}
        >
          <StatusToken
            token={{
              ...professionToken,
              title: professionSetupTitle(state)
            }}
          />
        </Link>
      </td>

      <td className="overview-col-narrow">
        <Link
          className="overview-token-link"
          title={formatGearToken(state.gear).title}
          to={`/characters/${state.character.id}`}
        >
          <StatusToken token={formatGearToken(state.gear)} />
        </Link>
      </td>

      <td className="overview-col-narrow">
        <Link
          className="overview-token-link"
          title={formatResourcesToken(state.resources).title}
          to={`/characters/${state.character.id}`}
        >
          <StatusToken token={formatResourcesToken(state.resources)} />
        </Link>
      </td>

      <td className="overview-col-action">
        <NextActionCell state={state} />
      </td>
    </tr>
  );
}
