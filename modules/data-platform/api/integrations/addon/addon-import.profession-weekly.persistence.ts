import { getWeeklyPeriod } from "../../../../my-syntrack/api/shared/weekly-period.js";
import { ProfessionWeeklyDefinitionRepository } from "../../../../my-syntrack/api/profession-weekly/profession-weekly-definition.repository.js";
import { ProfessionWeeklyDefinitionService } from "../../../../my-syntrack/api/profession-weekly/profession-weekly-definition.service.js";
import type { ProfessionWeeklySourceDefinitionView } from "../../../../my-syntrack/api/profession-weekly/profession-weekly-definition.types.js";
import type {
  AddonImportTransaction,
  CharacterPersistenceResult
} from "./addon-import.persistence.types.js";
import type {
  AddonProfessionWeeklySnapshot,
  AddonProfessionWeeklySource
} from "./addon-import.profession-weekly.types.js";

export type ProfessionWeeklyDefinitionLookup = {
  listEnabledForActiveSeason(): Promise<
    ProfessionWeeklySourceDefinitionView[]
  >;
};

/*
 * Deriving COMPLETE/INCOMPLETE/UNKNOWN here (not in Lua, not in the
 * read model) keeps exactly one place responsible for the raw-evidence
 * -> state rule, mirroring how Resources never computes weeklyComplete
 * in Lua either. A quest-flag source with no evidence (addon never
 * captured it, or its definition isn't enabled) never reaches this
 * function at all - see the filtering below - so it can never be
 * silently treated as INCOMPLETE.
 */
function deriveState(
  definition: ProfessionWeeklySourceDefinitionView,
  source: AddonProfessionWeeklySource
): "COMPLETE" | "INCOMPLETE" | "UNKNOWN" {
  if (definition.sourceType === "KNOWLEDGE_DROPS") {
    if (source.currentValue === null || source.maxValue === null) {
      return "UNKNOWN";
    }

    return source.currentValue >= source.maxValue
      ? "COMPLETE"
      : "INCOMPLETE";
  }

  if (source.flaggedCompleted === null) {
    return "UNKNOWN";
  }

  return source.flaggedCompleted ? "COMPLETE" : "INCOMPLETE";
}

/*
 * The addon may broadly capture every candidate source it knows about
 * (see the Lua-side ProfessionWeeklyCatalog) - only sources matching an
 * ENABLED ProfessionWeeklySourceDefinition for the active season (+
 * GLOBAL) are ever persisted. An unmatched/disabled source is
 * intentionally ignored, never stored under a guessed definition (see
 * the Automatic Profession Weekly audit's "leave disabled rather than
 * inventing an id" rule).
 *
 * One row is written per (character, sourceDefinition, weekly period) -
 * never overwritten across a reset, unlike CharacterResourceSnapshot's
 * latest-state-only shape (see the Prisma schema comment).
 */
export class AddonProfessionWeeklyPersistence {
  constructor(
    private readonly definitionService: ProfessionWeeklyDefinitionLookup =
      new ProfessionWeeklyDefinitionService(
        new ProfessionWeeklyDefinitionRepository()
      )
  ) {}

  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    professionWeekly: AddonProfessionWeeklySnapshot | null,
    result: CharacterPersistenceResult
  ): Promise<void> {
    if (!professionWeekly) {
      return;
    }

    const capturedAt = professionWeekly.capturedAt
      ? new Date(professionWeekly.capturedAt)
      : new Date();

    const periodKey = getWeeklyPeriod(capturedAt).key;

    const definitions =
      await this.definitionService.listEnabledForActiveSeason();

    const byProfessionAndSource = new Map<
      string,
      ProfessionWeeklySourceDefinitionView
    >(
      definitions.map((definition) => [
        `${definition.professionKey}:${definition.sourceKey}`,
        definition
      ])
    );

    for (const entry of professionWeekly.professions) {
      if (!entry.professionKey) {
        continue;
      }

      for (const source of entry.sources) {
        const definition = byProfessionAndSource.get(
          `${entry.professionKey}:${source.sourceKey}`
        );

        if (!definition) {
          continue;
        }

        await transaction.characterProfessionWeeklySnapshot.upsert({
          where: {
            characterId_sourceDefinitionId_periodKey: {
              characterId,
              sourceDefinitionId: definition.id,
              periodKey
            }
          },
          create: {
            characterId,
            sourceDefinitionId: definition.id,
            periodKey,
            state: deriveState(definition, source),
            flaggedCompleted: source.flaggedCompleted,
            externalQuestId: source.externalQuestId,
            currentValue: source.currentValue,
            maxValue: source.maxValue,
            source: "ADDON",
            capturedAt
          },
          update: {
            state: deriveState(definition, source),
            flaggedCompleted: source.flaggedCompleted,
            externalQuestId: source.externalQuestId,
            currentValue: source.currentValue,
            maxValue: source.maxValue,
            source: "ADDON",
            capturedAt
          }
        });

        result.professionWeeklySnapshots += 1;
      }
    }
  }
}
