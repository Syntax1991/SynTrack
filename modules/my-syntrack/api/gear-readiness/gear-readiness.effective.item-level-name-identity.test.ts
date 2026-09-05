import { describe, expect, it } from "vitest";
import type { AuthoritativeEquipmentResult } from "../character-external-sync/character-external-sync.types.js";
import { resolveEffectiveGearItem } from "./gear-readiness.effective.js";
import type { AddonGearSlotRow } from "./gear-readiness.effective.js";

/*
 * Phase F2 corrective review follow-up: the item-identity compatibility
 * guard (gear-readiness.effective.item-identity.test.ts) originally
 * covered Group B evidence + the addon setId fallback only. This file
 * covers the follow-up fix extending the SAME guard to itemLevel's and
 * itemName's own addon fallback - split into its own file to stay under
 * the 350-line architecture cap.
 */

function addonRow(overrides: Partial<AddonGearSlotRow> = {}): AddonGearSlotRow {
  return {
    id: "row-cuid-1",
    slotKey: "HEAD",
    itemId: 271483,
    itemName: "Old Addon Helm",
    itemLevel: 300,
    enchantStatus: "READY",
    enchantName: "Glorious Stats",
    socketCount: 1,
    gemCount: 1,
    notes: "manual note",
    source: "ADDON",
    lastSyncedAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
    setId: 2065,
    expansionId: 11,
    setEvidenceResolved: true,
    setBonusResolved: true,
    setBonusSpellIds: "[1296629,1296630]",
    uniqueCategoryId: null,
    uniqueCategoryCount: null,
    uniquenessResolved: true,
    ...overrides
  };
}

const freshBlizzard: AuthoritativeEquipmentResult = {
  source: "BLIZZARD",
  averageItemLevel: 320,
  slots: [
    {
      slotKey: "HEAD",
      itemId: 271483,
      itemName: "Schlangenkrone des Schlangenorakels",
      itemLevel: 315,
      hasEnchant: false,
      socketCount: 0,
      filledSocketCount: 0,
      setId: 2065
    }
  ],
  fetchedAt: new Date(),
  isStale: false
};

describe("resolveEffectiveGearItem - itemLevel/itemName identity gap follow-up", () => {
  // CASE A - SAME ITEM: Synbeast's real Timewalking HEAD. Blizzard's
  // itemLevel is null (timewalker_level invalidated it upstream), but
  // the addon's item is confirmed to be the exact same one (219749), so
  // its real itemLevel (473) is a safe field-level fallback.
  it("CASE A - same item: invalid Blizzard ilvl (Timewalking) still falls back to the addon's ilvl", () => {
    const scaledBlizzard: AuthoritativeEquipmentResult = {
      source: "BLIZZARD",
      averageItemLevel: 320,
      slots: [
        {
          slotKey: "HEAD",
          itemId: 219749,
          itemName: "Verkohlter Neruberhelm",
          itemLevel: null, // authority layer already distrusted this
          hasEnchant: false,
          socketCount: 0,
          filledSocketCount: 0,
          setId: null
        }
      ],
      fetchedAt: new Date(),
      isStale: false
    };
    const addonSameItem = addonRow({ itemId: 219749, itemLevel: 473 });

    const result = resolveEffectiveGearItem("HEAD", addonSameItem, scaledBlizzard);

    expect(result).toMatchObject({
      itemId: 219749,
      itemLevel: 473,
      itemLevelSource: "ADDON"
    });
  });

  // CASE B - DIFFERENT ITEM: Blizzard's itemLevel is null for a
  // DIFFERENT item than the addon's stored row - the addon's 500 must
  // never be attached to Blizzard's item 200.
  it("CASE B - different item: addon ilvl is never attached to a mismatched Blizzard item", () => {
    const blizzardDifferentItem: AuthoritativeEquipmentResult = {
      source: "BLIZZARD",
      averageItemLevel: 320,
      slots: [
        {
          slotKey: "HEAD",
          itemId: 200,
          itemName: "New Item",
          itemLevel: null,
          hasEnchant: false,
          socketCount: 0,
          filledSocketCount: 0,
          setId: null
        }
      ],
      fetchedAt: new Date(),
      isStale: false
    };
    const addonOldDifferentItem = addonRow({ itemId: 100, itemName: "Old Item", itemLevel: 500 });

    const result = resolveEffectiveGearItem("HEAD", addonOldDifferentItem, blizzardDifferentItem);

    expect(result).toMatchObject({
      itemId: 200,
      itemName: "New Item",
      itemLevel: null,
      itemLevelSource: null
    });
  });

  // CASE C - DIFFERENT ITEM + BLIZZARD NAME NULL: missing information
  // (itemName "") is preferable to false information (the old item's name).
  it("CASE C - different item, Blizzard name null: itemName resolves to unknown, never the old item's name", () => {
    const blizzardDifferentItemNoName: AuthoritativeEquipmentResult = {
      source: "BLIZZARD",
      averageItemLevel: 320,
      slots: [
        {
          slotKey: "HEAD",
          itemId: 200,
          itemName: null,
          itemLevel: 250,
          hasEnchant: false,
          socketCount: 0,
          filledSocketCount: 0,
          setId: null
        }
      ],
      fetchedAt: new Date(),
      isStale: false
    };
    const addonOldDifferentItem = addonRow({ itemId: 100, itemName: "Old Item" });

    const result = resolveEffectiveGearItem("HEAD", addonOldDifferentItem, blizzardDifferentItemNoName);

    expect(result?.itemName).toBe("");
  });

  // CASE D - NO BLIZZARD SLOT AT ALL: the identity guard only applies
  // when composing addon fallback fields onto an EXISTING Blizzard slot;
  // with no Blizzard coverage at all, the addon row is used normally.
  it("CASE D - no Blizzard slot at all: addon row used normally, unaffected by the identity guard", () => {
    const result = resolveEffectiveGearItem("FEET", addonRow({ slotKey: "FEET", itemId: 100, itemLevel: 290 }), freshBlizzard);

    expect(result).toMatchObject({ itemId: 100, itemLevel: 290, source: "ADDON" });
  });

  it("MANUAL precedence remains unaffected by the itemLevel/itemName identity gate", () => {
    const manualRow = addonRow({
      source: "MANUAL",
      itemId: 555,
      itemName: "Manually Entered Item",
      itemLevel: 999
    });

    const result = resolveEffectiveGearItem("HEAD", manualRow, freshBlizzard);

    expect(result).toMatchObject({
      source: "MANUAL",
      itemId: 555,
      itemName: "Manually Entered Item",
      itemLevel: 999
    });
  });

  it("real Synlight mismatch stays fully isolated: itemLevel and itemName also unaffected by the stale addon item", () => {
    const blizzardSynlightHead: AuthoritativeEquipmentResult = {
      source: "BLIZZARD",
      averageItemLevel: 312.6875,
      slots: [
        {
          slotKey: "HEAD",
          itemId: 271465,
          itemName: "Kriegshelm der geweihten Flamme",
          itemLevel: 311,
          hasEnchant: true,
          socketCount: 0,
          filledSocketCount: 0,
          setId: 2062
        }
      ],
      fetchedAt: new Date(),
      isStale: false
    };
    const addonSynlightStaleHead = addonRow({ itemId: 277768, itemName: null, itemLevel: 295 });

    const result = resolveEffectiveGearItem("HEAD", addonSynlightStaleHead, blizzardSynlightHead);

    expect(result).toMatchObject({
      itemId: 271465,
      itemName: "Kriegshelm der geweihten Flamme",
      itemLevel: 311, // Blizzard's own real (non-null) value - the addon fallback never even needed to trigger
      itemLevelSource: "BLIZZARD",
      setId: 2062,
      setIdSource: "BLIZZARD"
    });
  });

  it("real Synblast matching-tier composition is unaffected: itemLevel/itemName still Blizzard-primary with full addon evidence alongside", () => {
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);

    expect(result).toMatchObject({
      itemId: 271483,
      itemName: "Schlangenkrone des Schlangenorakels",
      itemLevel: 315,
      itemLevelSource: "BLIZZARD",
      setId: 2065,
      setBonusResolved: true
    });
  });
});
