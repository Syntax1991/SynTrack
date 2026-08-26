import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import { BattleNetMediaService } from "../../../data-platform/api/integrations/battlenet/battlenet-media.service.js";

/*
 * Bounds a single backfill run so a cold-start pass (or a large addon
 * import) cannot fire an unbounded number of Blizzard requests at once.
 * Anything left over is picked up by the next run (server restart, or
 * the next addon import) since the "iconUrl IS NULL" filter is
 * naturally resumable.
 */
const MAX_ICON_RESOLUTIONS_PER_RUN = 200;

export type ProfessionIconBackfillResult = {
  recipesResolved: number;
  nodesResolved: number;
};

/*
 * The narrow slice of the Prisma client this service needs, injected so
 * it can be unit-tested against a fake without touching the real
 * database or a mocked module graph.
 */
export type ProfessionIconPrismaClient = {
  craftRecipe: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: (args: any) => Promise<
      { id: string; craftedItemId: number | null }[]
    >;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<unknown>;
  };
  professionSpecializationNode: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: (args: any) => Promise<
      { id: string; spellId: number | null }[]
    >;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<unknown>;
  };
};

/*
 * Resolves real Blizzard icons for CraftRecipe (by craftedItemId) and
 * ProfessionSpecializationNode (by spellId) rows that don't have one
 * cached yet, then persists the result on the row itself. Once a row has
 * an iconUrl, every future read is a plain DB read - Blizzard is never
 * called again for that id. Lookups are deduplicated within a run so N
 * recipes sharing one output item resolve that item exactly once.
 */
export class ProfessionIconResolutionService {
  constructor(
    private readonly mediaService:
      BattleNetMediaService,
    private readonly db:
      ProfessionIconPrismaClient =
      prisma
  ) {}

  async backfillMissingIcons(): Promise<
    ProfessionIconBackfillResult
  > {
    const recipesResolved =
      await this.backfillRecipeIcons();

    const nodesResolved =
      await this.backfillNodeIcons();

    return {
      recipesResolved,
      nodesResolved
    };
  }

  private async backfillRecipeIcons(): Promise<number> {
    const recipes =
      await this.db.craftRecipe.findMany({
        where: {
          craftedItemId: {
            not: null
          },
          iconUrl: null
        },
        select: {
          id: true,
          craftedItemId: true
        },
        take:
          MAX_ICON_RESOLUTIONS_PER_RUN
      });

    const iconUrlByItemId =
      new Map<
        number,
        string | null
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
        !iconUrlByItemId.has(
          itemId
        )
      ) {
        iconUrlByItemId.set(
          itemId,
          await this.mediaService.resolveItemIconUrl(
            itemId
          )
        );
      }

      const iconUrl =
        iconUrlByItemId.get(
          itemId
        ) ?? null;

      if (!iconUrl) {
        continue;
      }

      await this.db.craftRecipe.update({
        where: {
          id: recipe.id
        },
        data: {
          iconUrl
        }
      });

      resolvedCount += 1;
    }

    return resolvedCount;
  }

  private async backfillNodeIcons(): Promise<number> {
    const nodes =
      await this.db.professionSpecializationNode.findMany(
        {
          where: {
            spellId: {
              not: null
            },
            iconUrl: null
          },
          select: {
            id: true,
            spellId: true
          },
          take:
            MAX_ICON_RESOLUTIONS_PER_RUN
        }
      );

    const iconUrlBySpellId =
      new Map<
        number,
        string | null
      >();

    let resolvedCount = 0;

    for (
      const node of
      nodes
    ) {
      const spellId =
        node.spellId;

      if (spellId === null) {
        continue;
      }

      if (
        !iconUrlBySpellId.has(
          spellId
        )
      ) {
        iconUrlBySpellId.set(
          spellId,
          await this.mediaService.resolveSpellIconUrl(
            spellId
          )
        );
      }

      const iconUrl =
        iconUrlBySpellId.get(
          spellId
        ) ?? null;

      if (!iconUrl) {
        continue;
      }

      await this.db.professionSpecializationNode.update(
        {
          where: {
            id: node.id
          },
          data: {
            iconUrl
          }
        }
      );

      resolvedCount += 1;
    }

    return resolvedCount;
  }
}

export const professionIconResolutionService =
  new ProfessionIconResolutionService(
    new BattleNetMediaService(
      new BattleNetAppTokenService()
    )
  );
