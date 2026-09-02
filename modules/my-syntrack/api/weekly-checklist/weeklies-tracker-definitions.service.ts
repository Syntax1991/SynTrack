import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import { TrackerDefinitionRepository } from "../trackers/tracker-definition.repository.js";
import { TrackerScopeProfileRepository } from "../trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../trackers/tracker-scope-profile.service.js";
import type { TrackerDefinitionRepositoryContract } from "../trackers/tracker-repository.types.js";
import type {
  TrackerResetBehavior,
  TrackerValueType
} from "../trackers/tracker.types.js";
import {
  WEEKLIES_META_QUEST_TRACKER_KEY,
  WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
  WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY
} from "./weeklies-tracker-keys.js";

type WeekliesTrackerDefinitionSeed = {
  key: string;
  name: string;
  valueType: TrackerValueType;
  resetBehavior: TrackerResetBehavior;
  category: string;
  sortOrder: number;
};

const WEEKLIES_TRACKER_DEFINITION_SEEDS: WeekliesTrackerDefinitionSeed[] =
  [
    {
      key: WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
      name: "Mythic+ Rating (2,000)",
      valueType: "NUMBER",
      resetBehavior: "SEASONAL",
      category: "GAMEPLAY",
      sortOrder: 10
    },
    {
      key: WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY,
      name: "Trove Hunter's Bounty used",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY",
      category: "GAMEPLAY",
      sortOrder: 15
    },
    {
      key: WEEKLIES_META_QUEST_TRACKER_KEY,
      name: "Weekly Meta Quest",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY",
      category: "GAMEPLAY",
      sortOrder: 20
    }
  ];

export async function ensureWeekliesTrackerDefinitions(
  scopeKey: string,
  repository: TrackerDefinitionRepositoryContract
): Promise<void> {
  await Promise.all(
    WEEKLIES_TRACKER_DEFINITION_SEEDS.map(async (seed) => {
      const existing = await repository.findByIdentity(
        scopeKey,
        seed.key
      );

      if (existing) {
        return;
      }

      await repository.create({
        scopeKey,
        key: seed.key,
        name: seed.name,
        valueType: seed.valueType,
        resetBehavior: seed.resetBehavior,
        category: seed.category,
        sortOrder: seed.sortOrder,
        isPinned: false
      });
    })
  );
}

/*
 * Addon import must be able to persist Weeklies tracker values even if
 * the user has never opened /weekly-checklist (which also ensures defs).
 */
export type ActiveScopeLookup = {
  getActive(): Promise<{ key: string } | null>;
};

export async function ensureWeekliesTrackerDefinitionsForImport(
  repository: TrackerDefinitionRepositoryContract = new TrackerDefinitionRepository(),
  scopeProfileService: ActiveScopeLookup = new TrackerScopeProfileService(
    new TrackerScopeProfileRepository()
  )
): Promise<string> {
  const activeScope =
    await scopeProfileService.getActive();
  const scopeKey =
    activeScope?.key ?? GLOBAL_TRACKER_SCOPE_KEY;

  await ensureWeekliesTrackerDefinitions(
    scopeKey,
    repository
  );

  return scopeKey;
}
