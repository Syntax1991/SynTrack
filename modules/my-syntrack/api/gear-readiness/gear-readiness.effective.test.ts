import { describe, expect, it } from "vitest";
import type { AuthoritativeEquipmentResult } from "../character-external-sync/character-external-sync.types.js";
import { resolveEffectiveGearItem } from "./gear-readiness.effective.js";
import type { AddonGearSlotRow } from "./gear-readiness.effective.js";

function addonRow(overrides: Partial<AddonGearSlotRow> = {}): AddonGearSlotRow {
  return {
    slotKey: "HEAD",
    itemId: 1000,
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
      filledSocketCount: 0
    }
  ],
  fetchedAt: new Date(),
  isStale: false
};

describe("resolveEffectiveGearItem", () => {
  it("uses Blizzard core fields (id/name/ilvl/socket) when a fresh Blizzard snapshot covers this slot", () => {
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);

    expect(result).toMatchObject({
      id: 271483,
      itemName: "Schlangenkrone des Schlangenorakels",
      itemLevel: 315,
      source: "BLIZZARD"
    });
  });

  it("derives enchantStatus from Blizzard's hasEnchant + the slot catalog's supportsEnchant, never guessing a display name", () => {
    // HEAD does not support enchants at all - NOT_APPLICABLE regardless of hasEnchant.
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);
    expect(result?.enchantStatus).toBe("NOT_APPLICABLE");

    const enchantableBlizzard: AuthoritativeEquipmentResult = {
      ...freshBlizzard,
      slots: [{ slotKey: "LEGS", itemId: 1, itemName: "Legs", itemLevel: 300, hasEnchant: true, socketCount: 0, filledSocketCount: 0 }]
    };
    const legsResult = resolveEffectiveGearItem("LEGS", addonRow({ slotKey: "LEGS" }), enchantableBlizzard);
    expect(legsResult?.enchantStatus).toBe("READY");

    const missingEnchantBlizzard: AuthoritativeEquipmentResult = {
      ...freshBlizzard,
      slots: [{ slotKey: "LEGS", itemId: 1, itemName: "Legs", itemLevel: 300, hasEnchant: false, socketCount: 0, filledSocketCount: 0 }]
    };
    const missingResult = resolveEffectiveGearItem("LEGS", addonRow({ slotKey: "LEGS" }), missingEnchantBlizzard);
    expect(missingResult?.enchantStatus).toBe("MISSING");
  });

  it("preserves addon-only tier/embellishment evidence even when Blizzard is the core-field source", () => {
    const result = resolveEffectiveGearItem("HEAD", addonRow(), freshBlizzard);

    expect(result).toMatchObject({
      setId: 2065,
      expansionId: 11,
      setEvidenceResolved: true,
      setBonusResolved: true,
      setBonusSpellIds: [1296629, 1296630],
      uniquenessResolved: true
    });
  });

  it("never fabricates an enchant display name from Blizzard - keeps the addon's own enchantName", () => {
    const result = resolveEffectiveGearItem("HEAD", addonRow({ enchantName: "Glorious Stats" }), freshBlizzard);

    expect(result?.enchantName).toBe("Glorious Stats");
  });

  it("falls back to the addon row unchanged when no Blizzard snapshot exists (source=ADDON overall)", () => {
    const addonOnlyResult: AuthoritativeEquipmentResult = {
      source: "ADDON",
      averageItemLevel: 300,
      slots: [],
      fetchedAt: null,
      isStale: false
    };

    const result = resolveEffectiveGearItem("HEAD", addonRow(), addonOnlyResult);

    expect(result).toMatchObject({ itemLevel: 300, source: "ADDON" });
  });

  it("falls back to the addon row unchanged when Blizzard has no slot for this specific key (partial coverage)", () => {
    const result = resolveEffectiveGearItem("FEET", addonRow({ slotKey: "FEET", itemLevel: 290 }), freshBlizzard);

    expect(result).toMatchObject({ itemLevel: 290, source: "ADDON" });
  });

  it("a MANUAL addon entry always wins outright, even over a fresh Blizzard snapshot", () => {
    const manualRow = addonRow({ source: "MANUAL", itemLevel: 999 });

    const result = resolveEffectiveGearItem("HEAD", manualRow, freshBlizzard);

    expect(result).toMatchObject({ itemLevel: 999, source: "MANUAL" });
  });

  it("returns null (untracked slot) when neither Blizzard nor addon has any data for this slot", () => {
    const result = resolveEffectiveGearItem("WAIST", undefined, freshBlizzard);

    expect(result).toBeNull();
  });
});
