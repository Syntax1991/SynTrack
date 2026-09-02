import { GLOBAL_TRACKER_SCOPE_KEY } from "../../../../my-syntrack/api/trackers/global-tracker-scope.js";
import { TrackerDefinitionRepository } from "../../../../my-syntrack/api/trackers/tracker-definition.repository.js";
import { TrackerScopeProfileRepository } from "../../../../my-syntrack/api/trackers/tracker-scope-profile.repository.js";
import { TrackerScopeProfileService } from "../../../../my-syntrack/api/trackers/tracker-scope-profile.service.js";
import type { TrackerDefinitionRow } from "../../../../my-syntrack/api/trackers/tracker-repository.types.js";
import {
  WEEKLIES_META_QUEST_TRACKER_KEY,
  WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
  WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY
} from "../../../../my-syntrack/api/weekly-checklist/weeklies-tracker-keys.js";

export type WeekliesTrackerDefinitionsByKey = {
  mythicPlusRating: TrackerDefinitionRow | null;
  troveHuntersBountyUsed: TrackerDefinitionRow | null;
  metaQuest: TrackerDefinitionRow | null;
};

export async function findWeekliesTrackerDefinitionsForImport(): Promise<WeekliesTrackerDefinitionsByKey> {
  const scopeProfileService = new TrackerScopeProfileService(
    new TrackerScopeProfileRepository()
  );
  const definitionRepository = new TrackerDefinitionRepository();

  const activeScope =
    await scopeProfileService.getActive();

  const scopeKeys = [
    ...(activeScope ? [activeScope.key] : []),
    GLOBAL_TRACKER_SCOPE_KEY
  ];

  const definitionsByScope = await Promise.all(
    scopeKeys.map(async (scopeKey) => ({
      scopeKey,
      definitions:
        await definitionRepository.findByScope(scopeKey)
    }))
  );

  const findByKey = (trackerKey: string) => {
    for (const { definitions } of definitionsByScope) {
      const match = definitions.find(
        (definition) =>
          definition.key === trackerKey && definition.enabled
      );

      if (match) {
        return match;
      }
    }

    return null;
  };

  return {
    mythicPlusRating: findByKey(
      WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY
    ),
    troveHuntersBountyUsed: findByKey(
      WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY
    ),
    metaQuest: findByKey(WEEKLIES_META_QUEST_TRACKER_KEY)
  };
}
