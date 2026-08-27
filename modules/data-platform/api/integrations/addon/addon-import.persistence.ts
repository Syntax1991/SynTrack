import { prisma } from "../../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { professionIconResolutionService } from "../../../../professions/api/icons/profession-icon-resolution.service.js";
import { professionItemQualityResolutionService } from "../../../../professions/api/icons/profession-item-quality-resolution.service.js";
import { AddonCatalogPersistence } from "./addon-import.catalog.persistence.js";
import { AddonCharacterPersistence } from "./addon-import.character.persistence.js";
import { collectProfessionKeys } from "./addon-import.persistence-utils.js";
import { AddonRecipePersistence } from "./addon-import.recipe.persistence.js";
import type {
  ProfessionIdMap
} from "./addon-import.persistence.types.js";
import type {
  AddonImportResult,
  AddonSnapshot
} from "./addon-import.types.js";

export class AddonImportPersistence {
  private readonly catalogPersistence =
    new AddonCatalogPersistence();

  private readonly characterPersistence =
    new AddonCharacterPersistence();

  private readonly recipePersistence =
    new AddonRecipePersistence();

  async persist(
    snapshot: AddonSnapshot
  ): Promise<AddonImportResult> {
    const result =
      await this.persistTransaction(
        snapshot
      );

    /*
     * Fire-and-forget: newly imported recipes/nodes may now have
     * craftedItemId/spellId values with no cached icon yet. This never
     * blocks the import response, and any Blizzard-side failure is only
     * ever logged - it can never fail the import itself.
     */
    void professionIconResolutionService
      .backfillMissingIcons()
      .catch(
        (error: unknown) => {
          console.error(
            "Profession icon backfill after addon import failed.",
            error
          );
        }
      );

    void professionItemQualityResolutionService
      .backfillMissingQuality()
      .catch(
        (error: unknown) => {
          console.error(
            "Profession item quality backfill after addon import failed.",
            error
          );
        }
      );

    return result;
  }

  private async persistTransaction(
    snapshot: AddonSnapshot
  ): Promise<AddonImportResult> {
    return prisma.$transaction(
      async (
        transaction
      ) => {
        const professionIds =
          await this.loadProfessionIds(
            transaction,
            snapshot
          );

        const catalogResult =
          await this.catalogPersistence.persist(
            transaction,
            snapshot,
            professionIds
          );

        const characterResult =
          await this.characterPersistence.persist(
            transaction,
            snapshot,
            professionIds,
            catalogResult.nodeIds
          );

        await this.recipePersistence.persist(
          transaction,
          snapshot,
          professionIds
        );

        return {
          addonVersion:
            snapshot.addonVersion,
          schemaVersion:
            snapshot.schemaVersion,
          importedAt:
            new Date()
              .toISOString(),
          processed: {
            catalogs:
              catalogResult.catalogs,
            trees:
              catalogResult.trees,
            specializationNodes:
              catalogResult.nodes,
            characters:
              characterResult.characters,
            professionAssignments:
              characterResult
                .professionAssignments,
            progressEntries:
              characterResult
                .progressEntries,
            gearSlots:
              characterResult
                .gearSlots,
            resourceSnapshots:
              characterResult
                .resourceSnapshots
          }
        };
      }
    );
  }

  private async loadProfessionIds(
    transaction:
      Parameters<
        Parameters<
          typeof prisma.$transaction
        >[0]
      >[0],
    snapshot:
      AddonSnapshot
  ): Promise<ProfessionIdMap> {
    const requiredKeys =
      collectProfessionKeys(
        snapshot
      );

    const professions =
      await transaction
        .profession
        .findMany({
          where: {
            key: {
              in:
                requiredKeys
            }
          },
          select: {
            id: true,
            key: true
          }
        });

    const professionIds:
      ProfessionIdMap =
      new Map(
        professions.map(
          (profession) => [
            profession.key,
            profession.id
          ]
        )
      );

    const missingKeys =
      requiredKeys.filter(
        (professionKey) =>
          !professionIds.has(
            professionKey
          )
      );

    if (
      missingKeys.length >
      0
    ) {
      throw new AppError(
        400,
        `Berufe fehlen in der Datenbank: ${missingKeys.join(", ")}. Bitte zuerst den Datenbank-Seed ausführen.`
      );
    }

    return professionIds;
  }
}