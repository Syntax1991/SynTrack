import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type {
  CharacterWeeklyState,
  TrackerDefinitionView
} from "../../overview/types/overview.types";
import { formatTrackerToken } from "../../overview/utils/trackerCellFormatting";

type CharacterTrackersSectionProps = {
  character: CharacterWeeklyState;
  trackerColumns: TrackerDefinitionView[];
};

/*
 * Shows only the pinned+enabled season trackers the active tracker
 * scope already exposes to Overview - never hardcoded names, and
 * omitted entirely (by the caller) when no tracker is pinned, rather
 * than inventing placeholder trackers.
 */
export function CharacterTrackersSection({
  character,
  trackerColumns
}: CharacterTrackersSectionProps) {
  const stateByDefinitionId = new Map(
    character.trackers.map(
      (state) => [
        state.trackerDefinitionId,
        state
      ]
    )
  );

  return (
    <section className="character-detail-section">
      <h2>Season trackers</h2>

      <ul className="character-tracker-list">
        {trackerColumns.map(
          (definition) => (
            <li
              className="character-tracker-row"
              key={definition.id}
            >
              <span>
                {definition.name}
              </span>

              <StatusToken
                token={formatTrackerToken(
                  stateByDefinitionId.get(
                    definition.id
                  )
                )}
              />
            </li>
          )
        )}
      </ul>
    </section>
  );
}
