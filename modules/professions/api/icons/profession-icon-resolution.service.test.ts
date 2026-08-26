import { describe, expect, it, vi } from "vitest";
import type {
  ProfessionIconPrismaClient
} from "./profession-icon-resolution.service.js";
import { ProfessionIconResolutionService } from "./profession-icon-resolution.service.js";

function createFakeDb(
  recipes: {
    id: string;
    craftedItemId: number | null;
  }[],
  nodes: {
    id: string;
    spellId: number | null;
  }[]
): ProfessionIconPrismaClient & {
  recipeUpdates: { id: string; iconUrl: string }[];
  nodeUpdates: { id: string; iconUrl: string }[];
} {
  const recipeUpdates:
    { id: string; iconUrl: string }[] =
    [];

  const nodeUpdates:
    { id: string; iconUrl: string }[] =
    [];

  return {
    recipeUpdates,
    nodeUpdates,

    craftRecipe: {
      findMany: vi.fn(
        async () => recipes
      ),
      update: vi.fn(
        async (
          args: {
            where: { id: string };
            data: { iconUrl: string };
          }
        ) => {
          recipeUpdates.push({
            id: args.where.id,
            iconUrl:
              args.data.iconUrl
          });
        }
      )
    },

    professionSpecializationNode: {
      findMany: vi.fn(
        async () => nodes
      ),
      update: vi.fn(
        async (
          args: {
            where: { id: string };
            data: { iconUrl: string };
          }
        ) => {
          nodeUpdates.push({
            id: args.where.id,
            iconUrl:
              args.data.iconUrl
          });
        }
      )
    }
  };
}

function createFakeMediaService(
  itemIconsById: Record<number, string | null>,
  spellIconsById: Record<number, string | null> = {}
) {
  return {
    resolveItemIconUrl: vi.fn(
      async (itemId: number) =>
        itemIconsById[itemId] ?? null
    ),
    resolveSpellIconUrl: vi.fn(
      async (spellId: number) =>
        spellIconsById[spellId] ?? null
    )
  };
}

describe("ProfessionIconResolutionService", () => {
  it("resolves a recipe's craftedItemId to a real icon and persists it", async () => {
    const db = createFakeDb(
      [
        {
          id: "recipe-1",
          craftedItemId: 123456
        }
      ],
      []
    );

    const media =
      createFakeMediaService({
        123456:
          "https://render.worldofwarcraft.com/icons/56/inv_x.jpg"
      });

    const service =
      new ProfessionIconResolutionService(
        media as never,
        db
      );

    const result =
      await service.backfillMissingIcons();

    expect(
      result.recipesResolved
    ).toBe(1);

    expect(
      db.recipeUpdates
    ).toEqual([
      {
        id: "recipe-1",
        iconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_x.jpg"
      }
    ]);
  });

  it("deduplicates: two recipes sharing the same craftedItemId resolve that item exactly once", async () => {
    const db = createFakeDb(
      [
        {
          id: "recipe-1",
          craftedItemId: 123456
        },
        {
          id: "recipe-2",
          craftedItemId: 123456
        }
      ],
      []
    );

    const media =
      createFakeMediaService({
        123456:
          "https://render.worldofwarcraft.com/icons/56/inv_x.jpg"
      });

    const service =
      new ProfessionIconResolutionService(
        media as never,
        db
      );

    await service.backfillMissingIcons();

    expect(
      media.resolveItemIconUrl
    ).toHaveBeenCalledTimes(1);

    expect(
      db.recipeUpdates
    ).toHaveLength(2);
  });

  it("resolves a specialization node's spellId to its real spell icon and persists it", async () => {
    const db = createFakeDb(
      [],
      [
        {
          id: "node-1",
          spellId: 98765
        }
      ]
    );

    const media =
      createFakeMediaService(
        {},
        {
          98765:
            "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
        }
      );

    const service =
      new ProfessionIconResolutionService(
        media as never,
        db
      );

    const result =
      await service.backfillMissingIcons();

    expect(
      result.nodesResolved
    ).toBe(1);

    expect(
      db.nodeUpdates
    ).toEqual([
      {
        id: "node-1",
        iconUrl:
          "https://render.worldofwarcraft.com/icons/56/inv_securely_shaped.jpg"
      }
    ]);
  });

  it("leaves a row unresolved (no update) when Blizzard has no icon for that id, rather than writing a fabricated value", async () => {
    const db = createFakeDb(
      [
        {
          id: "recipe-1",
          craftedItemId: 999
        }
      ],
      []
    );

    const media =
      createFakeMediaService({
        999: null
      });

    const service =
      new ProfessionIconResolutionService(
        media as never,
        db
      );

    const result =
      await service.backfillMissingIcons();

    expect(
      result.recipesResolved
    ).toBe(0);

    expect(
      db.recipeUpdates
    ).toEqual([]);
  });

  it("only ever queries and resolves by numeric id fields, never by name", async () => {
    const db = createFakeDb(
      [
        {
          id: "recipe-1",
          craftedItemId: 123456
        }
      ],
      []
    );

    const media =
      createFakeMediaService({
        123456:
          "https://render.worldofwarcraft.com/icons/56/inv_x.jpg"
      });

    const service =
      new ProfessionIconResolutionService(
        media as never,
        db
      );

    await service.backfillMissingIcons();

    expect(
      media.resolveItemIconUrl
    ).toHaveBeenCalledWith(123456);

    const calledWith =
      media.resolveItemIconUrl.mock
        .calls[0]?.[0];

    expect(
      typeof calledWith
    ).toBe("number");
  });
});
