import type { TrackerDefinitionRepositoryContract } from "../trackers/tracker-repository.types.js";
import type {
  TrackerResetBehavior,
  TrackerValueType
} from "../trackers/tracker.types.js";
import {
  WEEKLIES_META_QUEST_TRACKER_KEY,
  WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY
} from "./weeklies-tracker-keys.js";

type WeekliesTrackerDefinitionSeed = {
  key: string;
  name: string;
  valueType: TrackerValueType;
  resetBehavior: TrackerResetBehavior;
  category: string;
  sortOrder: number;
};

/*
 * Season-scoped tracker definitions consumed by the Weeklies gameplay
 * signals read model. MAP is intentionally omitted until product defines
 * canonical meaning and reset behavior.
 */
const WEEKLIES_TRACKER_DEFINITION_SEEDS: WeekliesTrackerDefinitionSeed[] =
  [
    {
      key: WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
      name: "Mythic+ Rating",
      valueType: "NUMBER",
      resetBehavior: "SEASONAL",
      category: "GAMEPLAY",
      sortOrder: 10
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
