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
  formatProfessionToken,
  formatProfessionWeeklyAggregateToken,
  formatResourceToken,
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
  state: CharacterOverviewRow;
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

  return (
    <tr>
      <td>
        <div className="overview-character-identity">
          <Link
            className="matrix-character-link"
            style={{
              color: getClassColor(
                state.character
                  .className
              )
            }}
            to={`/characters/${state.character.id}`}
          >
            {state.character.name}
          </Link>

          <span>
            {
              state.character
                .className
            }
            {state.tags.length >
              0 &&
              ` · ${state.tags
                .map(
                  (tag) => tag.name
                )
                .join(", ")}`}
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
          token={formatProfessionWeeklyAggregateToken(
            state.professionWeekly
              .profKp,
            "Prof KP"
          )}
        />
      </td>

      <td className="overview-col-narrow">
        <StatusToken
          token={formatProfessionWeeklyAggregateToken(
            state.professionWeekly
              .drops,
            "Knowledge Drops"
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

      <td className="overview-col-narrow">
        <StatusToken
          token={formatResourceToken(
            state.resources
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
