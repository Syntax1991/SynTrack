import { describe, expect, it } from "vitest";
import { AddonResourcePersistence } from "./addon-import.resource.persistence.js";
import type { CharacterPersistenceResult } from "./addon-import.persistence.types.js";
import type { AddonResourceSnapshot } from "./addon-import.types.js";

type SnapshotRow = {
  characterId: string;
  resourceDefinitionId: string;
  quantity: number | null;
  maxQuantity: number | null;
  weeklyQuantity: number | null;
  maxWeeklyQuantity: number | null;
  isCapped: boolean | null;
  isWeeklyCapped: boolean | null;
  discovered: boolean | null;
  accountWide: boolean | null;
  source: string;
  capturedAt: Date;
};

function createTransaction() {
  const rows = new Map<string, SnapshotRow>();

  const transaction = {
    characterResourceSnapshot: {
      upsert: async (args: {
        where: {
          characterId_resourceDefinitionId: {
            characterId: string;
            resourceDefinitionId: string;
          };
        };
        create: SnapshotRow;
        update: Omit<
          SnapshotRow,
          "characterId" | "resourceDefinitionId"
        >;
      }) => {
        const { characterId, resourceDefinitionId } =
          args.where.characterId_resourceDefinitionId;
        const key = `${characterId}:${resourceDefinitionId}`;
        const existing = rows.get(key);

        const row: SnapshotRow = existing
          ? { ...existing, ...args.update }
          : { ...args.create };

        rows.set(key, row);
        return row;
      }
    }
  };

  return { transaction, rows };
}

function result(): CharacterPersistenceResult {
  return {
    characters: 0,
    professionAssignments: 0,
    progressEntries: 0,
    gearSlots: 0,
    resourceSnapshots: 0
  };
}

function snapshot(
  overrides: Partial<AddonResourceSnapshot> = {}
): AddonResourceSnapshot {
  return {
    schemaVersion: 1,
    capturedAt: "2026-08-27T21:12:46.000Z",
    currencies: [],
    items: [],
    ...overrides
  };
}

describe("AddonResourcePersistence", () => {
  it("persists a captured currency matching an enabled definition", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => [
        {
          id: "def-hero-dawncrest",
          key: "hero-dawncrest",
          scopeKey: "MIDNIGHT-S1",
          externalCurrencyId: 3345,
          externalItemId: null,
          name: "Hero Dawncrest",
          category: "UPGRADE",
          resetBehavior: "WEEKLY",
          ownershipScope: "CHARACTER",
          enabled: true,
          sortOrder: 0
        }
      ]
    });

    const trackResult = result();

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        currencies: [
          {
            currencyId: 3345,
            quantity: 120,
            maxQuantity: 2000,
            weeklyQuantity: 40,
            maxWeeklyQuantity: 90,
            isCapped: false,
            isWeeklyCapped: false,
            discovered: true,
            accountWide: false
          }
        ]
      }),
      trackResult
    );

    const row = rows.get("char-1:def-hero-dawncrest");

    expect(row?.quantity).toBe(120);
    expect(row?.weeklyQuantity).toBe(40);
    expect(row?.source).toBe("ADDON");
    expect(row?.capturedAt.toISOString()).toBe(
      "2026-08-27T21:12:46.000Z"
    );
    expect(trackResult.resourceSnapshots).toBe(1);
  });

  it("ignores a captured currency with no matching enabled definition", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => []
    });

    const trackResult = result();

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        currencies: [
          { currencyId: 9999999, quantity: 5 }
        ]
      }),
      trackResult
    );

    expect(rows.size).toBe(0);
    expect(trackResult.resourceSnapshots).toBe(0);
  });

  it("persists an item-backed resource matching an enabled definition", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => [
        {
          id: "def-spark-of-tides",
          key: "spark-of-tides",
          scopeKey: "MIDNIGHT-S1",
          externalCurrencyId: null,
          externalItemId: 274476,
          name: "Spark of Tides",
          category: "CRAFTING_GATE",
          resetBehavior: "WEEKLY",
          ownershipScope: "CHARACTER",
          enabled: true,
          sortOrder: 0
        }
      ]
    });

    const trackResult = result();

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        items: [
          {
            key: "spark-of-tides",
            itemId: 274476,
            count: 2
          }
        ]
      }),
      trackResult
    );

    const row = rows.get("char-1:def-spark-of-tides");

    expect(row?.quantity).toBe(2);
    expect(row?.maxQuantity).toBeNull();
    expect(row?.source).toBe("ADDON");
    expect(trackResult.resourceSnapshots).toBe(1);
  });

  it("ignores a captured item with no matching enabled definition", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => []
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        items: [
          { key: "unknown", itemId: 1, count: 1 }
        ]
      }),
      result()
    );

    expect(rows.size).toBe(0);
  });

  it("matches an item entry by itemId, not by the addon-provided key", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => [
        {
          id: "def-spark-of-tides",
          key: "spark-of-tides",
          scopeKey: "MIDNIGHT-S1",
          externalCurrencyId: null,
          externalItemId: 274476,
          name: "Spark of Tides",
          category: "CRAFTING_GATE",
          resetBehavior: "WEEKLY",
          ownershipScope: "CHARACTER",
          enabled: true,
          sortOrder: 0
        }
      ]
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        items: [
          {
            key: "totally-different-key",
            itemId: 274476,
            count: 3
          }
        ]
      }),
      result()
    );

    expect(
      rows.get("char-1:def-spark-of-tides")?.quantity
    ).toBe(3);
  });

  it("does nothing when the character has no resources module", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => {
        throw new Error(
          "should not be called when resources is null"
        );
      }
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      null,
      result()
    );

    expect(rows.size).toBe(0);
  });
});
