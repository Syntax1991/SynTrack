import { describe, expect, it } from "vitest";
import { AddonResourcePersistence } from "./addon-import.resource.persistence.js";
import {
  createTransaction,
  heroDawncrestDefinition,
  result,
  snapshot,
  sparkOfTidesDefinition
} from "./addon-import.resource.persistence.test-helpers.js";

describe("AddonResourcePersistence", () => {
  it("persists a captured currency matching an enabled definition", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => [
        heroDawncrestDefinition()
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
          {
            currencyId: 9999999,
            quantity: 5,
            maxQuantity: null,
            weeklyQuantity: null,
            maxWeeklyQuantity: null,
            isCapped: null,
            isWeeklyCapped: null,
            discovered: null,
            accountWide: null
          }
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
        sparkOfTidesDefinition()
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
        sparkOfTidesDefinition()
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
