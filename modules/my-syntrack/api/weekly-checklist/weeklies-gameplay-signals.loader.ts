import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import type { TrackerDefinitionRepositoryContract } from "../trackers/tracker-repository.types.js";
import type { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import type { TrackerValueService } from "../trackers/tracker-value.service.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import {
  buildResolvedTracker,
  resolveDefinitionByKey,
  WEEKLIES_SIGNAL_DEFINITION_KEYS
} from "./weeklies-gameplay-signals.mapper.js";

/*
 * Bulk-loads Weeklies weekly signals (MAP bounty + META) from generic
 * trackers. Seasonal 2K rating lives on /season — not here.
 * One getStatesForScope call per distinct scope (N+1 risk: NO).
 */
export async function loadWeekliesTrackerBundlesByCharacterId(
  characterIds: string[],
  deps: {
    trackerScopeProfileService: TrackerScopeProfileService;
    trackerDefinitionRepository: TrackerDefinitionRepositoryContract;
    trackerValueService: TrackerValueService;
  }
): Promise<
  Map<
    string,
    {
      bounty: ReturnType<typeof buildResolvedTracker>;
      meta: ReturnType<typeof buildResolvedTracker>;
    }
  >
> {
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

  const bountyDefinition = resolveDefinitionByKey(
    definitionsByScope,
    scopeKeys,
    WEEKLIES_SIGNAL_DEFINITION_KEYS.bounty
  );
  const metaDefinition = resolveDefinitionByKey(
    definitionsByScope,
    scopeKeys,
    WEEKLIES_SIGNAL_DEFINITION_KEYS.meta
  );

  const resolvedDefinitions = [
    bountyDefinition,
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
  const bundlesByCharacterId = new Map<
    string,
    {
      bounty: ReturnType<typeof buildResolvedTracker>;
      meta: ReturnType<typeof buildResolvedTracker>;
    }
  >();

  for (const characterId of characterIds) {
    const statesByDefinitionId = buildStatesByDefinitionId(
      trackerStates,
      characterId
    );

    bundlesByCharacterId.set(characterId, {
      bounty: buildResolvedTracker(
        bountyDefinition,
        statesByDefinitionId
      ),
      meta: buildResolvedTracker(
        metaDefinition,
        statesByDefinitionId
      )
    });
  }

  return bundlesByCharacterId;
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
