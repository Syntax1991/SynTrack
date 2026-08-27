import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import {
  createNodeMapKey,
  getTrackedExpansion,
  isTrackedExpansion
} from "./addon-import.persistence-utils.js";
import type {
  AddonImportTransaction,
  AddonNodeIdMap,
  CharacterPersistenceResult,
  ProfessionIdMap
} from "./addon-import.persistence.types.js";
import type { AddonProfession } from "./addon-import.types.js";

/*
 * Extracted from AddonCharacterPersistence to stay under the 350-line
 * architecture cap - profession assignment/specialization-progress
 * persistence is its own concern, independent of the character-row
 * upsert and the Gear/Resources module delegation.
 */
export class AddonProfessionPersistence {
  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    profession: AddonProfession,
    professionIds: ProfessionIdMap,
    nodeIds: AddonNodeIdMap,
    syncDate: Date,
    result: CharacterPersistenceResult
  ): Promise<void> {
    const professionKey =
      profession.professionKey;

    if (!professionKey) {
      throw new AppError(
        400,
        `Beruf "${profession.name}" konnte nicht zugeordnet werden.`
      );
    }

    const professionId =
      professionIds.get(
        professionKey
      );

    if (!professionId) {
      throw new AppError(
        400,
        `Beruf "${professionKey}" fehlt in der Datenbank.`
      );
    }

    const trackedExpansion =
      getTrackedExpansion(
        profession
      );

    const assignment =
      await transaction.characterProfession.upsert({
        where: {
          characterId_professionId: {
            characterId,
            professionId
          }
        },

        create: {
          characterId,
          professionId,

          skill:
            trackedExpansion
              ? profession.skillLevel
              : 0,

          skillModifier:
            trackedExpansion
              ? profession.skillModifier
              : 0,

          knowledgePoints:
            trackedExpansion
              ?.investedKnowledge ??
            0,

          specializationSummary:
            trackedExpansion
              ?.displayName ??
            null
        },

        update: {
          skill:
            trackedExpansion
              ? profession.skillLevel
              : 0,

          skillModifier:
            trackedExpansion
              ? profession.skillModifier
              : 0,

          knowledgePoints:
            trackedExpansion
              ?.investedKnowledge ??
            0,

          specializationSummary:
            trackedExpansion
              ?.displayName ??
            null
        }
      });

    /*
     * Once addon data is imported it is authoritative for specialization
     * progress. Legacy manual progress must not survive beside the snapshot.
     */
    await transaction
      .characterProfessionNodeProgress
      .deleteMany({
        where: {
          characterProfessionId:
            assignment.id
        }
      });

    await this.persistProgress(
      transaction,
      assignment.id,
      profession,
      nodeIds,
      syncDate,
      result
    );
  }

  private async persistProgress(
    transaction: AddonImportTransaction,
    characterProfessionId: string,
    profession: AddonProfession,
    nodeIds: AddonNodeIdMap,
    syncDate: Date,
    result: CharacterPersistenceResult
  ): Promise<void> {
    for (
      const expansion of
      profession.expansions
    ) {
      if (
        !isTrackedExpansion(
          expansion
        )
      ) {
        continue;
      }

      for (
        const progress of
        expansion.progress
      ) {
        const nodeId =
          nodeIds.get(
            createNodeMapKey(
              expansion.skillLineId,
              progress.externalTreeId,
              progress.externalNodeId
            )
          );

        if (!nodeId) {
          throw new AppError(
            400,
            `Spezialisierungsknoten ${progress.externalNodeId} für ${profession.name} fehlt im Katalog.`
          );
        }

        await transaction
          .characterProfessionNodeProgress
          .upsert({
            where: {
              characterProfessionId_nodeId: {
                characterProfessionId,
                nodeId
              }
            },

            create: {
              characterProfessionId,
              nodeId,

              rank:
                progress.rank,

              knowledgeRank:
                progress.knowledgeRank,

              unlockRank:
                progress.unlockRank,

              source:
                "ADDON",

              lastSyncedAt:
                syncDate
            },

            update: {
              rank:
                progress.rank,

              knowledgeRank:
                progress.knowledgeRank,

              unlockRank:
                progress.unlockRank,

              source:
                "ADDON",

              lastSyncedAt:
                syncDate
            }
          });

        result.progressEntries +=
          1;
      }
    }
  }
}
