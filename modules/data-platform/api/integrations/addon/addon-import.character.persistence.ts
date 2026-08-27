import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { AddonGearPersistence } from "./addon-import.gear.persistence.js";
import {
  createNodeMapKey,
  getSyncDate,
  getTrackedExpansion,
  isTrackedExpansion
} from "./addon-import.persistence-utils.js";
import type {
  AddonImportTransaction,
  AddonNodeIdMap,
  CharacterPersistenceResult,
  ProfessionIdMap
} from "./addon-import.persistence.types.js";
import type {
  AddonCharacter,
  AddonProfession,
  AddonSnapshot
} from "./addon-import.types.js";

export class AddonCharacterPersistence {
  private readonly gearPersistence =
    new AddonGearPersistence();

  async persist(
    transaction: AddonImportTransaction,
    snapshot: AddonSnapshot,
    professionIds: ProfessionIdMap,
    nodeIds: AddonNodeIdMap
  ): Promise<CharacterPersistenceResult> {
    const result: CharacterPersistenceResult = {
      characters: 0,
      professionAssignments: 0,
      progressEntries: 0,
      gearSlots: 0
    };

    for (
      const character of
      snapshot.characters
    ) {
      await this.persistCharacter(
        transaction,
        character,
        professionIds,
        nodeIds,
        result
      );

      result.characters += 1;
    }

    return result;
  }

  private async persistCharacter(
    transaction: AddonImportTransaction,
    character: AddonCharacter,
    professionIds: ProfessionIdMap,
    nodeIds: AddonNodeIdMap,
    result: CharacterPersistenceResult
  ): Promise<void> {
    const syncDate =
      getSyncDate(
        character.lastUpdatedAt
      );

    const storedCharacter =
      await transaction.character.upsert({
        where: {
          name_realm_region: {
            name:
              character.name,
            realm:
              character.realm,
            region:
              character.region
          }
        },

        create: {
          name:
            character.name,
          realm:
            character.realm,
          region:
            character.region,
          className:
            character.className,
          level:
            character.level,
          source:
            "ADDON",
          lastSyncedAt:
            syncDate
        },

        update: {
          className:
            character.className,
          level:
            character.level,
          lastSyncedAt:
            syncDate
        }
      });

    for (
      const profession of
      character.professions
    ) {
      await this.persistProfession(
        transaction,
        storedCharacter.id,
        profession,
        professionIds,
        nodeIds,
        syncDate,
        result
      );

      result.professionAssignments +=
        1;
    }

    await this.gearPersistence.persist(
      transaction,
      storedCharacter.id,
      character.gear,
      result
    );
  }

  private async persistProfession(
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