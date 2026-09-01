import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import type { TrackerDefinitionRepositoryContract } from "../trackers/tracker-repository.types.js";
import type { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import type { TrackerValueService } from "../trackers/tracker-value.service.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import {
  buildResolvedTracker,
  resolveDefinitionByKey,
  resolveWeekliesGameplaySignals,
  WEEKLIES_SIGNAL_DEFINITION_KEYS
} from "./weeklies-gameplay-signals.mapper.js";
import type { WeekliesGameplaySignals } from "./weeklies-gameplay-signals.types.js";

/*
 * Bulk-loads Weeklies gameplay signal states (2K RIO, MAP, META) from the
 * generic tracker infrastructure. One getStatesForScope call per distinct
 * scope — never per character (N+1 risk: NO).
 */
export async function loadWeekliesGameplaySignalsByCharacterId(
  characterIds: string[],
  deps: {
    trackerScopeProfileService: TrackerScopeProfileService;
    trackerDefinitionRepository: TrackerDefinitionRepositoryContract;
    trackerValueService: TrackerValueService;
  }
): Promise<Map<string, WeekliesGameplaySignals>> {
  const activeScope =
    await deps.trackerScopeProfileService.getActive();

  const scopeKeys = [
    ...(activeScope ? [activeScope.key] : []),
    GLOBAL_TRACKER_SCOPE_KEY
  ];

  const definitionsByScope = new Map(
    await Promise.all(
      scopeKeys.map(async (scopeKey) => [
        scopeKey,
        await deps.trackerDefinitionRepository.findByScope(scopeKey)
      ] as const)
    )
  );

  const twoKRioDefinition = resolveDefinitionByKey(
    definitionsByScope,
    scopeKeys,
    WEEKLIES_SIGNAL_DEFINITION_KEYS.twoKRio
  );
  const mapDefinition = resolveDefinitionByKey(
    definitionsByScope,
    scopeKeys,
    WEEKLIES_SIGNAL_DEFINITION_KEYS.map
  );
  const metaDefinition = resolveDefinitionByKey(
    definitionsByScope,
    scopeKeys,
    WEEKLIES_SIGNAL_DEFINITION_KEYS.meta
  );

  const resolvedDefinitions = [
    twoKRioDefinition,
    mapDefinition,
    metaDefinition
  ].filter(
    (definition): definition is NonNullable<typeof definition> =>
      definition !== null
  );

  const scopeKeysToLoad = [
    ...new Set(
      resolvedDefinitions.map(
        (definition) => definition.scopeKey
      )
    )
  ];

  const trackerStateGroups =
    characterIds.length === 0 || scopeKeysToLoad.length === 0
      ? []
      : await Promise.all(
          scopeKeysToLoad.map((scopeKey) =>
            deps.trackerValueService.getStatesForScope(
              scopeKey,
              characterIds
            )
          )
        );

  const trackerStates = trackerStateGroups.flat();
  const signalsByCharacterId = new Map<
    string,
    WeekliesGameplaySignals
  >();

  for (const characterId of characterIds) {
    const statesByDefinitionId = buildStatesByDefinitionId(
      trackerStates,
      characterId
    );

    signalsByCharacterId.set(
      characterId,
      resolveWeekliesGameplaySignals({
        twoKRio: buildResolvedTracker(
          twoKRioDefinition,
          statesByDefinitionId
        ),
        map: buildResolvedTracker(
          mapDefinition,
          statesByDefinitionId
        ),
        meta: buildResolvedTracker(
          metaDefinition,
          statesByDefinitionId
        )
      })
    );
  }

  return signalsByCharacterId;
}

function buildStatesByDefinitionId(
  trackerStates: CharacterTrackerState[],
  characterId: string
): Map<string, CharacterTrackerState> {
  const statesByDefinitionId = new Map<
    string,
    CharacterTrackerState
  >();

  for (const state of trackerStates) {
    if (state.characterId !== characterId) {
      continue;
    }

    statesByDefinitionId.set(
      state.trackerDefinitionId,
      state
    );
  }

  return statesByDefinitionId;
}
