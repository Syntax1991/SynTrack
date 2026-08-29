import { AddonGearPersistence } from "./addon-import.gear.persistence.js";
import { AddonProfessionPersistence } from "./addon-import.profession.persistence.js";
import { AddonProfessionWeeklyPersistence } from "./addon-import.profession-weekly.persistence.js";
import { AddonResourcePersistence } from "./addon-import.resource.persistence.js";
import { getSyncDate } from "./addon-import.persistence-utils.js";
import type {
  AddonImportTransaction,
  AddonNodeIdMap,
  CharacterPersistenceResult,
  ProfessionIdMap
} from "./addon-import.persistence.types.js";
import type {
  AddonCharacter,
  AddonSnapshot
} from "./addon-import.types.js";

export class AddonCharacterPersistence {
  private readonly gearPersistence =
    new AddonGearPersistence();

  private readonly resourcePersistence =
    new AddonResourcePersistence();

  private readonly professionPersistence =
    new AddonProfessionPersistence();

  private readonly professionWeeklyPersistence =
    new AddonProfessionWeeklyPersistence();

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
      gearSlots: 0,
      resourceSnapshots: 0,
      professionWeeklySnapshots: 0
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
      await this.professionPersistence.persist(
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

    await this.resourcePersistence.persist(
      transaction,
      storedCharacter.id,
      character.resources,
      result
    );

    await this.professionWeeklyPersistence.persist(
      transaction,
      storedCharacter.id,
      character.professionWeekly,
      result
    );
  }
}
