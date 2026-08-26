import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetItemService } from "../../../data-platform/api/integrations/battlenet/battlenet-item.service.js";
import type {
  BattleNetItemDetails
} from "../../../data-platform/api/integrations/battlenet/battlenet-item.service.js";

/*
 * Bounds a single backfill run, same rationale as the icon backfill:
 * anything left over is picked up by the next run since the
 * "itemQuality IS NULL" filter is naturally resumable.
 */
const MAX_QUALITY_RESOLUTIONS_PER_RUN = 200;

export type ProfessionItemQualityBackfillResult = {
  recipesResolved: number;
};

/*
 * The narrow slice of the Prisma client this service needs, injected so
 * it can be unit-tested against a fake without a mocked module graph.
 */
export type ProfessionItemQualityPrismaClient = {
  craftRecipe: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: (args: any) => Promise<
      { id: string; craftedItemId: number | null }[]
    >;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<unknown>;
  };
};

/*
 * Resolves a recipe's crafted output item's exact Blizzard quality
 * ("EPIC", "RARE", etc.) and item level, by craftedItemId, and persists
 * both on the row. Once a row has an itemQuality, every future read is a
 * plain DB read - Blizzard is never called again for that id. Lookups
 * are deduplicated within a run so N recipes sharing one output item
 * resolve that item exactly once.
 */
export class ProfessionItemQualityResolutionService {
  constructor(
    private readonly itemService:
      BattleNetItemService,
    private readonly db:
      ProfessionItemQualityPrismaClient =
      prisma
  ) {}

  async backfillMissingQuality(): Promise<
    ProfessionItemQualityBackfillResult
  > {
    const recipes =
      await this.db.craftRecipe.findMany(
        {
          where: {
            craftedItemId: {
              not: null
            },
            itemQuality: null
          },
          select: {
            id: true,
            craftedItemId: true
          },
          take:
            MAX_QUALITY_RESOLUTIONS_PER_RUN
        }
      );

    const detailsByItemId =
      new Map<
        number,
        BattleNetItemDetails | null
      >();

    let resolvedCount = 0;

    for (
      const recipe of
      recipes
    ) {
      const itemId =
        recipe.craftedItemId;

      if (itemId === null) {
        continue;
      }

      if (
        !detailsByItemId.has(
          itemId
        )
      ) {
        detailsByItemId.set(
          itemId,
          await this.itemService.resolveItemDetails(
            itemId
          )
        );
      }

      const details =
        detailsByItemId.get(
          itemId
        ) ?? null;

      if (
        !details ||
        !details.quality
      ) {
        continue;
      }

      await this.db.craftRecipe.update({
        where: {
          id: recipe.id
        },
        data: {
          itemQuality:
            details.quality,
          itemLevel:
            details.level
        }
      });

      resolvedCount += 1;
    }

    return {
      recipesResolved:
        resolvedCount
    };
  }
}

export const professionItemQualityResolutionService =
  new ProfessionItemQualityResolutionService(
    new BattleNetItemService(
      new BattleNetAppTokenService()
    )
  );
