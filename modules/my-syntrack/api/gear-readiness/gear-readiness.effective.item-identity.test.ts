import { describe, expect, it } from "vitest";
import type { AuthoritativeEquipmentResult } from "../character-external-sync/character-external-sync.types.js";
import { resolveEffectiveGearItem } from "./gear-readiness.effective.js";
import type { AddonGearSlotRow } from "./gear-readiness.effective.js";

/*
 * Phase F2 corrective review: item-identity compatibility for Group B
 * evidence merging. Split out of gear-readiness.effective.test.ts to
 * stay under the 350-line architecture cap - see that file for the
 * general resolveEffectiveGearItem coverage this extends.
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

describe("resolveEffectiveGearItem - item-identity compatibility (Phase F2 corrective review, real Synlight evidence)", () => {
  // Real live data: Synlight's HEAD slot showed Blizzard reporting a
  // freshly-equipped item (271465) while the addon's stored row still
  // described an older, since-replaced item (277768) it hadn't synced
  // since. The addon's Group B evidence describes item 277768, not
  // 271465 - it must never be attached to the Blizzard-identified item.
  const blizzardNewItem: AuthoritativeEquipmentResult = {
    source: "BLIZZARD",
    averageItemLevel: 312.6875,
    slots: [
      {
        slotKey: "HEAD",
        itemId: 271465,
        itemName: "New Blizzard Item",
        itemLevel: 295,
        hasEnchant: false,
        socketCount: 0,
        filledSocketCount: 0,
        setId: null // Blizzard reports no tier set for this specific item
      }
    ],
    fetchedAt: new Date(),
    isStale: false
  };

  const addonOldItem = addonRow({
    itemId: 277768,
    itemName: "Stale Addon Item",
    setId: 2065,
    setBonusResolved: true,
    setBonusSpellIds: "[1296629,1296630]",
    uniqueCategoryId: 512,
    uniqueCategoryCount: 1,
    uniquenessResolved: true,
    enchantName: "Old Enchant"
  });

  it("suppresses the addon setId fallback when item ids differ", () => {
    const result = resolveEffectiveGearItem("HEAD", addonOldItem, blizzardNewItem);

    expect(result).toMatchObject({ itemId: 271465, setId: null, setIdSource: null });
  });

  it("suppresses setBonusResolved when item ids differ", () => {
    const result = resolveEffectiveGearItem("HEAD", addonOldItem, blizzardNewItem);

    expect(result?.setBonusResolved).toBeNull();
  });

  it("suppresses setBonusSpellIds when item ids differ", () => {
    const result = resolveEffectiveGearItem("HEAD", addonOldItem, blizzardNewItem);

    expect(result?.setBonusSpellIds).toBeNull();
  });

  it("suppresses uniqueCategoryId/uniqueCategoryCount/uniquenessResolved when item ids differ", () => {
    const result = resolveEffectiveGearItem("HEAD", addonOldItem, blizzardNewItem);

    expect(result).toMatchObject({
      uniqueCategoryId: null,
      uniqueCategoryCount: null,
      uniquenessResolved: null
    });
  });

  it("suppresses enchantName/notes/expansionId/setEvidenceResolved when item ids differ (any other item-specific evidence)", () => {
    const result = resolveEffectiveGearItem("HEAD", addonOldItem, blizzardNewItem);

    expect(result).toMatchObject({
      enchantName: null,
      notes: null,
      expansionId: null,
      setEvidenceResolved: null
    });
  });

  it("Blizzard's own setId still wins even when the addon's item is mismatched", () => {
    const blizzardNewItemWithSetId: AuthoritativeEquipmentResult = {
      ...blizzardNewItem,
      slots: [{ ...blizzardNewItem.slots[0]!, setId: 2062 }]
    };

    const result = resolveEffectiveGearItem("HEAD", addonOldItem, blizzardNewItemWithSetId);

    expect(result).toMatchObject({ setId: 2062, setIdSource: "BLIZZARD" });
  });

  it("never confirms sameness by database row id, item name, or slot alone - only the real WoW item id", () => {
    // Same database row id and slot key as a matching-item fixture would
    // have, but a genuinely different itemId - must still be treated as
    // a different item.
    const result = resolveEffectiveGearItem(
      "HEAD",
      addonRow({ id: "row-cuid-1", slotKey: "HEAD", itemId: 999999 }),
      freshBlizzard
    );

    expect(result?.setBonusResolved).toBeNull();
  });

  it("real item identity match (Synblast tier pieces) still preserves all addon Group B evidence and Blizzard setId primacy", () => {
    // Re-confirms the non-corrective-review case still works: matching
    // item ids -> full evidence preserved, exactly as Phase F2 verified
    // live for Synblast's 4 real tier pieces.
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);

    expect(result).toMatchObject({
      setId: 2065,
      setIdSource: "BLIZZARD",
      setBonusResolved: true,
      setBonusSpellIds: [1296629, 1296630],
      uniquenessResolved: true
    });
  });

  it("MANUAL precedence is completely unaffected by the item-identity check - a manual row wins outright regardless of Blizzard's item id", () => {
    const manualRow = addonRow({
      source: "MANUAL",
      itemId: 555, // deliberately different from Blizzard's itemId - must not matter
      setId: 2065,
      setBonusResolved: true
    });

    const result = resolveEffectiveGearItem("HEAD", manualRow, blizzardNewItem);

    expect(result).toMatchObject({
      source: "MANUAL",
      itemId: 555,
      setId: 2065,
      setBonusResolved: true
    });
  });

  describe("null/missing item ids - conservative default (never guess sameness)", () => {
    it("treats a null Blizzard itemId as NOT confirmed the same item, even if the addon has a real itemId", () => {
      const blizzardNullItemId: AuthoritativeEquipmentResult = {
        ...freshBlizzard,
        slots: [{ ...freshBlizzard.slots[0]!, itemId: null }]
      };

      const result = resolveEffectiveGearItem("HEAD", addonRow(), blizzardNullItemId);

      // Cannot prove sameness -> Group B evidence withheld, not guessed.
      expect(result?.setBonusResolved).toBeNull();
    });

    it("treats a null addon itemId as NOT confirmed the same item, even if Blizzard has a real itemId", () => {
      const addonNullItemId = addonRow({ itemId: null });

      const result = resolveEffectiveGearItem("HEAD", addonNullItemId, freshBlizzard);

      expect(result?.setBonusResolved).toBeNull();
    });

    it("treats both sides null as NOT confirmed the same item - never assumes equality from absence", () => {
      const blizzardNullItemId: AuthoritativeEquipmentResult = {
        ...freshBlizzard,
        slots: [{ ...freshBlizzard.slots[0]!, itemId: null }]
      };
      const addonNullItemId = addonRow({ itemId: null });

      const result = resolveEffectiveGearItem("HEAD", addonNullItemId, blizzardNullItemId);

      expect(result?.setBonusResolved).toBeNull();
    });
  });
});
