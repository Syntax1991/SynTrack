import type { TrackerValueService } from "../trackers/tracker-value.service.js";
import type {
  CharacterTrackerState,
  TrackerDefinitionView
} from "./overview.types.js";

/*
 * Extracted from OverviewService to stay under the 350-line architecture
 * cap - batches one getStatesForScope call per distinct pinned scope
 * (never per character), then narrows the flattened result down to
 * exactly the pinned+enabled tracker definitions and groups it per
 * character. No tracker completion logic lives here - it only reads
 * TrackerValueService's already-computed states.
 */
export async function buildTrackerStatesByCharacterId(
  trackerValueService: TrackerValueService,
  trackerColumns: TrackerDefinitionView[],
  characterIds: string[]
): Promise<Map<string, CharacterTrackerState[]>> {
  const pinnedScopeKeys = [
    ...new Set(
      trackerColumns.map(
        (definition) => definition.scopeKey
      )
    )
  ];

  const trackerStateGroups =
    pinnedScopeKeys.length === 0
      ? []
      : await Promise.all(
          pinnedScopeKeys.map((scopeKey) =>
            trackerValueService.getStatesForScope(
              scopeKey,
              characterIds
            )
          )
        );

  const trackerStates = trackerStateGroups.flat();

  const pinnedTrackerDefinitionIds = new Set(
    trackerColumns.map(
      (definition) => definition.id
    )
  );

  const trackerStatesByCharacterId = new Map<
    string,
    CharacterTrackerState[]
  >();

  for (const state of trackerStates) {
    if (
      !pinnedTrackerDefinitionIds.has(
        state.trackerDefinitionId
      )
    ) {
      continue;
    }

    const existing =
      trackerStatesByCharacterId.get(
        state.characterId
      ) ?? [];

    existing.push(state);
    trackerStatesByCharacterId.set(
      state.characterId,
      existing
    );
  }

  return trackerStatesByCharacterId;
}
