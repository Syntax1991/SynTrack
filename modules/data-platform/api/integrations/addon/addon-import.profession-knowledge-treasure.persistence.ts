import { ProfessionKnowledgeTreasureDefinitionRepository } from "../../../../my-syntrack/api/profession-knowledge-treasures/profession-knowledge-treasure-definition.repository.js";
import { ProfessionKnowledgeTreasureDefinitionService } from "../../../../my-syntrack/api/profession-knowledge-treasures/profession-knowledge-treasure-definition.service.js";
import type { ProfessionKnowledgeTreasureDefinitionView } from "../../../../my-syntrack/api/profession-knowledge-treasures/profession-knowledge-treasure-definition.types.js";
import type {
  AddonImportTransaction,
  CharacterPersistenceResult
} from "./addon-import.persistence.types.js";
import type {
  AddonProfessionKnowledgeTreasureSnapshot,
  AddonProfessionKnowledgeTreasureSource
} from "./addon-import.profession-knowledge-treasure.types.js";

export type ProfessionKnowledgeTreasureDefinitionLookup = {
  listEnabledForActiveSeason(): Promise<
    ProfessionKnowledgeTreasureDefinitionView[]
  >;
};

/*
 * Same raw-evidence -> state rule as Weekly Quest/Treatise/Drops - see
 * addon-import.profession-weekly.persistence.ts.
 */
function deriveState(
  source: AddonProfessionKnowledgeTreasureSource
): "COMPLETE" | "INCOMPLETE" | "UNKNOWN" {
  if (source.flaggedCompleted === null) {
    return "UNKNOWN";
  }

  return source.flaggedCompleted ? "COMPLETE" : "INCOMPLETE";
}

/*
 * A one-time treasure's completion is permanent - once Blizzard's own
 * quest-flag evidence says COMPLETE, no later capture may downgrade
 * it. A genuinely-completed hidden quest flag cannot become
 * un-completed; the only way a later capture disagrees is a transient
 * API/pcall failure (UNKNOWN) or - implausibly - a wrong id, neither
 * of which should destroy already-proven permanent truth. See the
 * profession weekly correctness follow-up's Knowledge Treasures
 * addition and its "monotonic completion safety" requirement.
 */
export class AddonProfessionKnowledgeTreasurePersistence {
  constructor(
    private readonly definitionService: ProfessionKnowledgeTreasureDefinitionLookup =
      new ProfessionKnowledgeTreasureDefinitionService(
        new ProfessionKnowledgeTreasureDefinitionRepository()
      )
  ) {}

  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    knowledgeTreasures: AddonProfessionKnowledgeTreasureSnapshot | null,
    result: CharacterPersistenceResult
  ): Promise<void> {
    if (!knowledgeTreasures) {
      return;
    }

    const capturedAt = knowledgeTreasures.capturedAt
      ? new Date(knowledgeTreasures.capturedAt)
      : new Date();

    const definitions =
      await this.definitionService.listEnabledForActiveSeason();

    const byProfessionAndSource = new Map<
      string,
      ProfessionKnowledgeTreasureDefinitionView
    >(
      definitions.map((definition) => [
        `${definition.professionKey}:${definition.sourceKey}`,
        definition
      ])
    );

    for (const entry of knowledgeTreasures.professions) {
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

        const existing =
          await transaction.characterProfessionKnowledgeTreasureSnapshot.findUnique(
            {
              where: {
                characterId_definitionId: {
                  characterId,
                  definitionId: definition.id
                }
              },
              select: { state: true }
            }
          );

        const derivedState = deriveState(source);

        if (
          existing?.state === "COMPLETE" &&
          derivedState !== "COMPLETE"
        ) {
          continue;
        }

        await transaction.characterProfessionKnowledgeTreasureSnapshot.upsert(
          {
            where: {
              characterId_definitionId: {
                characterId,
                definitionId: definition.id
              }
            },
            create: {
              characterId,
              definitionId: definition.id,
              state: derivedState,
              flaggedCompleted: source.flaggedCompleted,
              externalQuestId: source.externalQuestId,
              source: "ADDON",
              capturedAt
            },
            update: {
              state: derivedState,
              flaggedCompleted: source.flaggedCompleted,
              externalQuestId: source.externalQuestId,
              source: "ADDON",
              capturedAt
            }
          }
        );

        result.professionKnowledgeTreasureSnapshots += 1;
      }
    }
  }
}
