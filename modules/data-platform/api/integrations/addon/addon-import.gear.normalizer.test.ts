import { describe, expect, it } from "vitest";
import { normalizeGearSnapshot } from "./addon-import.gear.normalizer.js";
import type { LuaTable } from "./addon-import.types.js";

function gearModule(
  data: LuaTable,
  schemaVersion = 2
): LuaTable {
  return {
    version: "0.2.0",
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

  it("returns null for schemaVersion 1 rather than misreading or wiping it", () => {
    const result = normalizeGearSnapshot(
      gearModule({ slots: { HEAD: { equipped: false } } }, 1)
    );

    expect(result).toBeNull();
  });

  it("returns null for an unsupported future schema version", () => {
    const result = normalizeGearSnapshot(
      gearModule({ slots: { HEAD: { equipped: false } } }, 3)
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
        gemIds: [],
        expansionId: null,
        setId: null,
        setEvidenceResolved: null,
        setBonusResolved: null,
        setBonusSpellIds: null,
        uniqueCategoryId: null,
        uniqueCategoryCount: null,
        uniquenessResolved: null
      }
    ]);
  });

  it("normalizes a fully-enriched equipped slot with tier evidence", () => {
    const result = normalizeGearSnapshot(
      gearModule({
        currentExpansionId: 10,
        slots: {
          MAIN_HAND: {
            equipped: true,
            itemId: 12345,
            itemLink: "item:12345:6789:111::::0:0:80",
            itemLevel: 675,
            quality: 4,
            socketCount: 1,
            expansionId: 10,
            setId: null,
            setEvidenceResolved: true,
            setBonusResolved: true,
            setBonusSpellIds: {},
            uniqueCategoryId: 123,
            uniqueCategoryCount: 2,
            uniquenessResolved: true
          }
        }
      })
    );

    expect(result?.currentExpansionId).toBe(10);
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
        gemIds: [111],
        expansionId: 10,
        setId: null,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: [],
        uniqueCategoryId: 123,
        uniqueCategoryCount: 2,
        uniquenessResolved: true
      }
    ]);
  });

  it("normalizes setBonusSpellIds from a Lua array table", () => {
    const result = normalizeGearSnapshot(
      gearModule({
        currentExpansionId: 10,
        slots: {
          HEAD: {
            equipped: true,
            itemId: 99,
            itemLink: "item:99",
            itemLevel: 700,
            quality: 4,
            socketCount: 0,
            expansionId: 10,
            setId: 5001,
            setEvidenceResolved: true,
            setBonusResolved: true,
            setBonusSpellIds: { 1: 111, 2: 222 },
            uniquenessResolved: true
          }
        }
      })
    );

    expect(result?.slots[0]?.setBonusSpellIds).toEqual([111, 222]);
    expect(result?.slots[0]?.setId).toBe(5001);
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
            socketCount: null,
            setEvidenceResolved: false,
            setBonusResolved: false,
            uniquenessResolved: false
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
      socketCount: null,
      setEvidenceResolved: false,
      setBonusResolved: false,
      uniquenessResolved: false
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
