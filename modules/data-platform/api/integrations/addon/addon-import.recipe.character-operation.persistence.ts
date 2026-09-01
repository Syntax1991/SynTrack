import {
  AppError
} from "../../../../../apps/api/src/shared/errors/AppError.js";
import {
  createCharacterRecipeOperationValues
} from "./addon-import.character-recipe-operation.values.js";
import {
  getSyncDate
} from "./addon-import.persistence-utils.js";
import {
  createRecipeMapKey
} from "./addon-import.recipe.persistence-utils.js";
import type {
  AddonImportTransaction,
  ProfessionIdMap
} from "./addon-import.persistence.types.js";
import type {
  AddonCharacter,
  AddonCharacterRecipeOperationCapture,
  AddonProfession,
  AddonSnapshot
} from "./addon-import.types.js";

function isPersistableCapture(
  capture:
    AddonCharacterRecipeOperationCapture
): boolean {
  return (
    capture.status === "CAPTURED" &&
    capture.captureVersion >= 3 &&
    capture.scopeVersion >= 1
  );
}

function findProfession(
  character: AddonCharacter,
  capture:
    AddonCharacterRecipeOperationCapture
): AddonProfession | null {
  return (
    character.professions.find(
      (profession) =>
        profession.expansions.some(
          (expansion) =>
            expansion.skillLineId ===
            capture.skillLineId
        )
    ) ??
    null
  );
}

export class AddonCharacterRecipeOperationPersistence {
  async persist(
    transaction: AddonImportTransaction,
    snapshot: AddonSnapshot,
    professionIds: ProfessionIdMap,
    recipeIds: Map<string, string>
  ): Promise<number> {
    const charactersByKey =
      new Map(
        snapshot.characters.map(
          (character) =>
            [
              character.key,
              character
            ] as const
        )
      );

    let persistedOperations =
      0;

    for (
      const capture of
      snapshot.characterRecipeOperations
    ) {
      if (
        !isPersistableCapture(
          capture
        )
      ) {
        continue;
      }

      const character =
        charactersByKey.get(
          capture.characterKey
        );

      if (!character) {
        continue;
      }

      persistedOperations +=
        await this.persistCapture(
          transaction,
          character,
          capture,
          professionIds,
          recipeIds
        );
    }

    return persistedOperations;
  }

  private async persistCapture(
    transaction: AddonImportTransaction,
    character: AddonCharacter,
    capture:
      AddonCharacterRecipeOperationCapture,
    professionIds: ProfessionIdMap,
    recipeIds: Map<string, string>
  ): Promise<number> {
    const profession =
      findProfession(
        character,
        capture
      );

    if (
      !profession ||
      !profession.professionKey
    ) {
      return 0;
    }

    const professionId =
      professionIds.get(
        profession.professionKey
      );

    if (!professionId) {
      throw new AppError(
        400,
        `Beruf "${profession.professionKey}" fehlt in der Datenbank.`
      );
    }

    const storedCharacter =
      await transaction
        .character
        .findUnique({
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

          select: {
            id: true
          }
        });

    if (!storedCharacter) {
      // Character persistence may intentionally skip account-removed
      // identities; operation captures for those characters are ignored.
      return 0;
    }

    const assignment =
      await transaction
        .characterProfession
        .findUnique({
          where: {
            characterId_professionId: {
              characterId:
                storedCharacter.id,
              professionId
            }
          },

          select: {
            id: true
          }
        });

    if (!assignment) {
      throw new AppError(
        400,
        `Berufszuordnung "${character.name} / ${profession.name}" fehlt nach dem Addon-Import.`
      );
    }

    const syncDate =
      getSyncDate(
        capture.capturedAt ??
        character.lastUpdatedAt
      );

    let persistedOperations =
      0;

    for (
      const operation of
      capture.recipes
    ) {
      const craftRecipeId =
        recipeIds.get(
          createRecipeMapKey(
            capture.skillLineId,
            operation.gameRecipeId
          )
        );

      if (!craftRecipeId) {
        throw new AppError(
          400,
          `Operation-Rezept ${operation.gameRecipeId} für ${profession.name} fehlt im Rezeptkatalog.`
        );
      }

      const operationValues =
        createCharacterRecipeOperationValues(
          operation
        );

      await transaction
        .characterCraftRecipe
        .upsert({
          where: {
            characterProfessionId_craftRecipeId: {
              characterProfessionId:
                assignment.id,
              craftRecipeId
            }
          },

          create: {
            characterProfessionId:
              assignment.id,
            craftRecipeId,
            learned:
              true,
            ...operationValues,
            operationCapturedAt:
              syncDate,
            operationCaptureVersion:
              capture.captureVersion,
            operationScopeVersion:
              capture.scopeVersion,
            source:
              "ADDON",
            lastSyncedAt:
              syncDate
          },

          update: {
            learned:
              true,
            ...operationValues,
            operationCapturedAt:
              syncDate,
            operationCaptureVersion:
              capture.captureVersion,
            operationScopeVersion:
              capture.scopeVersion,
            source:
              "ADDON",
            lastSyncedAt:
              syncDate
          }
        });

      persistedOperations +=
        1;
    }

    return persistedOperations;
  }
}