import { describe, expect, it } from "vitest";
import { normalizeResourceSnapshot } from "./addon-import.resource.normalizer.js";
import type { LuaTable } from "./addon-import.types.js";

function resourcesModule(
  data: LuaTable,
  schemaVersion = 1
): LuaTable {
  return {
    schemaVersion,
    capturedAt: 1787865166,
    data
  };
}

describe("normalizeResourceSnapshot", () => {
  it("normalizes a fully-populated currency row", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {
          "1": {
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
        },
        items: {}
      })
    );

    expect(snapshot?.currencies).toEqual([
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
    ]);
  });

  it("preserves a real quantity of 0 rather than dropping the row", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {
          "1": { currencyId: 3345, quantity: 0 }
        },
        items: {}
      })
    );

    expect(snapshot?.currencies[0]?.quantity).toBe(0);
  });

  it("returns null for an absent resources module", () => {
    expect(
      normalizeResourceSnapshot(undefined)
    ).toBeNull();
  });

  it("returns null for an unsupported schemaVersion", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({ currencies: {}, items: {} }, 2)
    );

    expect(snapshot).toBeNull();
  });

  it("keeps maxQuantity null rather than defaulting to 0", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {
          "1": { currencyId: 3345, quantity: 5 }
        },
        items: {}
      })
    );

    expect(snapshot?.currencies[0]?.maxQuantity).toBeNull();
  });

  it("keeps weekly fields null rather than defaulting to 0", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {
          "1": { currencyId: 3345, quantity: 5 }
        },
        items: {}
      })
    );

    expect(
      snapshot?.currencies[0]?.weeklyQuantity
    ).toBeNull();
    expect(
      snapshot?.currencies[0]?.maxWeeklyQuantity
    ).toBeNull();
  });

  it("keeps isCapped/isWeeklyCapped null when the addon never set them, distinct from a real false", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {
          "1": { currencyId: 3345, quantity: 5 },
          "2": {
            currencyId: 3346,
            quantity: 90,
            isCapped: true,
            isWeeklyCapped: false
          }
        },
        items: {}
      })
    );

    expect(snapshot?.currencies[0]?.isCapped).toBeNull();
    expect(
      snapshot?.currencies[0]?.isWeeklyCapped
    ).toBeNull();
    expect(snapshot?.currencies[1]?.isCapped).toBe(true);
    expect(
      snapshot?.currencies[1]?.isWeeklyCapped
    ).toBe(false);
  });

  it("preserves accountWide true and false distinctly", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {
          "1": {
            currencyId: 3345,
            quantity: 5,
            accountWide: true
          },
          "2": {
            currencyId: 3346,
            quantity: 5,
            accountWide: false
          }
        },
        items: {}
      })
    );

    expect(snapshot?.currencies[0]?.accountWide).toBe(
      true
    );
    expect(snapshot?.currencies[1]?.accountWide).toBe(
      false
    );
  });

  it("drops a currency row with a malformed/missing currencyId", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {
          "1": { currencyId: "not-a-number", quantity: 5 },
          "2": { quantity: 5 },
          "3": { currencyId: 0, quantity: 5 },
          "4": { currencyId: -5, quantity: 5 }
        },
        items: {}
      })
    );

    expect(snapshot?.currencies).toEqual([]);
  });

  it("normalizes an item-backed resource entry", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {},
        items: {
          "1": {
            key: "spark-of-tides",
            itemId: 274476,
            count: 2
          }
        }
      })
    );

    expect(snapshot?.items).toEqual([
      { key: "spark-of-tides", itemId: 274476, count: 2 }
    ]);
  });

  it("drops an item entry with a malformed/missing itemId", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {},
        items: {
          "1": { key: "bad", itemId: 0, count: 2 }
        }
      })
    );

    expect(snapshot?.items).toEqual([]);
  });

  it("falls back to the itemId as the key when the addon omits it", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({
        currencies: {},
        items: {
          "1": { itemId: 274476, count: 1 }
        }
      })
    );

    expect(snapshot?.items[0]?.key).toBe("274476");
  });

  it("returns empty arrays (not null) when data.currencies/items are both missing", () => {
    const snapshot = normalizeResourceSnapshot(
      resourcesModule({} as LuaTable)
    );

    expect(snapshot?.currencies).toEqual([]);
    expect(snapshot?.items).toEqual([]);
  });
});
