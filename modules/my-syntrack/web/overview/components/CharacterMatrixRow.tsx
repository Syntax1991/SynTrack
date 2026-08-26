import { Link } from "react-router-dom";
import type {
  CharacterWeeklyState,
  TrackerDefinitionView
} from "../types/overview.types";
import { getClassColor } from "../utils/classColors";
import {
  formatEmbellishmentToken,
  formatGearToken,
  formatItemLevelToken,
  formatProfessionToken,
  formatTierToken,
  formatVaultToken,
  formatWeeklyToken
} from "../utils/overviewCellFormatting";
import { StatusToken } from "./StatusToken";
import { TrackerCell } from "./TrackerCell";

/*
 * The generic "weekly tasks remaining" action applies to nearly every
 * row (it's the built-in checklist, not a discriminating signal) - it
 * renders muted/small rather than competing visually with a genuinely
 * specific action (a real gear/profession/tracker issue).
 */
function NextActionCell({
  state
}: {
  state: CharacterWeeklyState;
}) {
  if (state.nextAction) {
    const isGenericWeekly =
      state.nextAction.domain ===
      "weekly";

    return (
      <Link
        className={
          isGenericWeekly
            ? "overview-next-action muted"
            : "overview-next-action"
        }
        title={
          state.nextAction.detail ??
          undefined
        }
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
      ✓
    </span>
  );
}

export function CharacterMatrixRow({
  state,
  trackerColumns,
  onTrackerChanged
}: {
  state: CharacterWeeklyState;
  trackerColumns: TrackerDefinitionView[];
  onTrackerChanged: () => void;
}) {
  const trackerStateById = new Map(
    state.trackers.map((entry) => [
      entry.trackerDefinitionId,
      entry
    ])
  );

  return (
    <tr>
      <td>
        <div className="overview-character-identity">
          <strong
            style={{
              color: getClassColor(
                state.character
                  .className
              )
            }}
          >
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

      <td className="overview-col-narrow">
        <StatusToken
          token={formatItemLevelToken(
            state.gear
          )}
        />
      </td>

      <td className="overview-col-narrow">
        <StatusToken
          token={formatTierToken(
            state.tier
          )}
        />
      </td>

      <td className="overview-col-narrow">
        <StatusToken
          token={formatEmbellishmentToken(
            state.embellishments
          )}
        />
      </td>

      <td className="overview-col-narrow">
        <StatusToken
          token={formatWeeklyToken(
            state.weekly
          )}
        />
      </td>

      <td className="overview-col-narrow">
        <StatusToken
          token={formatVaultToken(
            state.vault
          )}
        />
      </td>

      {trackerColumns.map(
        (definition) => (
          <td
            className={
              definition.valueType ===
              "TEXT"
                ? "overview-col-medium"
                : "overview-col-narrow"
            }
            key={definition.id}
          >
            <TrackerCell
              characterId={
                state.character.id
              }
              definition={definition}
              onChanged={
                onTrackerChanged
              }
              trackerState={trackerStateById.get(
                definition.id
              )}
            />
          </td>
        )
      )}

      <td className="overview-col-narrow">
        <StatusToken
          token={formatProfessionToken(
            state.professions
          )}
        />
      </td>

      <td className="overview-col-narrow">
        <StatusToken
          token={formatGearToken(
            state.gear
          )}
        />
      </td>

      <td className="overview-col-action">
        <NextActionCell
          state={state}
        />
      </td>
    </tr>
  );
}
