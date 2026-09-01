import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { getSyncDate } from "./addon-import.persistence-utils.js";
import { createRecipeMapKey } from "./addon-import.recipe.persistence-utils.js";
import type {
  AddonImportTransaction,
  ProfessionIdMap,
  RecipePersistenceResult
} from "./addon-import.persistence.types.js";
import type {
  AddonCharacter,
  AddonProfession,
  AddonSnapshot
} from "./addon-import.types.js";

export class AddonCharacterRecipePersistence {
  async persist(
    transaction: AddonImportTransaction,
    snapshot: AddonSnapshot,
    professionIds: ProfessionIdMap,
    recipeIds: Map<string, string>,
    result: RecipePersistenceResult
  ): Promise<void> {
    for (
      const character of
      snapshot.characters
    ) {
      await this.persistCharacterRecipes(
        transaction,
        character,
        professionIds,
        recipeIds,
        result
      );
    }
  }

  private async persistCharacterRecipes(
    transaction: AddonImportTransaction,
    character: AddonCharacter,
    professionIds: ProfessionIdMap,
    recipeIds: Map<string, string>,
    result: RecipePersistenceResult
  ): Promise<void> {
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
      // identities; recipe data for those characters is ignored too.
      return;
    }

    for (
      const profession of
      character.professions
    ) {
      await this.persistProfessionRecipes(
        transaction,
        storedCharacter.id,
        character,
        profession,
        professionIds,
        recipeIds,
        result
      );
    }
  }

  private async persistProfessionRecipes(
    transaction: AddonImportTransaction,
    characterId: string,
    character: AddonCharacter,
    profession: AddonProfession,
    professionIds: ProfessionIdMap,
    recipeIds: Map<string, string>,
    result: RecipePersistenceResult
  ): Promise<void> {
    if (
      !profession.professionKey
    ) {
      return;
    }

    const capturedExpansions =
      profession.expansions.filter(
        (expansion) =>
          expansion.recipeIds !==
          null
      );

    if (
      capturedExpansions.length ===
      0
    ) {
      return;
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

    const assignment =
      await transaction
        .characterProfession
        .findUnique({
          where: {
            characterId_professionId: {
              characterId,
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

    const capturedSkillLineIds =
      new Set(
        capturedExpansions.map(
          (expansion) =>
            expansion.skillLineId
        )
      );

    const existingLinks =
      await transaction
        .characterCraftRecipe
        .findMany({
          where: {
            characterProfessionId:
              assignment.id,
            source:
              "ADDON"
          },

          select: {
            id: true,

            recipe: {
              select: {
                skillLineId:
                  true
              }
            }
          }
        });

    const staleLinkIds =
      existingLinks
        .filter(
          (link) =>
            link.recipe.skillLineId !==
              null &&
            capturedSkillLineIds.has(
              link.recipe.skillLineId
            )
        )
        .map(
          (link) =>
            link.id
        );

    if (
      staleLinkIds.length >
      0
    ) {
      await transaction
        .characterCraftRecipe
        .deleteMany({
          where: {
            id: {
              in:
                staleLinkIds
            }
          }
        });
    }

    for (
      const expansion of
      capturedExpansions
    ) {
      const syncDate =
        getSyncDate(
          expansion.recipeCapturedAt ??
          character.lastUpdatedAt
        );

      for (
        const gameRecipeId of
        expansion.recipeIds ??
        []
      ) {
        const craftRecipeId =
          recipeIds.get(
            createRecipeMapKey(
              expansion.skillLineId,
              gameRecipeId
            )
          );

        if (!craftRecipeId) {
          throw new AppError(
            400,
            `Rezept ${gameRecipeId} für ${profession.name} fehlt im Rezeptkatalog.`
          );
        }

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
              source:
                "ADDON",
              lastSyncedAt:
                syncDate
            },

            update: {
              learned:
                true,
              source:
                "ADDON",
              lastSyncedAt:
                syncDate
            }
          });

        result.learnedRecipes +=
          1;
      }
    }
  }
}