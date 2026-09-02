import { resolveTrackerPeriodKey } from "../../../../my-syntrack/api/trackers/tracker-period.js";
import { buildTrackerValueColumns } from "../../../../my-syntrack/api/trackers/tracker-value-invariants.js";
import type { TrackerResetBehavior } from "../../../../my-syntrack/api/trackers/tracker.types.js";
import type {
  AddonImportTransaction,
  CharacterPersistenceResult
} from "./addon-import.persistence.types.js";
import {
  findSeasonEvidenceTrackerDefinitionsForImport,
  type SeasonEvidenceDefinitionsByKey
} from "./addon-import.season-evidence.lookup.js";
import type { AddonSeasonEvidenceSnapshot } from "./addon-import.season-evidence.types.js";

export type SeasonEvidenceDefinitionLookup = {
  findSeasonEvidenceTrackerDefinitions(): Promise<SeasonEvidenceDefinitionsByKey>;
};

export class AddonSeasonEvidencePersistence {
  constructor(
    private readonly definitionLookup: SeasonEvidenceDefinitionLookup = {
      findSeasonEvidenceTrackerDefinitions:
        findSeasonEvidenceTrackerDefinitionsForImport
    }
  ) {}

  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    snapshot: AddonSeasonEvidenceSnapshot | null,
    result: CharacterPersistenceResult
  ): Promise<void> {
    if (!snapshot) {
      return;
    }

    const definitions =
      await this.definitionLookup.findSeasonEvidenceTrackerDefinitions();
    const captured = [
      ...Object.values(snapshot.achievements).map((evidence) => ({
        trackerKey: evidence.trackerKey,
        completed: evidence.completed
      })),
      ...Object.values(snapshot.quests).map((evidence) => ({
        trackerKey: evidence.trackerKey,
        completed: evidence.flaggedCompleted
      }))
    ];

    for (const evidence of captured) {
      const definition = definitions.get(evidence.trackerKey);

      if (!definition || evidence.completed === null) {
        continue;
      }

      const columns = buildTrackerValueColumns("BOOLEAN", {
        valueType: "BOOLEAN",
        boolean: evidence.completed
      });
      const periodKey = resolveTrackerPeriodKey(
        definition.resetBehavior as TrackerResetBehavior
      );

      await transaction.characterTrackerValue.upsert({
        where: {
          trackerDefinitionId_characterId_periodKey: {
            trackerDefinitionId: definition.id,
            characterId,
            periodKey
          }
        },
        create: {
          trackerDefinitionId: definition.id,
          characterId,
          periodKey,
          ...columns,
          source: "ADDON"
        },
        update: {
          ...columns,
          source: "ADDON"
        }
      });

      result.seasonEvidenceSnapshots += 1;
    }
  }
}
