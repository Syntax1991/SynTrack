import { describe, expect, it } from "vitest";
import { AddonResourcePersistence } from "./addon-import.resource.persistence.js";
import {
  createTransaction,
  heroDawncrestDefinition,
  result,
  snapshot
} from "./addon-import.resource.persistence.test-helpers.js";

describe("AddonResourcePersistence - latest-state and per-character identity", () => {
  it("upserts the latest state on a second capture rather than duplicating the row", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => [
        heroDawncrestDefinition()
      ]
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        capturedAt: "2026-08-27T19:00:00.000Z",
        currencies: [
          {
            currencyId: 3345,
            quantity: 100,
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
      result()
    );

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        capturedAt: "2026-08-27T21:00:00.000Z",
        currencies: [
          {
            currencyId: 3345,
            quantity: 140,
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
      result()
    );

    expect(rows.size).toBe(1);

    const row = rows.get(
      "char-1:def-hero-dawncrest"
    );

    expect(row?.quantity).toBe(140);
    expect(row?.capturedAt.toISOString()).toBe(
      "2026-08-27T21:00:00.000Z"
    );
  });

  it("persisting one character's resources never touches another character's rows", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonResourcePersistence({
      listEnabledForActiveSeason: async () => [
        heroDawncrestDefinition()
      ]
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        currencies: [
          {
            currencyId: 3345,
            quantity: 100,
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
      result()
    );

    await persistence.persist(
      transaction as never,
      "char-2",
      snapshot({
        currencies: [
          {
            currencyId: 3345,
            quantity: 999,
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
      result()
    );

    expect(
      rows.get("char-1:def-hero-dawncrest")
        ?.quantity
    ).toBe(100);

    expect(
      rows.get("char-2:def-hero-dawncrest")
        ?.quantity
    ).toBe(999);
  });
});
