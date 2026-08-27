import { describe, expect, it } from "vitest";
import { normalizeGearSnapshot } from "./addon-import.gear.normalizer.js";
import type { LuaTable } from "./addon-import.types.js";

function gearModule(
  data: LuaTable,
  schemaVersion = 1
): LuaTable {
  return {
    version: "0.1.0",
    schemaVersion,
    capturedAt: 1787857509,
    reason: "test",
    data
  };
}

describe("normalizeGearSnapshot", () => {
  it("returns null when the gear module is entirely absent", () => {
    expect(normalizeGearSnapshot(undefined)).toBeNull();
  });

  it("returns null for an unsupported schema version rather than misreading it", () => {
    const result = normalizeGearSnapshot(
      gearModule({ slots: { HEAD: { equipped: false } } }, 2)
    );

    expect(result).toBeNull();
  });

  it("normalizes a confirmed-empty slot", () => {
    const result = normalizeGearSnapshot(
      gearModule({ slots: { HEAD: { equipped: false } } })
    );

    expect(result?.slots).toEqual([
      {
        slotKey: "HEAD",
        equipped: false,
        itemId: null,
        itemLink: null,
        itemLevel: null,
        quality: null,
        socketCount: null,
        enchantId: null,
        gemIds: []
      }
    ]);
  });

  it("normalizes a fully-enriched equipped slot", () => {
    const result = normalizeGearSnapshot(
      gearModule({
        slots: {
          MAIN_HAND: {
            equipped: true,
            itemId: 12345,
            itemLink: "item:12345:6789:111::::0:0:80",
            itemLevel: 675,
            quality: 4,
            socketCount: 1
          }
        }
      })
    );

    expect(result?.slots).toEqual([
      {
        slotKey: "MAIN_HAND",
        equipped: true,
        itemId: 12345,
        itemLink: "item:12345:6789:111::::0:0:80",
        itemLevel: 675,
        quality: 4,
        socketCount: 1,
        enchantId: 6789,
        gemIds: [111]
      }
    ]);
  });

  it("keeps an equipped slot present even when enrichment fields are all null", () => {
    const result = normalizeGearSnapshot(
      gearModule({
        slots: {
          TRINKET_1: {
            equipped: true,
            itemId: 999,
            itemLink: "item:999",
            itemLevel: null,
            quality: null,
            socketCount: null
          }
        }
      })
    );

    expect(result?.slots).toHaveLength(1);
    expect(result?.slots[0]).toMatchObject({
      slotKey: "TRINKET_1",
      equipped: true,
      itemId: 999,
      itemLevel: null,
      quality: null,
      socketCount: null
    });
  });

  it("ignores an unknown slot key rather than persisting garbage", () => {
    const result = normalizeGearSnapshot(
      gearModule({
        slots: {
          RANGED: { equipped: true, itemId: 1, itemLink: "item:1" }
        }
      })
    );

    expect(result?.slots).toEqual([]);
  });

  it("carries the module's own capturedAt through as an ISO string", () => {
    const result = normalizeGearSnapshot(
      gearModule({ slots: { HEAD: { equipped: false } } })
    );

    expect(result?.capturedAt).toBe(
      new Date(1787857509 * 1000).toISOString()
    );
  });

  it("returns null when data.slots is missing entirely", () => {
    const result = normalizeGearSnapshot(gearModule({}));

    expect(result).toBeNull();
  });
});
