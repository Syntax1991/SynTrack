import { describe, expect, it, vi } from "vitest";
import type {
  ProfessionItemQualityPrismaClient
} from "./profession-item-quality-resolution.service.js";
import { ProfessionItemQualityResolutionService } from "./profession-item-quality-resolution.service.js";

function createFakeDb(
  recipes: {
    id: string;
    craftedItemId: number | null;
  }[]
): ProfessionItemQualityPrismaClient & {
  updates: {
    id: string;
    itemQuality: string;
    itemLevel: number | null;
  }[];
} {
  const updates:
    {
      id: string;
      itemQuality: string;
      itemLevel: number | null;
    }[] = [];

  return {
    updates,

    craftRecipe: {
      findMany: vi.fn(
        async () => recipes
      ),
      update: vi.fn(
        async (
          args: {
            where: { id: string };
            data: {
              itemQuality: string;
              itemLevel: number | null;
            };
          }
        ) => {
          updates.push({
            id: args.where.id,
            itemQuality:
              args.data.itemQuality,
            itemLevel:
              args.data.itemLevel
          });
        }
      )
    }
  };
}

function createFakeItemService(
  detailsByItemId: Record<
    number,
    { quality: string | null; level: number | null } | null
  >
) {
  return {
    resolveItemDetails: vi.fn(
      async (itemId: number) =>
        detailsByItemId[itemId] ??
        null
    )
  };
}

describe("ProfessionItemQualityResolutionService", () => {
  it("resolves a recipe's craftedItemId to its exact Epic quality and item level, and persists both", async () => {
    const db = createFakeDb([
      {
        id: "recipe-1",
        craftedItemId: 244589
      }
    ]);

    const itemService =
      createFakeItemService({
        244589: {
          quality: "EPIC",
          level: 220
        }
      });

    const service =
      new ProfessionItemQualityResolutionService(
        itemService as never,
        db
      );

    const result =
      await service.backfillMissingQuality();

    expect(
      result.recipesResolved
    ).toBe(1);

    expect(db.updates).toEqual([
      {
        id: "recipe-1",
        itemQuality: "EPIC",
        itemLevel: 220
      }
    ]);
  });

  it("deduplicates: two recipes sharing the same craftedItemId resolve that item exactly once", async () => {
    const db = createFakeDb([
      {
        id: "recipe-1",
        craftedItemId: 244589
      },
      {
        id: "recipe-2",
        craftedItemId: 244589
      }
    ]);

    const itemService =
      createFakeItemService({
        244589: {
          quality: "EPIC",
          level: 220
        }
      });

    const service =
      new ProfessionItemQualityResolutionService(
        itemService as never,
        db
      );

    await service.backfillMissingQuality();

    expect(
      itemService.resolveItemDetails
    ).toHaveBeenCalledTimes(1);

    expect(
      db.updates
    ).toHaveLength(2);
  });

  it("distinguishes Rare from Epic - a Rare item is never persisted as Epic", async () => {
    const db = createFakeDb([
      {
        id: "recipe-rare",
        craftedItemId: 244584
      }
    ]);

    const itemService =
      createFakeItemService({
        244584: {
          quality: "RARE",
          level: 200
        }
      });

    const service =
      new ProfessionItemQualityResolutionService(
        itemService as never,
        db
      );

    await service.backfillMissingQuality();

    expect(
      db.updates[0]?.itemQuality
    ).toBe("RARE");

    expect(
      db.updates[0]?.itemQuality
    ).not.toBe("EPIC");
  });

  it("leaves a row unresolved when Blizzard has no quality for that id, rather than writing a fabricated quality", async () => {
    const db = createFakeDb([
      {
        id: "recipe-1",
        craftedItemId: 999
      }
    ]);

    const itemService =
      createFakeItemService({
        999: {
          quality: null,
          level: null
        }
      });

    const service =
      new ProfessionItemQualityResolutionService(
        itemService as never,
        db
      );

    const result =
      await service.backfillMissingQuality();

    expect(
      result.recipesResolved
    ).toBe(0);

    expect(db.updates).toEqual([]);
  });
});
