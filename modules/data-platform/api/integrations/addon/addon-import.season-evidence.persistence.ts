import { resolveTrackerPeriodKey } from "../../../../my-syntrack/api/trackers/tracker-period.js";
import { buildTrackerValueColumns } from "../../../../my-syntrack/api/trackers/tracker-value-invariants.js";
import type { TrackerResetBehavior } from "../../../../my-syntrack/api/trackers/tracker.types.js";
import { SEASON_EVIDENCE_CATALOG } from "../../../../my-syntrack/api/season-checklist/season-evidence-catalog.js";
import { resolveSeasonAchievementCompletion } from "../../../../my-syntrack/api/season-checklist/season-achievement-evidence.js";
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

/**
 * Persistence behavior for unresolved captures:
 * - known boolean → upsert
 * - unresolved (null) → skip write, preserving any previously recorded value
 *
 * Successful false from WoW APIs is treated as authoritative when returned
 * as a boolean. API failure / non-boolean results stay null and do not
 * overwrite proven completion.
 */
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
    const catalogByKey = new Map(
      SEASON_EVIDENCE_CATALOG.map((entry) => [entry.trackerKey, entry])
    );

    const captured: Array<{ trackerKey: string; completed: boolean | null }> = [
      ...Object.values(snapshot.achievements).map((evidence) => {
        const catalog = catalogByKey.get(evidence.trackerKey);
        return {
          trackerKey: evidence.trackerKey,
          completed: catalog
            ? resolveSeasonAchievementCompletion(
                catalog.scope,
                evidence.accountCompleted,
                evidence.earnedByCharacter
              )
            : null
        };
      }),
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
