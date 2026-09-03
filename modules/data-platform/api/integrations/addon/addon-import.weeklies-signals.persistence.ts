import { getWeeklyPeriod } from "../../../../my-syntrack/api/shared/weekly-period.js";
import { resolveTrackerPeriodKey } from "../../../../my-syntrack/api/trackers/tracker-period.js";
import { buildTrackerValueColumns } from "../../../../my-syntrack/api/trackers/tracker-value-invariants.js";
import type { TrackerDefinitionRow } from "../../../../my-syntrack/api/trackers/tracker-repository.types.js";
import { metaEligibleSparkQuestIds } from "../../../../my-syntrack/api/weekly-checklist/midnight-weekly-spark-quest-catalog.js";
import { deriveMetaQuestCompletion } from "../../../../my-syntrack/api/weekly-checklist/midnight-weekly-spark-meta.js";
import type {
  AddonImportTransaction,
  CharacterPersistenceResult
} from "./addon-import.persistence.types.js";
import type { AddonWeekliesSignalsSnapshot } from "./addon-import.weeklies-signals.types.js";
import {
  findWeekliesTrackerDefinitionsForImport,
  type WeekliesTrackerDefinitionsByKey
} from "./addon-import.weeklies-signals.lookup.js";

export type WeekliesTrackerDefinitionLookup = {
  findWeekliesTrackerDefinitions(): Promise<WeekliesTrackerDefinitionsByKey>;
};

async function upsertAddonTrackerValue(
  transaction: AddonImportTransaction,
  input: {
    definition: TrackerDefinitionRow;
    characterId: string;
    periodKey: string;
    columns: ReturnType<typeof buildTrackerValueColumns>;
  }
): Promise<void> {
  await transaction.characterTrackerValue.upsert({
    where: {
      trackerDefinitionId_characterId_periodKey: {
        trackerDefinitionId: input.definition.id,
        characterId: input.characterId,
        periodKey: input.periodKey
      }
    },
    create: {
      trackerDefinitionId: input.definition.id,
      characterId: input.characterId,
      periodKey: input.periodKey,
      ...input.columns,
      source: "ADDON"
    },
    update: {
      ...input.columns,
      source: "ADDON"
    }
  });
}

function resolveMetaFlaggedCompleted(
  weekliesSignals: AddonWeekliesSignalsSnapshot
): boolean | null {
  if (weekliesSignals.metaQuest.evidence.length > 0) {
    return deriveMetaQuestCompletion(
      weekliesSignals.metaQuest.evidence,
      metaEligibleSparkQuestIds()
    ).flaggedCompleted;
  }

  return weekliesSignals.metaQuest.flaggedCompleted;
}

/*
 * Writes Weeklies tracker signals from addon evidence into
 * CharacterTrackerValue using the same period-key invariants as
 * TrackerValueService, but inside the existing addon import
 * transaction.
 */
export class AddonWeekliesSignalsPersistence {
  constructor(
    private readonly definitionLookup: WeekliesTrackerDefinitionLookup = {
      findWeekliesTrackerDefinitions:
        findWeekliesTrackerDefinitionsForImport
    }
  ) {}

  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    weekliesSignals: AddonWeekliesSignalsSnapshot | null,
    result: CharacterPersistenceResult
  ): Promise<void> {
    if (!weekliesSignals) {
      return;
    }

    const capturedAt = weekliesSignals.capturedAt
      ? new Date(weekliesSignals.capturedAt)
      : new Date();

    const weeklyPeriodKey =
      getWeeklyPeriod(capturedAt).key;

    const definitions =
      await this.definitionLookup.findWeekliesTrackerDefinitions();

    if (
      weekliesSignals.mythicPlusRating.captured &&
      weekliesSignals.mythicPlusRating.seasonRating !== null &&
      definitions.mythicPlusRating
    ) {
      await upsertAddonTrackerValue(transaction, {
        definition: definitions.mythicPlusRating,
        characterId,
        periodKey: resolveTrackerPeriodKey("SEASONAL", capturedAt),
        columns: buildTrackerValueColumns("NUMBER", {
          valueType: "NUMBER",
          number: weekliesSignals.mythicPlusRating.seasonRating
        })
      });

      result.weekliesSignalSnapshots += 1;
    }

    if (
      weekliesSignals.troveHuntersBountyUsed.flaggedCompleted !==
        null &&
      definitions.troveHuntersBountyUsed
    ) {
      await upsertAddonTrackerValue(transaction, {
        definition: definitions.troveHuntersBountyUsed,
        characterId,
        periodKey: weeklyPeriodKey,
        columns: buildTrackerValueColumns("BOOLEAN", {
          valueType: "BOOLEAN",
          boolean:
            weekliesSignals.troveHuntersBountyUsed
              .flaggedCompleted
        })
      });

      result.weekliesSignalSnapshots += 1;
    }

    const metaFlagged = resolveMetaFlaggedCompleted(weekliesSignals);

    if (metaFlagged !== null && definitions.metaQuest) {
      await upsertAddonTrackerValue(transaction, {
        definition: definitions.metaQuest,
        characterId,
        periodKey: weeklyPeriodKey,
        columns: buildTrackerValueColumns("BOOLEAN", {
          valueType: "BOOLEAN",
          boolean: metaFlagged
        })
      });

      result.weekliesSignalSnapshots += 1;
    }
  }
}
